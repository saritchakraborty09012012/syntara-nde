//! Opt-in end-to-end check for the library bridge (plan 1e).
//!
//! Ignored by default so plain `cargo test` stays hermetic. Run it with a
//! Python that can import the package (the same two env overrides the host
//! resolution uses):
//!
//! ```text
//! SYNTARA_PYTHON=<python.exe> SYNTARA_PKG_ROOT=<repo> cargo test --test library_e2e -- --ignored
//! ```
//!
//! The test builds a tiny GGUF through the package's own fixture builder,
//! runs the exact blocking body behind the `library_inspect` command
//! against it and against a truncated copy, and keeps every write (fixture
//! files, library index) inside the temp directory via `SYNTARA_HOME`.

use std::path::Path;
use std::process::Command;

use syntara_desktop_lib::host::{resolve_pkg_root, resolve_python};
use syntara_desktop_lib::library::inspect_blocking;

// Same flags the host uses; tests are an external crate, so the constant
// is repeated here (CREATE_NO_WINDOW stays crate-private).
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

fn build_fixture(python: &Path, pkg_root: &Path, target: &Path) {
    let mut command = Command::new(python);
    command
        .args([
            "-c",
            "import sys; from syntara.tests.gguf_fixtures import build_tiny_llama_gguf; build_tiny_llama_gguf(sys.argv[1])",
        ])
        .arg(target)
        .current_dir(pkg_root)
        .env("PYTHONPATH", pkg_root)
        .env("PYTHONNOUSERSITE", "1");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    let output = command
        .output()
        .expect("could not spawn the fixture builder");
    assert!(
        output.status.success(),
        "fixture builder failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
}

#[test]
#[ignore = "needs Python with the syntara package (SYNTARA_PYTHON, SYNTARA_PKG_ROOT)"]
fn inspect_blocking_registers_a_complete_gguf_and_flags_a_truncated_one() {
    // Hermetic library index: nothing may land in the user's real one.
    let home = std::env::temp_dir().join("syntara-1e-e2e-home");
    let _ = std::fs::remove_dir_all(&home);
    std::fs::create_dir_all(&home).expect("temp home");
    unsafe { std::env::set_var("SYNTARA_HOME", &home) };

    let fixture_dir = std::env::temp_dir().join("syntara-1e-e2e-fixtures");
    let _ = std::fs::remove_dir_all(&fixture_dir);
    std::fs::create_dir_all(&fixture_dir).expect("fixture dir");
    let complete = fixture_dir.join("tiny-complete.gguf");
    let truncated = fixture_dir.join("tiny-truncated.gguf");

    let python = resolve_python(None).expect("SYNTARA_PYTHON must point at a real interpreter");
    let pkg_root = resolve_pkg_root(None).expect("SYNTARA_PKG_ROOT must contain the package");
    build_fixture(&python, &pkg_root, &complete);

    // A same-size-prefix copy: header intact, tensor data cut in half -
    // exactly what an interrupted download leaves behind.
    let bytes = std::fs::read(&complete).expect("fixture bytes");
    assert!(
        bytes.len() > 64,
        "fixture too small to truncate meaningfully"
    );
    std::fs::write(&truncated, &bytes[..bytes.len() / 2]).expect("truncated copy");

    let good = inspect_blocking(None, complete.display().to_string());
    assert_eq!(good.outcome, "registered", "error: {:?}", good.error);
    assert_eq!(good.data_complete, Some(true));
    assert!(
        good.library_id.is_some(),
        "complete file must enter the index"
    );
    assert_eq!(good.architecture.as_deref(), Some("llama"));
    assert!(
        !good.quantizations.is_empty(),
        "tensor types are the quant labels"
    );
    assert!(!good.badges.is_empty(), "the card needs verdict chips");

    let bad = inspect_blocking(None, truncated.display().to_string());
    assert_eq!(bad.outcome, "partial", "error: {:?}", bad.error);
    assert_eq!(bad.data_complete, Some(false));
    assert_eq!(bad.library_id, None, "a partial file must never be indexed");
    assert!(bad.error.is_some(), "the refusal reason is shown in the UI");

    let _ = std::fs::remove_dir_all(&fixture_dir);
    let _ = std::fs::remove_dir_all(&home);
    unsafe { std::env::remove_var("SYNTARA_HOME") };
}
