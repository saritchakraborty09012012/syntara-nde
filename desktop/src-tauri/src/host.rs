//! The desktop shell owns the local host process (plan 1d): a hidden
//! `pythonw.exe` running `syntara serve --model ...` on loopback.
//!
//! Resolution order keeps the embeddable-CPython decision from
//! `docs/experiments/phase1d-embed-cpython.md` visible in the code:
//!
//! 1. `SYNTARA_PYTHON` env override (dev machines, tests);
//! 2. bundled `<resource>/python/pythonw.exe` (production layout, Phase 5);
//! 3. PATH fallback - a dev convenience only; the product ships the
//!    bundle, not a system Python.
//!
//! The package root (`SYNTARA_PKG_ROOT`, or the bundled `<resource>/app`)
//! must contain the `syntara` package. No model is guessed: with
//! `SYNTARA_MODEL` unset the host reports `no_model` honestly, and the
//! `host_start` command starts it later once the UI has chosen a model.

use std::fs::File;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::Duration;

use tauri::{AppHandle, Manager};

#[cfg(windows)]
pub(crate) const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HostStatus {
    /// `no_model` | `not_configured` | `running` | `exited` | `failed`
    pub state: String,
    pub url: Option<String>,
    pub port: Option<u16>,
    pub model: Option<String>,
    pub pid: Option<u32>,
    pub exit_code: Option<i32>,
    /// Why the host is not running (state != running).
    pub reason: Option<String>,
    /// Where the host process log was written this run.
    pub log: Option<String>,
    /// Last known `GET /health` body, when reachable.
    pub health: Option<serde_json::Value>,
}

impl HostStatus {
    /// Honest bare constructor; also used by tests/host_contract.rs.
    pub fn bare(state: &str, reason: Option<String>) -> Self {
        HostStatus {
            state: state.to_string(),
            url: None,
            port: None,
            model: None,
            pid: None,
            exit_code: None,
            reason,
            log: None,
            health: None,
        }
    }
}

/// Windows Job Object wrapper: the host pythonw spawns grandchildren (the
/// llama.cpp server), and killing pythonw alone would orphan them. The child
/// is assigned to a job with JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE, so closing
/// the handle - on stop, on restart, on clean exit, or just by process death -
/// tears down the whole tree (AGENTS: no orphan processes).
///
/// Stored as a raw address-sized handle; only meaningful on Windows, where
/// every constructor sets it.
#[derive(Default)]
struct HostJob(Option<usize>);

impl HostJob {
    fn assign(pid: u32) -> Self {
        #[cfg(windows)]
        {
            use std::os::windows::io::RawHandle;
            type Handle = *mut core::ffi::c_void;
            #[repr(C)]
            struct BasicLimit {
                per_process_time: i64,
                per_job_time: i64,
                limit_flags: u32,
                _pad: u32,
                min_wss: usize,
                max_wss: usize,
                active_process_limit: u32,
                _pad2: u32,
                affinity: usize,
                priority_class: u32,
                scheduling_class: u32,
            }
            #[repr(C)]
            #[derive(Default)]
            struct IoCounters {
                read_ops: u64,
                write_ops: u64,
                other_ops: u64,
                read_xfer: u64,
                write_xfer: u64,
                other_xfer: u64,
            }
            #[repr(C)]
            struct ExtLimit {
                basic: BasicLimit,
                io: IoCounters,
                process_memory_limit: usize,
                job_memory_limit: usize,
                peak_process_memory_used: usize,
                peak_job_memory_used: usize,
            }
            // JOB_OBJECT_EXTENDED_LIMIT_INFORMATION
            const CLASS_EXTENDED_LIMIT: i32 = 9;
            // JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
            const KILL_ON_CLOSE: u32 = 0x0000_2000;
            // PROCESS_SET_QUOTA | PROCESS_TERMINATE (required to assign)
            const PROCESS_ASSIGN: u32 = 0x0100 | 0x0001;

            unsafe extern "system" {
                fn CreateJobObjectW(
                    lp_job_attributes: *const core::ffi::c_void,
                    lp_name: *const core::ffi::c_void,
                ) -> Handle;
                fn SetInformationJobObject(
                    job: Handle,
                    info_class: i32,
                    info: *const core::ffi::c_void,
                    len: u32,
                ) -> i32;
                fn OpenProcess(access: u32, inherit: i32, pid: u32) -> Handle;
                fn AssignProcessToJobObject(job: Handle, process: Handle) -> i32;
                fn CloseHandle(object: Handle) -> i32;
            }

            unsafe {
                let job = CreateJobObjectW(core::ptr::null(), core::ptr::null());
                if job.is_null() {
                    return HostJob(None);
                }
                let info = ExtLimit {
                    basic: BasicLimit {
                        per_process_time: 0,
                        per_job_time: 0,
                        limit_flags: KILL_ON_CLOSE,
                        _pad: 0,
                        min_wss: 0,
                        max_wss: 0,
                        active_process_limit: 0,
                        _pad2: 0,
                        affinity: 0,
                        priority_class: 0,
                        scheduling_class: 0,
                    },
                    io: IoCounters::default(),
                    process_memory_limit: 0,
                    job_memory_limit: 0,
                    peak_process_memory_used: 0,
                    peak_job_memory_used: 0,
                };
                let ok = SetInformationJobObject(
                    job,
                    CLASS_EXTENDED_LIMIT,
                    &info as *const _ as *const _,
                    core::mem::size_of::<ExtLimit>() as u32,
                );
                let process = if ok != 0 {
                    OpenProcess(PROCESS_ASSIGN, 0, pid)
                } else {
                    core::ptr::null_mut()
                };
                if process.is_null() || AssignProcessToJobObject(job, process) == 0 {
                    if !process.is_null() {
                        CloseHandle(process);
                    }
                    CloseHandle(job);
                    return HostJob(None);
                }
                CloseHandle(process);
                let _keep: RawHandle = job; // owned from here on
                return HostJob(Some(job as usize));
            }
        }
        #[cfg(not(windows))]
        {
            let _ = pid;
            HostJob(None)
        }
    }

