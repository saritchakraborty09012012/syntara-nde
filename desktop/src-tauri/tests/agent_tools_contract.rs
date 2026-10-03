//! Agent-tools contract tests (phase 4b).
//!
//! They live here because unit-test harnesses cannot embed the comctl32 v6
//! manifest: `cargo::rustc-link-arg-tests` only reaches `[[test]]` targets,
//! and a harness without the manifest dies with STATUS_ENTRYPOINT_NOT_FOUND
//! before running (TaskDialogIndirect resolves against comctl32 v5).
//! See build.rs and Cargo.toml `[lib] test`.

use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::time::Duration;

use syntara_desktop_lib::agent_tools::{
    ProcRun, READ_MAX_BYTES, TODO_MAX_CHARS, TODO_MAX_ITEMS, clamp_timeout, drain_capped, list_dir,
    read_file, resolve_under, run_process, sanitize_todo, write_file,
};

/// A fresh scratch folder per test (named, so a crashed run is easy to
/// find and a rerun starts clean).
fn fixture(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("syntara-agent-{name}"));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn cleanup(dir: &Path) {
    let _ = fs::remove_dir_all(dir);
}

// ------------------------------------------------------------ path scoping

#[test]
fn resolve_under_accepts_paths_inside_the_root() {
    let root = fixture("resolve-inside");
    fs::create_dir_all(root.join("src")).unwrap();
    fs::write(root.join("src").join("main.rs"), b"fn main() {}").unwrap();

    assert_eq!(
        resolve_under(&root, "").unwrap(),
        fs::canonicalize(&root).unwrap()
    );
    let file = resolve_under(&root, "src/main.rs").unwrap();
    assert!(file.starts_with(fs::canonicalize(&root).unwrap()));
    assert!(file.ends_with(Path::new("src").join("main.rs")));
    // A file that does not exist yet still resolves (write target).
    let fresh = resolve_under(&root, "new/deep/file.txt").unwrap();
    assert!(fresh.starts_with(fs::canonicalize(&root).unwrap()));
    cleanup(&root);
}

#[test]
fn resolve_under_refuses_every_escape_shape() {
    let root = fixture("resolve-escape");
    for attempt in [
        "..",
        "../outside.txt",
        "a/../../b",
        r"C:\windows\system32",
        r"\etc",
        "/abs",
    ] {
        let err = resolve_under(&root, attempt).unwrap_err();
        assert!(
            err.contains("escape") || err.contains("absolute"),
            "unexpected message for {attempt:?}: {err}"
        );
    }
    cleanup(&root);
}

// ----------------------------------------------------------------- fs_read

#[test]
fn read_file_returns_text_with_size_and_truncation_flag() {
    let root = fixture("read-ok");
    fs::write(root.join("note.md"), b"hello notes").unwrap();
    let out = read_file(&root, "note.md", READ_MAX_BYTES).unwrap();
    assert_eq!(out.content, "hello notes");
    assert_eq!(out.size, 11);
    assert!(!out.truncated);
    assert_eq!(out.path, "note.md");
    cleanup(&root);
}

#[test]
fn read_file_truncates_at_the_cap() {
    let root = fixture("read-cap");
    fs::write(root.join("big.txt"), vec![b'x'; 4096]).unwrap();
    let out = read_file(&root, "big.txt", 100).unwrap();
    assert_eq!(out.content.len(), 100);
    assert!(out.truncated);
    assert_eq!(out.size, 4096);
    cleanup(&root);
}

#[test]
fn read_file_refuses_binary_non_utf8_directories_and_missing_paths() {
    let root = fixture("read-refuse");
    fs::write(root.join("blob.bin"), [0u8, 1, 2, 3, 0, 9]).unwrap();
    fs::write(root.join("latin1.txt"), [0xE9u8, 0x21]).unwrap();
    fs::create_dir(root.join("folder")).unwrap();

    assert!(
        read_file(&root, "blob.bin", READ_MAX_BYTES)
            .unwrap_err()
            .contains("binary")
    );
    assert!(
        read_file(&root, "latin1.txt", READ_MAX_BYTES)
            .unwrap_err()
            .contains("UTF-8")
    );
    assert!(
        read_file(&root, "folder", READ_MAX_BYTES)
            .unwrap_err()
            .contains("fs_list")
    );
    assert!(
        read_file(&root, "missing.txt", READ_MAX_BYTES)
            .unwrap_err()
            .contains("no file")
    );
    // Escapes never reach the filesystem.
    assert!(read_file(&root, "../secret.txt", READ_MAX_BYTES).is_err());
    cleanup(&root);
}

