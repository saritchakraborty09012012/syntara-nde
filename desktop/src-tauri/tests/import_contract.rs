//! Import contract: "copy the model to Syntara" and "move the model to
//! Syntara", and every way those two words can go wrong.
//!
//! The file operations are real (temp directories, real bytes) because the
//! thing worth protecting here is a user-owned model file: a move that
//! deletes the original before the copy is verified, or a copy that
//! overwrites a file already in the model folder, are both unrecoverable and
//! neither shows up in a mocked test.
//!
//! `import_blocking` ends by running the Python inspector. That half needs an
//! interpreter with the `syntara` package on PYTHONPATH (library_e2e.rs covers
//! it, opt-in); here the inspect result is ignored on purpose - these tests
//! assert what happened to the BYTES.

use std::path::Path;

use syntara_desktop_lib::library::{ImportMode, import_blocking, plan_import};

const GIB: u64 = 1024 * 1024 * 1024;

struct Scratch {
    root: std::path::PathBuf,
}

impl Scratch {
    fn new(tag: &str) -> Self {
        let root = std::env::temp_dir().join(format!(
            "syntara-import-{}-{}-{:?}",
            tag,
            std::process::id(),
            std::thread::current().id()
        ));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join("models")).unwrap();
        std::fs::create_dir_all(root.join("elsewhere")).unwrap();
        Scratch { root }
    }

    fn models(&self) -> std::path::PathBuf {
        self.root.join("models")
    }

    fn write_model(&self, name: &str, bytes: usize) -> std::path::PathBuf {
        let path = self.root.join("elsewhere").join(name);
        std::fs::write(&path, vec![7u8; bytes]).unwrap();
        path
    }
}

impl Drop for Scratch {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.root);
    }
}

fn import(scratch: &Scratch, source: &Path, mode: ImportMode, free: Option<u64>) {
    let result = import_blocking(
        None,
        &scratch.models(),
        source.display().to_string(),
        mode,
        free,
    )
    .unwrap_or_else(|reason| panic!("import failed: {reason}"));
    // The inspector needs a Python with the package on it; that half is not
    // what these tests are about.
    let _ = result.inspect;
}

#[test]
fn copy_leaves_the_original_exactly_where_it_was() {
    let scratch = Scratch::new("copy");
    let source = scratch.write_model("qwen.gguf", 4096);
    import(&scratch, &source, ImportMode::Copy, Some(GIB));

    let copy = scratch.models().join("qwen.gguf");
    assert!(copy.is_file(), "the copy is in the model folder");
    assert!(source.is_file(), "a copy never removes the original");
    assert_eq!(std::fs::metadata(&copy).unwrap().len(), 4096);
    assert_eq!(
        std::fs::read(&copy).unwrap(),
        std::fs::read(&source).unwrap()
    );
    // No half-written leftovers next to the real file.
    let strays: Vec<_> = std::fs::read_dir(scratch.models())
        .unwrap()
        .flatten()
        .map(|entry| entry.file_name().to_string_lossy().to_string())
        .filter(|name| name != "qwen.gguf")
        .collect();
    assert!(strays.is_empty(), "unexpected files: {strays:?}");
}

#[test]
fn move_relocates_the_file_and_says_so() {
    let scratch = Scratch::new("move");
    let source = scratch.write_model("glm.gguf", 8192);
    let result = import_blocking(
        None,
        &scratch.models(),
        source.display().to_string(),
        ImportMode::Move,
        Some(GIB),
    )
    .unwrap();

    assert_eq!(result.mode, "move");
    assert!(
        result.source_removed,
        "the original must be gone after a move"
    );
    assert!(!source.exists(), "the original is gone after a move");
    assert_eq!(std::fs::metadata(&result.path).unwrap().len(), 8192);
    assert!(result.warning.is_none());
}

#[test]
fn a_file_already_in_the_model_folder_is_left_alone() {
    let scratch = Scratch::new("same");
    let source = scratch.models().join("already.gguf");
    std::fs::write(&source, vec![1u8; 16]).unwrap();

    let plan = plan_import(&scratch.models(), &source.display().to_string(), None).unwrap();
    assert!(!plan.needs_copy, "copying a file onto itself is not a copy");
    assert_eq!(plan.bytes, 16);

    let result = import_blocking(
        None,
        &scratch.models(),
        source.display().to_string(),
        ImportMode::Move,
        Some(GIB),
    )
    .unwrap();
    assert!(source.is_file(), "the file is still there");
    assert!(
        !result.source_removed,
        "a file that never moved cannot have been removed"
    );
    assert!(
        result.warning.expect("a warning").contains("already"),
        "the UI must be told nothing was moved"
    );
}

#[test]
fn a_name_already_taken_is_never_overwritten() {
    let scratch = Scratch::new("taken");
    let source = scratch.write_model("model.gguf", 32);
    let existing = scratch.models().join("model.gguf");
    std::fs::write(&existing, vec![9u8; 99]).unwrap();

    let reason = plan_import(&scratch.models(), &source.display().to_string(), Some(GIB))
        .expect_err("a second copy of the same name must be refused");
    assert!(
        reason.contains("already exists"),
        "unhelpful reason: {reason}"
    );
    assert_eq!(std::fs::metadata(&existing).unwrap().len(), 99, "untouched");
    assert!(source.is_file());
}

#[test]
fn a_drive_without_room_refuses_before_copying_anything() {
    let scratch = Scratch::new("full");
    let source = scratch.write_model("big.gguf", 4096);
    let reason = plan_import(&scratch.models(), &source.display().to_string(), Some(1024))
        .expect_err("a file that cannot fit must be refused");
    assert!(reason.contains("free space"), "unhelpful reason: {reason}");
    assert!(source.is_file(), "the original is untouched");
    assert!(!scratch.models().join("big.gguf").exists());
}

#[test]
fn a_missing_source_is_an_error_naming_the_path() {
    let scratch = Scratch::new("missing");
    let ghost = scratch.root.join("elsewhere").join("ghost.gguf");
    let reason = plan_import(&scratch.models(), &ghost.display().to_string(), Some(GIB))
        .expect_err("a file that is not there cannot be imported");
    assert!(reason.contains("ghost.gguf"), "unhelpful reason: {reason}");
}

#[test]
fn a_folder_is_not_a_model() {
    let scratch = Scratch::new("folder");
    let reason = plan_import(
        &scratch.models(),
        &scratch.root.join("elsewhere").display().to_string(),
        Some(GIB),
    )
    .expect_err("a directory is not importable");
    assert!(reason.contains("not a file"), "unhelpful reason: {reason}");
}

#[test]
fn an_unknown_drive_size_does_not_refuse() {
    let scratch = Scratch::new("unknown");
    let source = scratch.write_model("ok.gguf", 64);
    // None means "we could not measure it", which is not a reason to stop.
    assert!(plan_import(&scratch.models(), &source.display().to_string(), None).is_ok());
}