    /// Close the job handle. With KILL_ON_JOB_CLOSE this terminates every
    /// process in the job (pythonw and its llama.cpp server) before the
    /// handle is released.
    fn close(&mut self) {
        if let Some(handle) = self.0.take() {
            #[cfg(windows)]
            {
                unsafe extern "system" {
                    fn CloseHandle(object: *mut core::ffi::c_void) -> i32;
                }
                unsafe {
                    CloseHandle(handle as *mut core::ffi::c_void);
                }
            }
        }
    }
}

impl Drop for HostJob {
    fn drop(&mut self) {
        self.close();
    }
}

pub struct HostProcess {
    child: Option<Child>,
    /// Job Object covering the child's whole process tree (see HostJob).
    job: HostJob,
    pub status: HostStatus,
}

impl HostProcess {
    pub fn new(status: HostStatus) -> Self {
        HostProcess {
            child: None,
            job: HostJob::default(),
            status,
        }
    }

    pub fn with_child(status: HostStatus, child: Child, job: HostJob) -> Self {
        HostProcess {
            child: Some(child),
            job,
            status,
        }
    }

    /// Reap an exited child; refresh the snapshot's exit code.
    pub fn poll(&mut self) {
        if let Some(child) = self.child.as_mut() {
            if let Ok(Some(code)) = child.try_wait() {
                self.status.state = "exited".to_string();
                self.status.exit_code = code.code();
                self.status.pid = None;
                self.child = None;
                // Releasing the job reaps any descendants that outlived the
                // host python itself (e.g. a stuck engine server).
                self.job.close();
            }
        }
    }

    pub fn shutdown(&mut self) {
        if let Some(mut child) = self.child.take() {
            // Kill the whole tree first (job close), then reap the direct
            // child so no zombie handle remains.
            self.job.close();
            let _ = child.kill();
            let _ = child.wait();
            self.status.state = "exited".to_string();
            self.status.exit_code = self.status.exit_code.or(Some(-1));
            self.status.pid = None;
        } else {
            self.job.close();
        }
    }
}

fn env_str(name: &str) -> Option<String> {
    std::env::var(name)
        .ok()
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
}

/// Interpreter names to try inside the bundled `<resource>/python`, in order.
///
/// Windows gets the embeddable python.org build, which ships both `pythonw.exe`
/// (what the hidden host wants) and `python.exe`. POSIX gets
/// python-build-standalone's `install_only` layout, which keeps the interpreter
/// under `bin/`; a hand-assembled bundle may put it at the root instead, so
/// both are probed rather than one being assumed.
fn bundled_candidates(res: &Path) -> Vec<PathBuf> {
    let dir = res.join("python");
    if cfg!(windows) {
        vec![dir.join("pythonw.exe"), dir.join("python.exe")]
    } else {
        vec![
            dir.join("bin").join("python3"),
            dir.join("python3"),
            dir.join("bin").join("python"),
        ]
    }
}

/// First candidate that exists, else the first one (so the error the user sees
/// names the interpreter we would have used).
fn first_existing(candidates: &[PathBuf]) -> PathBuf {
    candidates
        .iter()
        .find(|path| path.is_file())
        .cloned()
        .unwrap_or_else(|| candidates[0].clone())
}

