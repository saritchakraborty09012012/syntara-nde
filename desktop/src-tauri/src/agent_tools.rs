//! Phase 4b: the agent's tools as desktop commands.
//!
//! The model proposes a tool call in `web/src/lib/agent/loop.ts`; the webview
//! executes it here, inside the desktop shell, scoped to one project root
//! folder chosen by the user. Safety rules (AGENTS 25/60/68):
//!
//! - every filesystem path is resolved UNDER the project root: absolute
//!   paths, `..`, drive prefixes and symlink escapes are refused;
//! - `proc_run` never touches a shell: it takes an argv array, drains both
//!   pipes on threads (no pipe-buffer deadlock), kills on timeout and caps
//!   how much output it keeps;
//! - the UI additionally gates `fs_write`/`proc_run` with a once/always/deny
//!   prompt (see `web/src/lib/agent/permissions.ts`); this module enforces
//!   the structural limits that must hold regardless of that prompt.
//!
//! Commands are `pub` and the module is exposed from `lib.rs` so the
//! contract tests in `tests/agent_tools_contract.rs` can exercise the pure
//! bodies as an integration target (unit-test harnesses cannot embed the
//! comctl32 v6 manifest; see build.rs and Cargo.toml `[lib] test`).

use std::ffi::OsString;
use std::fs;
use std::io::Read;
use std::path::{Component, Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::{AppHandle, Manager};

/// Text returned by `fs_read` stops here (256 KiB) — enough for source
/// files; larger ones come back `truncated` instead of bloating context.
pub const READ_MAX_BYTES: u64 = 256 * 1024;
/// `fs_write` refuses bigger payloads outright (1 MiB).
pub const WRITE_MAX_BYTES: usize = 1024 * 1024;
/// `fs_list` reports at most this many entries per folder.
pub const LIST_MAX_ENTRIES: usize = 500;
/// Default `proc_run` wall-clock budget; callers may lower it, never raise
/// it past `PROC_TIMEOUT_MAX_S`.
pub const PROC_TIMEOUT_DEFAULT_S: u64 = 60;
pub const PROC_TIMEOUT_MAX_S: u64 = 300;
/// Per-stream output kept from a child process (64 KiB); beyond that the
/// stream keeps being drained but the excess is dropped and flagged.
pub const PROC_OUTPUT_CAP: usize = 64 * 1024;
/// In-memory todo list limits.
pub const TODO_MAX_ITEMS: usize = 200;
pub const TODO_MAX_CHARS: usize = 2000;

// ------------------------------------------------------------ path scoping

/// Resolve `relative` inside `root`, refusing anything that could escape:
/// absolute/rooted paths, `..`, drive prefixes, and symlinked ancestors
/// whose canonical target leaves the root.
pub fn resolve_under(root: &Path, relative: &str) -> Result<PathBuf, String> {
    let rel = Path::new(relative);
    if rel.is_absolute() || rel.has_root() {
        return Err(format!(
            "path '{relative}' is absolute — give a path inside the project folder"
        ));
    }
    for component in rel.components() {
        match component {
            Component::Normal(_) | Component::CurDir => {}
            _ => {
                return Err(format!(
                    "path '{relative}' escapes the project folder — stay inside it"
                ));
            }
        }
    }

    let root_canon = fs::canonicalize(root)
        .map_err(|e| format!("project folder '{}' is not readable: {e}", root.display()))?;
    let mut existing = root_canon.join(rel);
    let mut tail: Vec<OsString> = Vec::new();
    loop {
        match fs::canonicalize(&existing) {
            Ok(canonical) => {
                if !canonical.starts_with(&root_canon) {
                    return Err(format!(
                        "path '{relative}' resolves outside the project folder (symbolic link?)"
                    ));
                }
                let mut out = canonical;
                for part in tail.iter().rev() {
                    out.push(part);
                }
                return Ok(out);
            }
            Err(_) => match (existing.file_name(), existing.parent()) {
                (Some(name), Some(parent)) => {
                    tail.push(name.to_os_string());
                    existing = parent.to_path_buf();
                }
                _ => {
                    return Err(format!(
                        "path '{relative}' does not exist inside the project folder"
                    ));
                }
            },
        }
    }
}

// ----------------------------------------------------------------- fs_read

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileRead {
    /// The path as the caller gave it (relative, for the UI).
    pub path: String,
    pub content: String,
    /// Full file size in bytes on disk.
    pub size: u64,
    /// True when only the first `READ_MAX_BYTES` were returned.
    pub truncated: bool,
}

/// Read a UTF-8 text file under `root`. Binary and non-UTF-8 files are
/// refused with an honest reason rather than lossy garbage in the context.
pub fn read_file(root: &Path, relative: &str, max_bytes: u64) -> Result<FileRead, String> {
    let target = resolve_under(root, relative)?;
    let meta = fs::metadata(&target)
        .map_err(|_| format!("no file at '{relative}' inside the project folder"))?;
    if meta.is_dir() {
        return Err(format!(
            "'{relative}' is a folder — use fs_list to look inside it"
        ));
    }
    let mut file =
        fs::File::open(&target).map_err(|e| format!("could not open '{relative}': {e}"))?;
    let mut buffer = Vec::new();
    file.by_ref()
        .take(max_bytes + 1)
        .read_to_end(&mut buffer)
        .map_err(|e| format!("could not read '{relative}': {e}"))?;
    let truncated = buffer.len() as u64 > max_bytes;
    if truncated {
        buffer.truncate(max_bytes as usize);
    }
    if buffer.contains(&0) {
        return Err(format!(
            "'{relative}' looks like a binary file (NUL byte) — fs_read only serves text"
        ));
    }
    let content = String::from_utf8(buffer).map_err(|_| {
        format!("'{relative}' is not valid UTF-8 text — fs_read only serves text files")
    })?;
    Ok(FileRead {
        path: relative.to_string(),
        content,
        size: meta.len(),
        truncated,
    })
}

// ----------------------------------------------------------------- fs_list

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirEntryInfo {
    pub name: String,
    /// `dir` | `file` | `symlink` | `other`
    pub kind: String,
    /// Byte size for files; null for folders.
    pub size: Option<u64>,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirList {
    pub path: String,
    pub entries: Vec<DirEntryInfo>,
    /// True when more entries exist than `max_entries` allowed.
    pub truncated: bool,
}

/// List one folder under `root`; folders sort before files, then by name.
pub fn list_dir(root: &Path, relative: &str, max_entries: usize) -> Result<DirList, String> {
    let target = resolve_under(root, relative)?;
    let meta = fs::metadata(&target)
        .map_err(|_| format!("no folder at '{relative}' inside the project folder"))?;
    if !meta.is_dir() {
        return Err(format!("'{relative}' is a file — use fs_read to open it"));
    }
    let read = fs::read_dir(&target).map_err(|e| format!("could not list '{relative}': {e}"))?;
    let mut entries: Vec<DirEntryInfo> = Vec::new();
    let mut truncated = false;
    for entry in read {
        let entry = match entry {
            Ok(entry) => entry,
            Err(e) => return Err(format!("could not list '{relative}': {e}")),
        };
        if entries.len() >= max_entries {
            truncated = true;
            continue;
        }
        let file_type = entry.file_type().ok();
        let (kind, size) = match &file_type {
            Some(t) if t.is_dir() => ("dir", None),
            Some(t) if t.is_symlink() => ("symlink", None),
            Some(t) if t.is_file() => ("file", entry.metadata().ok().map(|m| m.len())),
            Some(_) => ("other", None),
            None => ("other", None),
        };
        entries.push(DirEntryInfo {
            name: entry.file_name().to_string_lossy().into_owned(),
            kind: kind.to_string(),
            size,
        });
    }
    entries.sort_by(|a, b| {
        let a_dir = a.kind == "dir";
        let b_dir = b.kind == "dir";
        b_dir.cmp(&a_dir).then_with(|| a.name.cmp(&b.name))
    });
    Ok(DirList {
        path: relative.to_string(),
        entries,
        truncated,
    })
}

// ---------------------------------------------------------------- fs_write

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileWrite {
    pub path: String,
    pub bytes: usize,
}

/// Create-or-overwrite a UTF-8 text file under `root` (parent folders are
/// created as needed).
pub fn write_file(
    root: &Path,
    relative: &str,
    content: &str,
    max_bytes: usize,
) -> Result<FileWrite, String> {
    if relative.trim().is_empty() {
        return Err("a target path is required".to_string());
    }
    if content.len() > max_bytes {
        return Err(format!(
            "refusing to write {} bytes — the limit is {max_bytes}",
            content.len()
        ));
    }
    let target = resolve_under(root, relative)?;
    if target.is_dir() {
        return Err(format!("'{relative}' is a folder — give a file path"));
    }
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("could not create the folder for '{relative}': {e}"))?;
    }
    fs::write(&target, content.as_bytes())
        .map_err(|e| format!("could not write '{relative}': {e}"))?;
    Ok(FileWrite {
        path: relative.to_string(),
        bytes: content.len(),
    })
}