// ----------------------------------------------------------------- fs_list

#[test]
fn list_dir_sorts_folders_first_then_by_name() {
    let root = fixture("list-sort");
    fs::create_dir(root.join("alpha")).unwrap();
    fs::create_dir(root.join("beta")).unwrap();
    fs::write(root.join("a.txt"), b"a").unwrap();
    fs::write(root.join("z.txt"), b"zz").unwrap();

    let out = list_dir(&root, "", 500).unwrap();
    let names: Vec<&str> = out.entries.iter().map(|e| e.name.as_str()).collect();
    assert_eq!(names, vec!["alpha", "beta", "a.txt", "z.txt"]);
    assert!(!out.truncated);
    let a_txt = out.entries.iter().find(|e| e.name == "a.txt").unwrap();
    assert_eq!(a_txt.kind, "file");
    assert_eq!(a_txt.size, Some(1));
    let alpha = out.entries.iter().find(|e| e.name == "alpha").unwrap();
    assert_eq!(alpha.kind, "dir");
    assert_eq!(alpha.size, None);
    cleanup(&root);
}

#[test]
fn list_dir_flags_truncation_and_refuses_files() {
    let root = fixture("list-cap");
    for i in 0..5 {
        fs::write(root.join(format!("f{i}.txt")), b"x").unwrap();
    }
    let out = list_dir(&root, "", 2).unwrap();
    assert_eq!(out.entries.len(), 2);
    assert!(out.truncated);

    fs::write(root.join("single.txt"), b"x").unwrap();
    assert!(
        list_dir(&root, "single.txt", 10)
            .unwrap_err()
            .contains("fs_read")
    );
    cleanup(&root);
}

// ---------------------------------------------------------------- fs_write

#[test]
fn write_file_creates_parents_and_reports_bytes() {
    let root = fixture("write-ok");
    let out = write_file(&root, "deep/nested/hello.txt", "hi", 1024).unwrap();
    assert_eq!(out.bytes, 2);
    assert_eq!(out.path, "deep/nested/hello.txt");
    assert_eq!(
        fs::read_to_string(root.join("deep/nested/hello.txt")).unwrap(),
        "hi"
    );
    // Overwrite in place.
    write_file(&root, "deep/nested/hello.txt", "bye!", 1024).unwrap();
    assert_eq!(
        fs::read_to_string(root.join("deep/nested/hello.txt")).unwrap(),
        "bye!"
    );
    cleanup(&root);
}

#[test]
fn write_file_refuses_escapes_empty_paths_oversized_payloads_and_folders() {
    let root = fixture("write-refuse");
    fs::create_dir(root.join("folder")).unwrap();

    assert!(write_file(&root, "../evil.txt", "x", 1024).is_err());
    assert!(write_file(&root, r"C:\evil.txt", "x", 1024).is_err());
    assert!(write_file(&root, "   ", "x", 1024).is_err());
    assert!(
        write_file(&root, "big.txt", &"x".repeat(64), 32)
            .unwrap_err()
            .contains("refusing")
    );
    assert!(write_file(&root, "folder", "x", 1024).is_err());
    assert!(!root.join("..").join("evil.txt").exists());
    cleanup(&root);
}

// ---------------------------------------------------------------- proc_run

#[test]
fn drain_capped_keeps_up_to_the_cap_and_flags_the_rest() {
    let (kept, truncated) = drain_capped(Cursor::new(vec![b'x'; 100]), 10);
    assert_eq!(kept.len(), 10);
    assert!(truncated);

    let (kept, truncated) = drain_capped(Cursor::new(vec![b'x'; 10]), 10);
    assert_eq!(kept.len(), 10);
    assert!(!truncated);

    let (kept, truncated) = drain_capped(Cursor::new(Vec::<u8>::new()), 10);
    assert!(kept.is_empty());
    assert!(!truncated);
}

#[cfg(windows)]
#[test]
fn run_process_executes_argv_without_a_shell() {
    let root = fixture("proc-echo");
    let out = run_process(
        &[
            "cmd".into(),
            "/c".into(),
            "echo".into(),
            "hello-agent".into(),
        ],
        &root,
        &root,
        Duration::from_secs(10),
        64 * 1024,
    )
    .unwrap();
    assert_eq!(out.exit_code, Some(0));
    assert!(out.stdout.contains("hello-agent"));
    assert!(!out.timed_out);
    assert!(!out.truncated);
    assert!(out.duration_ms < 10_000);
    cleanup(&root);
}