/// Locate the interpreter: env override, bundled layout, PATH fallback.
pub fn resolve_python(resource_dir: Option<&Path>) -> Result<PathBuf, String> {
    if let Some(override_) = env_str("SYNTARA_PYTHON") {
        let path = PathBuf::from(&override_);
        if path.is_file() {
            return Ok(path);
        }
        return Err(format!(
            "SYNTARA_PYTHON points at {} which does not exist",
            path.display()
        ));
    }
    if let Some(res) = resource_dir {
        let candidates = bundled_candidates(res);
        if candidates.iter().any(|path| path.is_file()) {
            return Ok(first_existing(&candidates));
        }
    }
    // Dev fallback: no bundle staged (Phase 5 configures the resource layout).
    // `pythonw.exe` is tried before `python.exe` on Windows because a console
    // window flashing on every launch is the one thing a tray app must not do,
    // but pythonw.exe is rare on PATH and a missing host is worse than a
    // visible one.
    let on_path: Vec<PathBuf> = if cfg!(windows) {
        vec![PathBuf::from("pythonw.exe"), PathBuf::from("python.exe")]
    } else {
        vec![PathBuf::from("python3"), PathBuf::from("python")]
    };
    Ok(first_existing(&on_path))
}

/// Locate the directory that contains the `syntara` package.
pub fn resolve_pkg_root(resource_dir: Option<&Path>) -> Result<PathBuf, String> {
    let has_pkg = |root: &Path| root.join("syntara").join("__main__.py").is_file();
    if let Some(root) = env_str("SYNTARA_PKG_ROOT") {
        let path = PathBuf::from(&root);
        if has_pkg(&path) {
            return Ok(path);
        }
        return Err(format!(
            "SYNTARA_PKG_ROOT={} does not contain the syntara package \
             (expected {}/syntara/__main__.py)",
            path.display(),
            path.display()
        ));
    }
    if let Some(res) = resource_dir {
        let bundled = res.join("app");
        if has_pkg(&bundled) {
            return Ok(bundled);
        }
    }
    Err(
        "the Syntara python package was not found; set SYNTARA_PKG_ROOT to \
         the directory containing the `syntara` package (the bundled app \
         layout arrives with Phase 5 packaging)"
            .to_string(),
    )
}

/// The argv for `syntara serve` (pinned by tests so the contract is stable).
pub fn build_argv(model: &str, port: u16) -> Vec<String> {
    vec![
        "-m".into(),
        "syntara".into(),
        "serve".into(),
        "--model".into(),
        model.into(),
        "--host".into(),
        "127.0.0.1".into(),
        "--port".into(),
        port.to_string(),
    ]
}

fn log_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_log_dir()
        .unwrap_or_else(|_| std::env::temp_dir())
        .join("syntara-host.log")
}

/// Only this many trailing bytes of the log are ever read, so a host log
/// that grew for weeks still costs a bounded amount to show.
pub const TAIL_WINDOW_BYTES: u64 = 128 * 1024;

/// Tail the host log for the in-app log panel. Returns `(path, exists, lines)`:
/// `exists=false` means "no log yet" (honest empty, not an error). A fixed
/// byte window can start mid-line and mid-character, so the first partial
/// line is dropped and the window is decoded lossily - the file on disk is
/// untouched. `max_lines` is clamped to 1..=500.
pub fn tail_lines(path: &Path, max_lines: usize) -> (String, bool, Vec<String>) {
    use std::io::{Read, Seek, SeekFrom};

    let shown = path.display().to_string();
    let Ok(mut file) = File::open(path) else {
        return (shown, false, Vec::new());
    };
    let Ok(meta) = file.metadata() else {
        return (shown, false, Vec::new());
    };
    let start = meta.len().saturating_sub(TAIL_WINDOW_BYTES);
    if start > 0 && file.seek(SeekFrom::Start(start)).is_err() {
        return (shown, false, Vec::new());
    }
    let mut bytes = Vec::new();
    if file
        .take(TAIL_WINDOW_BYTES)
        .read_to_end(&mut bytes)
        .is_err()
    {
        return (shown, false, Vec::new());
    }
    let text = String::from_utf8_lossy(&bytes);
    let mut lines: Vec<String> = text.lines().map(str::to_string).collect();
    if start > 0 {
        lines.remove(0); // partial first line created by the byte window
    }
    let max = max_lines.clamp(1, 500);
    let drop_count = lines.len().saturating_sub(max);
    lines.drain(..drop_count);
    (shown, true, lines)
}