// ---------------------------------------------------------------- proc_run

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcRun {
    /// null when the child died from a signal (or never started cleanly).
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    /// True when the timeout fired and the child was killed.
    pub timed_out: bool,
    /// True when output beyond `cap` was drained but not kept.
    pub truncated: bool,
    pub duration_ms: u64,
}

/// Drain a pipe into at most `cap` bytes: keep reading so the child never
/// blocks on a full pipe, but stop storing once the cap is reached.
/// (Public for tests/agent_tools_contract.rs.)
pub fn drain_capped<R: Read>(mut reader: R, cap: usize) -> (Vec<u8>, bool) {
    let mut kept = Vec::new();
    let mut chunk = [0u8; 8192];
    let mut truncated = false;
    loop {
        match reader.read(&mut chunk) {
            Ok(0) => break,
            Ok(n) => {
                if kept.len() < cap {
                    let take = (cap - kept.len()).min(n);
                    kept.extend_from_slice(&chunk[..take]);
                    if take < n {
                        truncated = true;
                    }
                } else {
                    truncated = true;
                }
            }
            Err(_) => break,
        }
    }
    (kept, truncated)
}

fn has_path_separator(program: &str) -> bool {
    program.contains('/') || program.contains('\\') || program.ends_with(':')
}

/// Run one argv array to completion with a hard timeout — never through a
/// shell. `cwd` must already be inside the project root (callers use
/// `resolve_under`). Path-like program names are resolved under `root`;
/// bare names go through the OS search path (`git`, `python`, ...).
pub fn run_process(
    argv: &[String],
    cwd: &Path,
    root: &Path,
    timeout: Duration,
    cap: usize,
) -> Result<ProcRun, String> {
    let program = argv
        .first()
        .map(String::as_str)
        .filter(|p| !p.trim().is_empty())
        .ok_or_else(|| "argv must start with a program".to_string())?;
    let program_path = if has_path_separator(program) {
        let resolved = resolve_under(root, program)?;
        if !resolved.is_file() {
            return Err(format!(
                "no executable at '{program}' inside the project folder"
            ));
        }
        resolved
    } else {
        PathBuf::from(program)
    };

    let mut command = Command::new(program_path);
    command
        .args(&argv[1..])
        .current_dir(cwd)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(crate::host::CREATE_NO_WINDOW);
    }

    let started = Instant::now();
    let mut child = command.spawn().map_err(|e| {
        format!("could not start '{program}': {e} (checked the PATH and the project folder)")
    })?;
    let out_pipe = child.stdout.take();
    let err_pipe = child.stderr.take();
    let out_thread = std::thread::spawn(move || {
        out_pipe
            .map(|pipe| drain_capped(pipe, cap))
            .unwrap_or_default()
    });
    let err_thread = std::thread::spawn(move || {
        err_pipe
            .map(|pipe| drain_capped(pipe, cap))
            .unwrap_or_default()
    });

    let deadline = started + timeout;
    let mut timed_out = false;
    let exit_code = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status.code(),
            Ok(None) if Instant::now() >= deadline => {
                timed_out = true;
                let _ = child.kill();
                let _ = child.wait();
                break None;
            }
            Ok(None) => std::thread::sleep(Duration::from_millis(25)),
            Err(e) => return Err(format!("waiting for '{program}' failed: {e}")),
        }
    };
    let (stdout, out_truncated) = out_thread.join().unwrap_or_default();
    let (stderr, err_truncated) = err_thread.join().unwrap_or_default();
    Ok(ProcRun {
        exit_code,
        stdout: String::from_utf8_lossy(&stdout).into_owned(),
        stderr: String::from_utf8_lossy(&stderr).into_owned(),
        timed_out,
        truncated: out_truncated || err_truncated,
        duration_ms: started.elapsed().as_millis() as u64,
    })
}

