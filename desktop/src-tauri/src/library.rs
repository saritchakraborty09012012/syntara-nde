//! The desktop's bridge to the offline model catalogue (plan 1e).
//!
//! The UI never parses GGUF itself: `library_inspect` runs the same Python
//! package the CLI and the gateway use (`syntara library add` first, then
//! `syntara inspect` when the add is refused), so badges, quantization
//! labels and the partial-file verdict come from one inspector
//! (`syntara/gguf_inspect.py`) and the library index stays the single
//! catalogue. Both commands are header-only reads; the library references
//! files in place, so inspecting never copies model weights.

use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

use serde_json::Value;
use tauri::{AppHandle, Manager};

// CREATE_NO_WINDOW is NOT imported here: host.rs gates it #[cfg(windows)],
// so a plain `use` of it would only resolve on Windows and broke `cargo check`
// on Linux and macOS. The one call site below reaches for it through the crate
// path inside its own #[cfg(windows)] block, exactly as host.rs does.
use crate::host::{resolve_pkg_root, resolve_python};

/// `library add` and `inspect` only read headers and rewrite a small JSON
/// index, but a cold Python start plus antivirus scanning can be slow on
/// Windows. Bounded either way - the UI gets an honest error, never a hang.
const CAPTURE_TIMEOUT: Duration = Duration::from_secs(60);

/// One compatibility badge, verbatim from the Python inspector.
#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryBadge {
    pub id: String,
    /// `ok` | `warn` | `error`
    pub level: String,
    pub message: String,
}

/// Normalized result of inspecting one file. `outcome` is:
/// - `registered` - registered in (or already present in) the library index;
/// - `inspected`  - readable GGUF, but the index write was refused;
/// - `partial`    - tensor data is short (truncated or still downloading);
/// - `failed`     - not an inspectable GGUF (or the inspector could not run).
#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryInspect {
    pub outcome: String,
    pub library_id: Option<String>,
    pub path: Option<String>,
    pub size_bytes: Option<u64>,
    pub architecture: Option<String>,
    pub model_name: Option<String>,
    pub context_length: Option<i64>,
    /// Tensor types by frequency, e.g. `["Q4_K_M", "F16"]`.
    pub quantizations: Vec<String>,
    pub params_billion: Option<f64>,
    pub ram_gb_min: Option<f64>,
    pub file_mb: Option<f64>,
    pub tensor_count: Option<u64>,
    pub tensor_parameters: Option<u64>,
    pub tokens: Option<u64>,
    pub has_chat_template: Option<bool>,
    pub badges: Vec<LibraryBadge>,
    pub data_complete: Option<bool>,
    pub warnings: Vec<String>,
    pub error: Option<String>,
}

impl LibraryInspect {
    fn empty(outcome: &str) -> Self {
        LibraryInspect {
            outcome: outcome.to_string(),
            library_id: None,
            path: None,
            size_bytes: None,
            architecture: None,
            model_name: None,
            context_length: None,
            quantizations: Vec::new(),
            params_billion: None,
            ram_gb_min: None,
            file_mb: None,
            tensor_count: None,
            tensor_parameters: None,
            tokens: None,
            has_chat_template: None,
            badges: Vec::new(),
            data_complete: None,
            warnings: Vec::new(),
            error: None,
        }
    }

    fn failed(reason: String) -> Self {
        let mut out = Self::empty("failed");
        out.error = Some(reason);
        out
    }
}

// ------------------------------------------------------------------- argv
// Pinned by tests/host_contract.rs so the desktop and the CLI stay on the
// same contract.

pub fn build_library_add_argv(path: &str) -> Vec<String> {
    vec![
        "-m".into(),
        "syntara".into(),
        "library".into(),
        "add".into(),
        path.into(),
        "--json".into(),
    ]
}

pub fn build_inspect_argv(path: &str) -> Vec<String> {
    vec![
        "-m".into(),
        "syntara".into(),
        "inspect".into(),
        path.into(),
        "--json".into(),
    ]
}

// ------------------------------------------------------------ JSON mapping

fn field_str(v: &Value, key: &str) -> Option<String> {
    v.get(key)?.as_str().map(str::to_string)
}

