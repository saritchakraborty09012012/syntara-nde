//! Host-process contract tests (formerly unit tests in src/host.rs).
//!
//! They live here because unit-test harnesses cannot embed the comctl32 v6
//! manifest: `cargo::rustc-link-arg-tests` only reaches `[[test]]` targets,
//! and a harness without the manifest dies with STATUS_ENTRYPOINT_NOT_FOUND
//! before running (TaskDialogIndirect resolves against comctl32 v5).
//! See build.rs and Cargo.toml `[lib] test`.

use syntara_desktop_lib::host::{HostStatus, build_argv, resolve_pkg_root, resolve_python};
use syntara_desktop_lib::library::{
    build_inspect_argv, build_library_add_argv, from_inspect_report, from_library_entry,
};

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

// ------------------------------------------------ library bridge (plan 1e)

#[test]
fn library_add_argv_pins_the_offline_catalogue_contract() {
    assert_eq!(
        build_library_add_argv(r"D:\models\qwen-8b.gguf"),
        vec![
            "-m",
            "syntara",
            "library",
            "add",
            r"D:\models\qwen-8b.gguf",
            "--json"
        ]
    );
}

#[test]
fn inspect_argv_pins_the_header_only_inspector() {
    assert_eq!(
        build_inspect_argv("tiny.gguf"),
        vec!["-m", "syntara", "inspect", "tiny.gguf", "--json"]
    );
}

#[test]
fn library_entry_maps_to_a_registered_inspection() {
    let entry = serde_json::json!({
        "id": "qwen-8b",
        "path": "C:\\models\\qwen-8b.gguf",
        "size": 5242880u64,
        "model": {
            "architecture": "qwen2",
            "name": "Qwen2 8B",
            "file_type": 15,
            "context_length": 32768u64
        },
        "tensors": {
            "count": 200u64,
            "by_type": { "Q4_K_M": 180u64, "F16": 20u64 },
            "parameters": 8030000000u64
        },
        "estimates": { "params_billion": 8.03, "ram_gb_min": 10.04, "file_mb": 4768.4 },
        "tokenizer": { "tokens": 151936u64, "has_chat_template": true },
        "compatibility": {
            "badges": [{ "id": "runtime-support", "level": "ok", "message": "loadable" }]
        },
        "status": "ok"
    });
    let out = from_library_entry(&entry);
    assert_eq!(out.outcome, "registered");
    assert_eq!(out.library_id.as_deref(), Some("qwen-8b"));
    assert_eq!(out.data_complete, Some(true));
    assert_eq!(out.architecture.as_deref(), Some("qwen2"));
    assert_eq!(out.context_length, Some(32768));
    assert_eq!(out.size_bytes, Some(5242880));
    assert_eq!(out.params_billion, Some(8.03));
    assert_eq!(out.tokens, Some(151936));
    assert_eq!(out.has_chat_template, Some(true));
    // Quant labels come from the tensor histogram, most frequent first.
    assert_eq!(out.quantizations, vec!["Q4_K_M", "F16"]);
    assert_eq!(out.badges.len(), 1);
    assert_eq!(out.badges[0].level, "ok");
}

#[test]
fn truncated_report_becomes_partial_not_registered() {
    let report = serde_json::json!({
        "path": "/models/half.gguf",
        "file_size": 1000u64,
        "model": { "architecture": "llama" },
        "tensors": { "count": 0u64, "by_type": {}, "parameters": 0u64 },
        "estimates": {},
        "tokenizer": {},
        "compatibility": {
            "badges": [{ "id": "data", "level": "error", "message": "tensor data is short by 4096 bytes" }]
        },
        "data_complete": false,
        "warnings": ["tensor data is short by 4096 bytes"]
    });
    let out = from_inspect_report(&report);
    assert_eq!(out.outcome, "partial");
    assert_eq!(out.data_complete, Some(false));
    assert_eq!(
        out.library_id, None,
        "a partial file never entered the index"
    );
    assert_eq!(out.warnings.len(), 1);
    assert_eq!(out.badges[0].level, "error");
}

#[test]
fn complete_report_is_inspected_but_not_registered() {
    let report = serde_json::json!({
        "path": "/models/whole.gguf",
        "file_size": 2048u64,
        "model": { "architecture": "llama", "context_length": 4096u64 },
        "tensors": { "count": 10u64, "by_type": { "F16": 10u64 }, "parameters": 1000u64 },
        "estimates": { "params_billion": 0.0 },
        "tokenizer": { "tokens": 32000u64, "has_chat_template": false },
        "compatibility": { "badges": [] },
        "data_complete": true,
        "warnings": []
    });
    let out = from_inspect_report(&report);
    assert_eq!(out.outcome, "inspected");
    assert_eq!(out.data_complete, Some(true));
    assert_eq!(out.library_id, None);
    assert_eq!(out.quantizations, vec!["F16"]);
}

#[test]
fn inspection_serializes_camel_case_for_the_webview() {
    let out = from_inspect_report(&serde_json::json!({
        "path": "x.gguf",
        "data_complete": true,
        "warnings": []
    }));
    let json = serde_json::to_value(&out).unwrap();
    assert!(json.get("dataComplete").is_some());
    assert!(json.get("libraryId").is_some());
    assert!(json.get("data_complete").is_none());
}