// -------------------------------------------------------------------- todo

/// In-memory todo list for the agent UI (pure part, unit-tested).
pub fn sanitize_todo(items: Vec<String>) -> Vec<String> {
    items
        .into_iter()
        .map(|item| item.trim().to_string())
        .filter(|item| !item.is_empty())
        .map(|item| {
            if item.chars().count() > TODO_MAX_CHARS {
                item.chars().take(TODO_MAX_CHARS).collect()
            } else {
                item
            }
        })
        .take(TODO_MAX_ITEMS)
        .collect()
}

/// Managed Tauri state: one todo list per running app session.
#[derive(Default)]
pub struct AgentTodo(pub Mutex<Vec<String>>);

// ------------------------------------------------- argument sanitizing

/// Clamp the caller's timeout into the allowed window.
pub fn clamp_timeout(timeout_s: Option<u64>) -> Duration {
    let seconds = timeout_s
        .unwrap_or(PROC_TIMEOUT_DEFAULT_S)
        .clamp(1, PROC_TIMEOUT_MAX_S);
    Duration::from_secs(seconds)
}

// ---------------------------------------------------------------- commands

#[tauri::command]
pub async fn fs_read(root: String, path: String) -> Result<FileRead, String> {
    let root = PathBuf::from(root);
    tauri::async_runtime::spawn_blocking(move || read_file(&root, &path, READ_MAX_BYTES))
        .await
        .map_err(|e| format!("fs_read failed: {e}"))?
}