fn field_u64(v: &Value, key: &str) -> Option<u64> {
    let n = v.get(key)?;
    n.as_u64()
        .or_else(|| n.as_i64().filter(|i| *i >= 0).map(|i| i as u64))
        .or_else(|| n.as_f64().filter(|f| *f >= 0.0).map(|f| f as u64))
}

fn field_i64(v: &Value, key: &str) -> Option<i64> {
    let n = v.get(key)?;
    n.as_i64()
        .or_else(|| n.as_u64().map(|i| i as i64))
        .or_else(|| n.as_f64().map(|f| f as i64))
}

fn field_f64(v: &Value, key: &str) -> Option<f64> {
    let n = v.get(key)?;
    n.as_f64()
        .or_else(|| n.as_i64().map(|i| i as f64))
        .or_else(|| n.as_u64().map(|i| i as f64))
}

/// Fields present in both a library entry and an inspect report.
fn fill_common(out: &mut LibraryInspect, root: &Value) {
    if let Some(model) = root.get("model") {
        out.architecture = field_str(model, "architecture");
        out.model_name = field_str(model, "name");
        out.context_length = field_i64(model, "context_length");
    }
    if let Some(est) = root.get("estimates") {
        out.params_billion = field_f64(est, "params_billion");
        out.ram_gb_min = field_f64(est, "ram_gb_min");
        out.file_mb = field_f64(est, "file_mb");
    }
    if let Some(tensors) = root.get("tensors") {
        out.tensor_count = field_u64(tensors, "count");
        out.tensor_parameters = field_u64(tensors, "parameters");
        // Quantization labels live in the tensor type histogram (real data
        // read from tensor names); `general.file_type` is only an opaque
        // enum number, so it is never used as a label.
        if let Some(by_type) = tensors.get("by_type").and_then(Value::as_object) {
            let mut pairs: Vec<(&String, u64)> = by_type
                .iter()
                .map(|(k, v)| (k, v.as_u64().unwrap_or(0)))
                .collect();
            pairs.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(b.0)));
            out.quantizations = pairs.into_iter().map(|(k, _)| k.clone()).collect();
        }
    }
    if let Some(tokenizer) = root.get("tokenizer") {
        out.tokens = field_u64(tokenizer, "tokens");
        out.has_chat_template = tokenizer.get("has_chat_template").and_then(Value::as_bool);
    }
    if let Some(badges) = root
        .get("compatibility")
        .and_then(|c| c.get("badges"))
        .and_then(Value::as_array)
    {
        out.badges = badges
            .iter()
            .filter_map(|b| {
                Some(LibraryBadge {
                    id: field_str(b, "id")?,
                    level: field_str(b, "level").unwrap_or_else(|| "warn".into()),
                    message: field_str(b, "message").unwrap_or_default(),
                })
            })
            .collect();
    }
    out.path = field_str(root, "path");
    out.size_bytes = root
        .get("size")
        .or_else(|| root.get("file_size"))
        .and_then(|n| n.as_u64());
    // Only an inspect report carries `data_complete`; a library entry means
    // the file was already verified complete, so a missing key must not
    // erase the value set by the caller.
    if let Some(complete) = root.get("data_complete").and_then(Value::as_bool) {
        out.data_complete = Some(complete);
    }
    if let Some(list) = root.get("warnings").and_then(Value::as_array) {
        out.warnings = list
            .iter()
            .filter_map(|w| w.as_str().map(str::to_string))
            .collect();
    }
}

/// A `syntara library add --json` entry: registration succeeded, so the
/// file is complete by construction (the CLI refuses truncated tensors).
pub fn from_library_entry(entry: &Value) -> LibraryInspect {
    let mut out = LibraryInspect::empty("registered");
    out.library_id = field_str(entry, "id");
    out.data_complete = Some(true);
    fill_common(&mut out, entry);
    out
}

/// A `syntara inspect --json` report: full badges, no index registration.
pub fn from_inspect_report(report: &Value) -> LibraryInspect {
    let mut out = LibraryInspect::empty("inspected");
    fill_common(&mut out, report);
    if out.data_complete == Some(false) {
        out.outcome = "partial".to_string();
    }
    out
}

// ---------------------------------------------------------- subprocess I/O

struct Capture {
    ok: bool,
    stdout: String,
    stderr: String,
}

