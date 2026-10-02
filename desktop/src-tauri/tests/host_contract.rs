//! Host-process contract tests (formerly unit tests in src/host.rs).
//!
//! They live here because unit-test harnesses cannot embed the comctl32 v6
//! manifest: `cargo::rustc-link-arg-tests` only reaches `[[test]]` targets,
//! and a harness without the manifest dies with STATUS_ENTRYPOINT_NOT_FOUND
//! before running (TaskDialogIndirect resolves against comctl32 v5).
//! See build.rs and Cargo.toml `[lib] test`.

use syntara_desktop_lib::host::{HostStatus, build_argv, resolve_pkg_root, resolve_python};

// Edition 2024: env::set_var/remove_var are unsafe (they race with other
// threads' getenv). Each test touches only its own variable names, so the
// race window is between sibling tests of this binary and harmless here.

#[test]
fn argv_pins_the_serve_contract() {
    assert_eq!(
        build_argv("tiny.gguf", 8123),
        vec![
            "-m",
            "syntara",
            "serve",
            "--model",
            "tiny.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "8123"
        ]
    );
}

#[test]
fn pkg_root_env_must_contain_the_package() {
    let tmp = std::env::temp_dir().join("syntara-host-test-pkg");
    std::fs::create_dir_all(tmp.join("syntara")).unwrap();
    std::fs::write(tmp.join("syntara").join("__main__.py"), b"").unwrap();
    unsafe { std::env::set_var("SYNTARA_PKG_ROOT", &tmp) };
    assert!(resolve_pkg_root(None).is_ok());

    unsafe { std::env::set_var("SYNTARA_PKG_ROOT", tmp.join("missing")) };
    assert!(resolve_pkg_root(None).is_err());
    unsafe { std::env::remove_var("SYNTARA_PKG_ROOT") };
    let _ = std::fs::remove_dir_all(&tmp);
}

#[test]
fn python_override_must_point_at_a_file() {
    let tmp = std::env::temp_dir().join("syntara-host-test-python.exe");
    std::fs::write(&tmp, b"").unwrap();
    unsafe { std::env::set_var("SYNTARA_PYTHON", &tmp) };
    assert_eq!(resolve_python(None).unwrap(), tmp);

    unsafe { std::env::set_var("SYNTARA_PYTHON", tmp.join("nope")) };
    assert!(resolve_python(None).is_err());
    unsafe { std::env::remove_var("SYNTARA_PYTHON") };
    let _ = std::fs::remove_file(&tmp);
}

#[test]
fn no_model_status_is_honest() {
    let status = HostStatus::bare("no_model", Some("no model".into()));
    assert_eq!(status.state, "no_model");
    assert!(status.url.is_none());
    assert!(status.reason.is_some());
}

#[test]
fn status_serializes_camel_case_for_the_webview() {
    let json = serde_json::to_value(HostStatus::bare("exited", None)).unwrap();
    assert_eq!(json["state"], "exited");
    assert!(json.get("exitCode").is_some(), "renamed for the webview");
    assert!(json.get("exit_code").is_none());
}