/// Start the hidden host process (app start, or `host_start` from the UI).
pub fn start(app: &AppHandle, model: Option<String>, port: Option<u16>) -> HostProcess {
    let model = model.or_else(|| env_str("SYNTARA_MODEL"));
    let Some(model) = model else {
        return HostProcess::new(HostStatus::bare(
            "no_model",
            Some(
                "no model configured - set SYNTARA_MODEL or start the host \
                 with a chosen model"
                    .to_string(),
            ),
        ));
    };
    let port = port
        .or_else(|| env_str("SYNTARA_HOST_PORT").and_then(|v| v.parse().ok()))
        .unwrap_or(8000);
    let resource_dir = app.path().resource_dir().ok();

    let python = match resolve_python(resource_dir.as_deref()) {
        Ok(p) => p,
        Err(reason) => {
            return HostProcess::new(HostStatus::bare("failed", Some(reason)));
        }
    };
    let pkg_root = match resolve_pkg_root(resource_dir.as_deref()) {
        Ok(p) => p,
        Err(reason) => {
            return HostProcess::new(HostStatus::bare("not_configured", Some(reason)));
        }
    };

    let log = log_path(app);
    // The app log directory only exists after the first log write; without
    // this a fresh install would fail File::create and never spawn the host.
    if let Some(dir) = log.parent() {
        if let Err(err) = std::fs::create_dir_all(dir) {
            return HostProcess::new(HostStatus::bare(
                "failed",
                Some(format!(
                    "cannot create log directory {}: {err}",
                    dir.display()
                )),
            ));
        }
    }
    let log_file = match File::create(&log) {
        Ok(f) => f,
        Err(err) => {
            return HostProcess::new(HostStatus::bare(
                "failed",
                Some(format!("cannot write host log {}: {err}", log.display())),
            ));
        }
    };
    let err_file = log_file
        .try_clone()
        .unwrap_or_else(|_| File::create(&log).expect("log path was creatable a moment ago"));

    let argv = build_argv(&model, port);
    let mut command = Command::new(&python);
    command
        .args(&argv)
        .current_dir(&pkg_root)
        .env("PYTHONPATH", &pkg_root)
        .env("PYTHONNOUSERSITE", "1")
        .stdout(Stdio::from(log_file))
        .stderr(Stdio::from(err_file));
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    match command.spawn() {
        Ok(child) => {
            let job = HostJob::assign(child.id());
            let mut status = HostStatus::bare("running", None);
            status.url = Some(format!("http://127.0.0.1:{port}"));
            status.port = Some(port);
            status.model = Some(model);
            status.pid = Some(child.id());
            status.log = Some(log.display().to_string());
            HostProcess::with_child(status, child, job)
        }
        Err(err) => HostProcess::new(HostStatus::bare(
            "failed",
            Some(format!("could not start {}: {err}", python.display())),
        )),
    }
}

/// Best-effort `GET /health` probe (short timeout; None when unreachable).
pub async fn probe_health(url: Option<&str>) -> Option<serde_json::Value> {
    let url = url?;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_millis(800))
        .build()
        .ok()?;
    let response = client.get(format!("{url}/health")).send().await.ok()?;
    response.json::<serde_json::Value>().await.ok()
}

// Commands live in this submodule (see lib.rs): a `#[tauri::command] pub fn`
// at the crate root collides with the macro's own `#[macro_export]`.

#[tauri::command]
pub async fn host_status(app: AppHandle) -> HostStatus {
    let (mut status, url) = {
        let state = app.state::<crate::AppState>();
        let mut host = state.host.lock().expect("host lock");
        host.poll();
        (host.status.clone(), host.status.url.clone())
    };
    status.health = probe_health(url.as_deref()).await;
    status
}

#[tauri::command]
pub fn host_start(app: AppHandle, model: Option<String>, port: Option<u16>) -> HostStatus {
    let state = app.state::<crate::AppState>();
    let mut host = state.host.lock().expect("host lock");
    host.shutdown(); // replacing a live host starts from a clean process
    *host = start(&app, model, port);
    host.status.clone()
}

#[tauri::command]
pub fn host_stop(app: AppHandle) -> HostStatus {
    let state = app.state::<crate::AppState>();
    let mut host = state.host.lock().expect("host lock");
    host.shutdown();
    host.status.clone()
}

/// Tail of the host log for the in-app Settings panel (Phase 5): local only,
/// bounded by the byte window and the 1..=500 line clamp in `tail_lines`.
#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HostLogTail {
    pub path: String,
    /// False when the log file does not exist yet (host never started).
    pub exists: bool,
    pub lines: Vec<String>,
}

#[tauri::command]
pub fn host_logs(app: AppHandle, lines: Option<usize>) -> HostLogTail {
    let (path, exists, lines) = tail_lines(&log_path(&app), lines.unwrap_or(200));
    HostLogTail {
        path,
        exists,
        lines,
    }
}

// Contract tests live in tests/host_contract.rs: unit-test harnesses cannot
// embed the comctl32 v6 manifest (see build.rs / Cargo.toml `[lib] test`).
