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
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

use serde_json::Value;
use tauri::{AppHandle, Manager};

use crate::host::{CREATE_NO_WINDOW, resolve_pkg_root, resolve_python};

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
        command.creation_flags(CREATE_NO_WINDOW);
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