#[cfg(windows)]
#[test]
fn run_process_kills_a_child_that_outlives_the_timeout() {
    let root = fixture("proc-timeout");
    // A pure cmd builtin busy-loop: no grandchildren to orphan when the
    // parent is killed.
    let started = std::time::Instant::now();
    let out = run_process(
        &[
            "cmd".into(),
            "/c".into(),
            "for /L %i in (1,1,99999999) do @rem".into(),
        ],
        &root,
        &root,
        Duration::from_millis(400),
        64 * 1024,
    )
    .unwrap();
    assert!(out.timed_out);
    assert_eq!(out.exit_code, None);
    assert!(
        started.elapsed() < Duration::from_secs(10),
        "kill must be prompt"
    );
    cleanup(&root);
}

#[cfg(windows)]
#[test]
fn run_process_caps_chatty_output_without_blocking_the_child() {
    let root = fixture("proc-cap");
    let out = run_process(
        &[
            "cmd".into(),
            "/c".into(),
            "for /L %i in (1,1,2000) do @echo xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                .into(),
        ],
        &root,
        &root,
        Duration::from_secs(20),
        1000,
    )
    .unwrap();
    assert_eq!(out.exit_code, Some(0));
    assert_eq!(out.stdout.len(), 1000, "the cap holds exactly");
    assert!(out.truncated);
    cleanup(&root);
}

#[test]
fn run_process_reports_actionable_failures() {
    let root = fixture("proc-fail");
    // Bare name that no PATH will satisfy.
    let err = run_process(
        &["syntara-no-such-program-xyz".into()],
        &root,
        &root,
        Duration::from_secs(5),
        1024,
    )
    .unwrap_err();
    assert!(err.contains("could not start"), "got: {err}");

    // Path-like name cannot escape the root.
    let err = run_process(
        &[r"..\evil.exe".into()],
        &root,
        &root,
        Duration::from_secs(5),
        1024,
    )
    .unwrap_err();
    assert!(
        err.contains("escape") || err.contains("absolute"),
        "got: {err}"
    );

    // Empty argv.
    let err = run_process(&[], &root, &root, Duration::from_secs(5), 1024).unwrap_err();
    assert!(err.contains("argv"));
    cleanup(&root);
}

// -------------------------------------------------------------------- todo

#[test]
fn sanitize_todo_trims_drops_empty_and_caps() {
    let items = sanitize_todo(vec![
        "  first  ".into(),
        "   ".into(),
        "".into(),
        "second".into(),
    ]);
    assert_eq!(items, vec!["first", "second"]);

    let many: Vec<String> = (0..TODO_MAX_ITEMS + 25)
        .map(|i| format!("item {i}"))
        .collect();
    assert_eq!(sanitize_todo(many).len(), TODO_MAX_ITEMS);

    let long = "x".repeat(10_000);
    let out = sanitize_todo(vec![long]);
    assert_eq!(out[0].chars().count(), TODO_MAX_CHARS);
}

#[test]
fn timeout_is_clamped_into_the_allowed_window() {
    assert_eq!(clamp_timeout(None), Duration::from_secs(60));
    assert_eq!(clamp_timeout(Some(0)), Duration::from_secs(1));
    assert_eq!(clamp_timeout(Some(5)), Duration::from_secs(5));
    assert_eq!(clamp_timeout(Some(99_999)), Duration::from_secs(300));
}

#[test]
fn results_serialize_camel_case_for_the_webview() {
    let root = fixture("serde");
    fs::write(root.join("a.txt"), b"abc").unwrap();
    let json = serde_json::to_value(read_file(&root, "a.txt", READ_MAX_BYTES).unwrap()).unwrap();
    assert!(json.get("truncated").is_some());
    assert!(json.get("path").is_some());

    let proc = ProcRun {
        exit_code: Some(0),
        stdout: "ok".into(),
        stderr: String::new(),
        timed_out: false,
        truncated: false,
        duration_ms: 1,
    };
    let json = serde_json::to_value(&proc).unwrap();
    assert!(json.get("exitCode").is_some(), "renamed for the webview");
    assert!(json.get("timedOut").is_some());
    assert!(json.get("exit_code").is_none());
    cleanup(&root);
}