/// Run to completion with a hard timeout. stdout/stderr are drained on
/// worker threads while we poll, so a chatty child can never fill a pipe
/// buffer and deadlock; on timeout the child is killed and reaped.
fn run_capture(command: &mut Command, timeout: Duration) -> Result<Capture, String> {
    command
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    let mut child = command
        .spawn()
        .map_err(|e| format!("could not start the local inspector: {e}"))?;
    let mut out_pipe = child.stdout.take();
    let mut err_pipe = child.stderr.take();
    let out_thread = std::thread::spawn(move || {
        let mut buf = Vec::new();
        if let Some(pipe) = out_pipe.as_mut() {
            let _ = pipe.read_to_end(&mut buf);
        }
        String::from_utf8_lossy(&buf).into_owned()
    });
    let err_thread = std::thread::spawn(move || {
        let mut buf = Vec::new();
        if let Some(pipe) = err_pipe.as_mut() {
            let _ = pipe.read_to_end(&mut buf);
        }
        String::from_utf8_lossy(&buf).into_owned()
    });
    let deadline = Instant::now() + timeout;
    let code = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status.code(),
            Ok(None) if Instant::now() >= deadline => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(format!(
                    "the local inspector did not finish within {} seconds",
                    timeout.as_secs()
                ));
            }
            Ok(None) => std::thread::sleep(Duration::from_millis(50)),
            Err(err) => return Err(format!("waiting for the local inspector failed: {err}")),
        }
    };
    let stdout = out_thread.join().unwrap_or_default();
    let stderr = err_thread.join().unwrap_or_default();
    Ok(Capture {
        ok: code == Some(0),
        stdout,
        stderr,
    })
}

/// The exception line of a Python traceback (its final non-empty line).
fn last_error_line(stderr: &str) -> String {
    stderr
        .lines()
        .rev()
        .find(|line| !line.trim().is_empty())
        .map(|line| line.trim().to_string())
        .unwrap_or_else(|| "the local inspector reported no error text".to_string())
}

fn python_command(python: &Path, pkg_root: &Path, argv: &[String]) -> Command {
    let mut command = Command::new(python);
    command
        .args(argv)
        .current_dir(pkg_root)
        .env("PYTHONPATH", pkg_root)
        .env("PYTHONNOUSERSITE", "1");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(crate::host::CREATE_NO_WINDOW);
    }
    command
}

fn parse_object(stdout: &str) -> Option<Value> {
    serde_json::from_str::<Value>(stdout)
        .ok()
        .filter(Value::is_object)
}

/// Blocking body (also callable from tests): register + inspect one file.
pub fn inspect_blocking(resource_dir: Option<&Path>, path: String) -> LibraryInspect {
    if path.trim().is_empty() {
        return LibraryInspect::failed("no file path was given".to_string());
    }
    let python = match resolve_python(resource_dir) {
        Ok(p) => p,
        Err(reason) => return LibraryInspect::failed(reason),
    };
    let pkg_root = match resolve_pkg_root(resource_dir) {
        Ok(p) => p,
        Err(reason) => return LibraryInspect::failed(reason),
    };

    // 1. `library add` first: one subprocess covers registration and the
    //    metadata the UI needs when the file is healthy.
    let add = match run_capture(
        &mut python_command(&python, &pkg_root, &build_library_add_argv(&path)),
        CAPTURE_TIMEOUT,
    ) {
        Ok(capture) => capture,
        Err(reason) => return LibraryInspect::failed(reason),
    };
    if add.ok {
        if let Some(entry) = parse_object(&add.stdout) {
            return from_library_entry(&entry);
        }
    }
    // Add refused (truncated, not a GGUF, index unwritable, ...): the
    // inspector runs anyway so the UI gets badges and an honest verdict.
    let add_error = if add.ok {
        "the library command returned no JSON".to_string()
    } else {
        last_error_line(&add.stderr)
    };

    let inspect = match run_capture(
        &mut python_command(&python, &pkg_root, &build_inspect_argv(&path)),
        CAPTURE_TIMEOUT,
    ) {
        Ok(capture) => capture,
        Err(reason) => return LibraryInspect::failed(reason),
    };
    if !inspect.ok {
        let mut out = LibraryInspect::failed(last_error_line(&inspect.stderr));
        out.path = Some(path);
        out.warnings = vec![add_error];
        return out;
    }
    match parse_object(&inspect.stdout) {
        Some(report) => {
            let mut out = from_inspect_report(&report);
            // Keep the `library add` refusal visible either way: on
            // `partial` it explains the truncation, on `inspected` it
            // explains why the index write did not happen.
            out.error = Some(add_error);
            out
        }
        None => {
            let mut out = LibraryInspect::failed(
                "the local inspector returned output that was not JSON".to_string(),
            );
            out.path = Some(path);
            out
        }
    }
}