#[tauri::command]
pub async fn fs_list(root: String, path: Option<String>) -> Result<DirList, String> {
    let root = PathBuf::from(root);
    let path = path.unwrap_or_default();
    tauri::async_runtime::spawn_blocking(move || list_dir(&root, &path, LIST_MAX_ENTRIES))
        .await
        .map_err(|e| format!("fs_list failed: {e}"))?
}

#[tauri::command]
pub async fn fs_write(root: String, path: String, content: String) -> Result<FileWrite, String> {
    let root = PathBuf::from(root);
    tauri::async_runtime::spawn_blocking(move || {
        write_file(&root, &path, &content, WRITE_MAX_BYTES)
    })
    .await
    .map_err(|e| format!("fs_write failed: {e}"))?
}

#[tauri::command]
pub async fn proc_run(
    root: String,
    argv: Vec<String>,
    timeout_s: Option<u64>,
    cwd: Option<String>,
) -> Result<ProcRun, String> {
    let root = PathBuf::from(root);
    let timeout = clamp_timeout(timeout_s);
    tauri::async_runtime::spawn_blocking(move || {
        // The working directory is itself a scoped path: a model cannot
        // point cwd outside the project even if root is valid.
        let cwd_rel = cwd.unwrap_or_default();
        let cwd = resolve_under(&root, &cwd_rel)?;
        if !cwd.is_dir() {
            return Err(format!("working folder '{cwd_rel}' does not exist"));
        }
        run_process(&argv, &cwd, &root, timeout, PROC_OUTPUT_CAP)
    })
    .await
    .map_err(|e| format!("proc_run failed: {e}"))?
}

#[tauri::command]
pub async fn todo_get(app: AppHandle) -> Result<Vec<String>, String> {
    let state = app.state::<AgentTodo>();
    let items = state
        .0
        .lock()
        .map_err(|_| "the todo list is locked by another call".to_string())?;
    Ok(items.clone())
}

#[tauri::command]
pub async fn todo_set(app: AppHandle, items: Vec<String>) -> Result<Vec<String>, String> {
    let state = app.state::<AgentTodo>();
    let mut guard = state
        .0
        .lock()
        .map_err(|_| "the todo list is locked by another call".to_string())?;
    *guard = sanitize_todo(items);
    Ok(guard.clone())
}
