//! Storage-location contract: which drive the picker preselects, and when a
//! location is too tight for model files.
//!
//! Lives in tests/ for the reason every contract test here does: unit-test
//! harnesses cannot embed the comctl32 v6 manifest (see build.rs and
//! Cargo.toml `[lib] test`). The decisions under test are pure functions over
//! `Volume` values, so they are pinned here with invented drives rather than
//! whatever the machine running them happens to have mounted.

use syntara_desktop_lib::storage::{
    MIN_FREE_BYTES, Volume, human_bytes, longest_prefix_volume, recommend_location, space_warning,
};

const GB: u64 = 1024 * 1024 * 1024;

fn volume(path: &str, free_gb: u64, kind: &str) -> Volume {
    Volume {
        path: path.to_string(),
        label: String::new(),
        total_bytes: (free_gb + 100) * GB,
        free_bytes: free_gb * GB,
        kind: kind.to_string(),
    }
}

#[test]
fn the_roomiest_fixed_drive_is_the_recommendation() {
    let drives = vec![
        volume("C:\\", 12, "fixed"),
        volume("D:\\", 900, "fixed"),
        volume("E:\\", 400, "fixed"),
    ];
    assert_eq!(recommend_location(&drives).as_deref(), Some("D:\\"));
}

#[test]
fn a_network_share_is_never_recommended_even_when_it_is_the_roomiest() {
    // A model on a network share disappears with the share, and the whole
    // point of the picker is that the files stay put.
    let drives = vec![volume("C:\\", 12, "fixed"), volume("Z:\\", 4000, "remote")];
    assert_eq!(recommend_location(&drives).as_deref(), Some("C:\\"));
}

#[test]
fn a_tie_prefers_the_fixed_drive_then_the_shorter_path() {
    let removable = vec![
        volume("F:\\", 500, "removable"),
        volume("C:\\", 500, "fixed"),
    ];
    assert_eq!(recommend_location(&removable).as_deref(), Some("C:\\"));

    let two_fixed = vec![
        volume("D:\\Games", 500, "fixed"),
        volume("E:\\", 500, "fixed"),
    ];
    assert_eq!(recommend_location(&two_fixed).as_deref(), Some("E:\\"));
}

#[test]
fn no_writable_drive_means_no_recommendation() {
    assert_eq!(recommend_location(&[]), None);
    assert_eq!(recommend_location(&[volume("Z:\\", 900, "remote")]), None);
}

#[test]
fn twenty_gigabytes_is_the_floor_for_a_model_drive() {
    assert_eq!(MIN_FREE_BYTES, 20 * GB);
    // Comfortably above the floor: silent.
    assert_eq!(space_warning(21 * GB, 4 * GB), None);
    // Enough for this file, but not for the next one: a warning, not a refusal.
    assert_eq!(
        space_warning(8 * GB, 4 * GB),
        Some("only 8.0 GB free - model downloads will outgrow this drive".to_string())
    );
    // Not enough for this file at all: the import/download refuses.
    assert_eq!(
        space_warning(2 * GB, 4 * GB),
        Some("this needs 4.0 GB but only 2.0 GB is free here".to_string())
    );
}

#[test]
fn the_most_specific_mount_wins_over_the_drive_containing_it() {
    // A model folder on its own mount must be sized by that mount, not by the
    // drive it lives on: /media and /mnt are routinely separate volumes.
    let drives = vec![
        volume("D:\\", 10, "fixed"),
        volume("D:\\Models", 900, "fixed"),
    ];
    let found = longest_prefix_volume("D:\\Models\\qwen.gguf", &drives);
    assert_eq!(found.map(|v| v.free_bytes), Some(900 * GB));
    assert_eq!(
        longest_prefix_volume("D:\\Videos\\clip.mp4", &drives).map(|v| v.free_bytes),
        Some(10 * GB)
    );
    assert_eq!(longest_prefix_volume("Z:\\elsewhere", &drives), None);
}

#[test]
fn byte_labels_are_readable_at_every_scale() {
    assert_eq!(human_bytes(512 * 1024), "512 KB");
    assert_eq!(human_bytes(4 * GB), "4.0 GB");
    assert_eq!(human_bytes(1024 * GB), "1.0 TB");
}

#[test]
fn volumes_serialize_camel_case_for_the_webview() {
    let json = serde_json::to_value(volume("D:\\", 42, "fixed")).unwrap();
    assert_eq!(json["path"], "D:\\");
    assert!(json.get("freeBytes").is_some(), "renamed for the webview");
    assert!(json.get("free_bytes").is_none());
}