// ---------------------------------------------------------------- commands

/// Inspect (and register, when complete) a local model file for the UI.
#[tauri::command]
pub async fn library_inspect(app: AppHandle, path: String) -> LibraryInspect {
    let resource_dir = app.path().resource_dir().ok();
    match tauri::async_runtime::spawn_blocking(move || {
        inspect_blocking(resource_dir.as_deref(), path)
    })
    .await
    {
        Ok(outcome) => outcome,
        Err(err) => LibraryInspect::failed(format!("the local inspector could not run: {err}")),
    }
}

// ── importing a model that is already on this machine ─────────────────────

/// What the user chose when pointing Syntara at a model file that already
/// exists somewhere on the disk. The two words are the ones people already
/// use for this: copy is copy-paste (the original stays), move is cut-paste
/// (the original goes away once the copy is verified).
#[derive(Clone, Copy, Debug, PartialEq, Eq, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ImportMode {
    Copy,
    Move,
}

impl ImportMode {
    pub fn as_str(self) -> &'static str {
        match self {
            ImportMode::Copy => "copy",
            ImportMode::Move => "move",
        }
    }
}

/// Outcome of an import. `inspect` is the ordinary inspection result for the
/// file at its *new* path, so the card gets the same badges an in-place
/// registration would have given it.
#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub mode: String,
    /// Where the file was before the import.
    pub source: String,
    /// Where the model lives now.
    pub path: String,
    pub bytes: u64,
    /// True only for a move that finished: the original is gone because the
    /// copy was verified first, never before.
    pub source_removed: bool,
    /// Non-fatal note: the file was already inside the storage folder, or the
    /// destination volume is tight.
    pub warning: Option<String>,
    pub inspect: LibraryInspect,
}

/// What an import will do, decided before a single byte moves. Separate from
/// the execution so the refusal reasons (no room, name taken, source missing)
/// are testable without touching a real model file.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ImportPlan {
    pub source: String,
    pub destination: String,
    pub bytes: u64,
    /// False when source and destination are the same file: nothing to copy,
    /// and the UI says so instead of copying a model onto itself.
    pub needs_copy: bool,
}

/// Decide the destination and validate it. `free_bytes` is the destination
/// volume's free space when it is known (`None` skips that check - an unknown
/// volume is not a reason to refuse, a full one is).
pub fn plan_import(
    dir: &Path,
    source: &str,
    free_bytes: Option<u64>,
) -> Result<ImportPlan, String> {
    let source_path = Path::new(source);
    let meta = std::fs::metadata(source_path).map_err(|err| {
        format!(
            "could not read {}: {err}. Pick the model file again; it may have moved.",
            source_path.display()
        )
    })?;
    if !meta.is_file() {
        return Err(format!(
            "{} is not a file - pick the model file itself, not its folder.",
            source_path.display()
        ));
    }
    let name = source_path
        .file_name()
        .ok_or_else(|| format!("{} has no file name to import.", source_path.display()))?;
    let destination = dir.join(name);
    let bytes = meta.len();
    let needs_copy = destination != source_path;
    if !needs_copy {
        return Ok(ImportPlan {
            source: source.to_string(),
            destination: destination.display().to_string(),
            bytes,
            needs_copy: false,
        });
    }
    if destination.exists() {
        // Never overwrite: the destination is a model the user may already be
        // running, and a second copy of a 200 GB file is not ours to make.
        return Err(format!(
            "{} already exists in the model folder. Rename or remove it before importing.",
            destination.display()
        ));
    }
    if let Some(free) = free_bytes {
        if !crate::storage::has_room(free, bytes) {
            return Err(format!(
                "not enough free space on {} for {} ({} free). Choose another drive in Settings.",
                dir.display(),
                crate::storage::human_bytes(bytes),
                crate::storage::human_bytes(free)
            ));
        }
    }
    Ok(ImportPlan {
        source: source.to_string(),
        destination: destination.display().to_string(),
        bytes,
        needs_copy: true,
    })
}

/// Copy into the destination folder, then verify, then (for a move) remove the
/// original. The copy lands on a temporary name first, so an interrupted
/// import leaves no half-written file that the UI would list as a model.
fn transfer(source: &Path, destination: &Path, bytes: u64, mode: ImportMode) -> Result<(), String> {
    // A move inside one filesystem is a rename: instant, atomic, and free. It
    // is only ever a rename for a MOVE - the copy path must leave the source
    // in place, which is the whole difference between the two buttons.
    // Across drives the rename fails with ERROR_NOT_SAME_DEVICE / EXDEV and
    // falls through to the copy below, which then removes the original.
    if mode == ImportMode::Move && std::fs::rename(source, destination).is_ok() {
        return Ok(());
    }
    let temporary = destination.with_extension(format!(
        "{}part",
        destination
            .extension()
            .map(|ext| format!("{}.", ext.to_string_lossy()))
            .unwrap_or_default()
    ));
    let copied = (|| -> std::io::Result<u64> {
        let written = std::fs::copy(source, &temporary)?;
        // Only now does the real name appear: an interrupted copy leaves the
        // `.part` file, which nothing lists as a model.
        std::fs::rename(&temporary, destination)?;
        Ok(written)
    })();
    match copied {
        Ok(copied) if copied == bytes => Ok(()),
        Ok(copied) => Err(format!(
            "the copy stopped early ({} of {} bytes) - the destination was removed and your original file is untouched.",
            copied, bytes
        )),
        Err(err) => {
            let _ = std::fs::remove_file(&temporary);
            Err(format!(
                "could not copy {} to {}: {err}",
                source.display(),
                destination.display()
            ))
        }
    }
}

/// Blocking body behind `library_import`: place the file, then inspect it
/// exactly as `library_inspect` would have inspected the original.
pub fn import_blocking(
    resource_dir: Option<&Path>,
    dir: &Path,
    source: String,
    mode: ImportMode,
    free_bytes: Option<u64>,
) -> Result<ImportResult, String> {
    std::fs::create_dir_all(dir)
        .map_err(|err| format!("could not create the model folder {}: {err}", dir.display()))?;
    let plan = plan_import(dir, &source, free_bytes)?;
    let mut warning = None;
    let mut source_removed = false;

    if plan.needs_copy {
        let source_path = Path::new(&source);
        let destination_path = Path::new(&plan.destination);
        transfer(source_path, destination_path, plan.bytes, mode)?;
        if mode == ImportMode::Move {
            // The bytes are proven there (copy verified its length, rename is
            // atomic), so removing the original is safe. If the delete fails
            // the import still succeeded - the user keeps both copies, which
            // is a nuisance, never data loss, so it is reported, not fatal.
            match std::fs::remove_file(source_path) {
                Ok(()) => source_removed = true,
                Err(err) => {
                    warning = Some(format!(
                        "the model was imported but the original could not be removed ({}): {err}",
                        source_path.display()
                    ))
                }
            }
        }
    } else {
        warning = Some("this file is already in the Syntara model folder.".to_string());
    }

    // Inspect the file at its new path so the card carries the same badges an
    // in-place registration would: quantizations, RAM estimate, completeness.
    let inspect = inspect_blocking(resource_dir, plan.destination.clone());
    Ok(ImportResult {
        mode: mode.as_str().to_string(),
        source: plan.source,
        path: plan.destination,
        bytes: plan.bytes,
        source_removed,
        warning,
        inspect,
    })
}

/// Import a model the user pointed at: "copy the model to Syntara" or "move
/// the model to Syntara". The destination is the configured model folder, so
/// anything downloaded from inside the app afterwards lands in the same place.
#[tauri::command]
pub async fn library_import(
    app: AppHandle,
    state: tauri::State<'_, crate::AppState>,
    path: String,
    mode: ImportMode,
) -> Result<ImportResult, String> {
    let dir = PathBuf::from(state.engine.config.lock().await.download_dir.clone());
    let free_bytes = crate::storage::free_space_for(&dir.display().to_string());
    let resource_dir = app.path().resource_dir().ok();
    tauri::async_runtime::spawn_blocking(move || {
        import_blocking(resource_dir.as_deref(), &dir, path, mode, free_bytes)
    })
    .await
    .map_err(|err| format!("the import could not run: {err}"))?
}
