//! Where model files live: local volumes, free space, and the one honest
//! answer to "which drive should this go on?".
//!
//! Model files are the only thing in Syntara that gets big - a single GGUF
//! runs from a few GB to several hundred - so the storage folder is chosen by
//! the user, before the first download, not discovered afterwards. The UI
//! needs three things from here:
//!
//! 1. the list of local volumes with their free space, so the picker can show
//!    real numbers instead of "C:\";
//! 2. a recommendation, which is the volume with the most free space (the
//!    rule the product asks for: the roomiest disk is prescribed, and it is
//!    labelled "(recommended)");
//! 3. a warning when the chosen volume is too tight to be a safe default for
//!    model downloads (below [`MIN_FREE_BYTES`]).
//!
//! Everything that decides is a pure function over [`Volume`] values, so the
//! decision is unit-testable on any platform (see `tests/storage_contract.rs`)
//! while only the enumeration is platform code.

use serde::Serialize;

/// Free space a volume should have before it is a safe default for model
/// downloads: 20 GiB. Below this the picker warns instead of silently
/// filling a disk the user assumed had room.
pub const MIN_FREE_BYTES: u64 = 20 * 1024 * 1024 * 1024;

/// One local, writable volume. `kind` is `fixed`, `removable`, `remote` or
/// `unknown`; remote volumes are listed but never recommended (a model on a
/// network share disappears with the share).
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Volume {
    /// `C:\`, `D:\`, `/`, `/Volumes/Work` - what the picker shows.
    pub path: String,
    /// Volume label when the OS has one ("Data", "Macintosh HD"); empty
    /// otherwise. Never used as an identity: labels repeat, paths do not.
    pub label: String,
    pub total_bytes: u64,
    pub free_bytes: u64,
    pub kind: String,
}

impl Volume {
    /// A volume usable as a model store: known-local and not read-only.
    pub fn is_writable(&self) -> bool {
        matches!(self.kind.as_str(), "fixed" | "removable" | "unknown")
    }
}

/// The volume list plus the derived answer, as the UI consumes it.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VolumeReport {
    pub volumes: Vec<Volume>,
    /// Path of the roomiest writable volume, or null when none qualifies.
    pub recommended: Option<String>,
    /// The 20 GiB floor, so the UI states the same number the check uses
    /// instead of hard-coding "20 GB" in two places.
    pub min_free_bytes: u64,
}

/// The roomiest writable volume: most free space first. Ties go to the fixed
/// volume, then to the shorter path, so the recommendation is stable across
/// runs rather than depending on enumeration order (which Windows does not
/// promise and which changes with hot-plugged media).
pub fn recommend_location(volumes: &[Volume]) -> Option<String> {
    volumes
        .iter()
        .filter(|volume| volume.is_writable())
        .max_by(|a, b| {
            a.free_bytes
                .cmp(&b.free_bytes)
                .then_with(|| fixed_rank(&a.kind).cmp(&fixed_rank(&b.kind)))
                // Then the shorter path: the system drive is the one a user recognises as
                // "the default", so a tie should not land them on D:\Games.
                .then_with(|| b.path.len().cmp(&a.path.len()))
                .then_with(|| a.path.cmp(&b.path))
        })
        .map(|volume| volume.path.clone())
}

fn fixed_rank(kind: &str) -> u8 {
    match kind {
        "fixed" => 2,
        "removable" => 1,
        _ => 0,
    }
}

/// The warning shown next to a chosen location, or `None` when the choice is
/// fine. Two separate conditions, because they need different words:
///
/// - not enough room for *this* file (`required`), which is a refusal the
///   import/download path reports as an error;
/// - enough room for this file but under [`MIN_FREE_BYTES`] overall, which is
///   a caution: a 2 GB download into a 4 GB volume succeeds and leaves the
///   machine worse off than the user expected.
pub fn space_warning(free_bytes: u64, required_bytes: u64) -> Option<String> {
    if free_bytes < required_bytes {
        return Some(format!(
            "this needs {} but only {} is free here",
            human_bytes(required_bytes),
            human_bytes(free_bytes)
        ));
    }
    if free_bytes < MIN_FREE_BYTES {
        return Some(format!(
            "only {} free - model downloads will outgrow this drive",
            human_bytes(free_bytes)
        ));
    }
    None
}

/// Whether a download/import of `required_bytes` fits on this volume. Used by
/// the import command before it copies anything, so a refused move never
/// truncates a file the user owns.
pub fn has_room(free_bytes: u64, required_bytes: u64) -> bool {
    free_bytes >= required_bytes
}

/// Decimal-ish GB/TB labels. Byte-exact numbers are in the tooltip; these
/// are for the picker rows, and the floor is compared in bytes, never here.
pub fn human_bytes(bytes: u64) -> String {
    const GB: f64 = 1_073_741_824.0;
    let value = bytes as f64;
    if value >= 1_099_511_627_776.0 {
        format!("{:.1} TB", value / 1_099_511_627_776.0)
    } else if value >= GB {
        format!("{:.1} GB", value / GB)
    } else if value >= 1_048_576.0 {
        format!("{:.0} MB", value / 1_048_576.0)
    } else {
        format!("{:.0} KB", value / 1024.0)
    }
}

// ── enumeration (platform code; the decisions above are not) ─────────────

#[cfg(windows)]
mod platform {
    use super::Volume;

    const DRIVE_FIXED: u32 = 3;
    const DRIVE_REMOVABLE: u32 = 2;
    const DRIVE_REMOTE: u32 = 4;

    // Raw Win32 rather than the `windows`/`sysinfo` crates: the shell already
    // declares the handful of extern "system" calls it needs (see host.rs),
    // and a disk listing is three functions, not a dependency.
    unsafe extern "system" {
        fn GetLogicalDriveStringsW(buff_len: u32, buffer: *mut u16) -> u32;
        fn GetDiskFreeSpaceExW(
            dir_name: *const u16,
            free_to_caller: *mut u64,
            total_bytes: *mut u64,
            total_free: *mut u64,
        ) -> i32;
        fn GetVolumeInformationW(
            root_path: *const u16,
            volume_name: *mut u16,
            volume_name_len: u32,
            _serial: *mut u32,
            _max_component_len: *mut u32,
            _flags: *mut u32,
            fs_name: *mut u16,
            fs_name_len: u32,
        ) -> i32;
        fn GetDriveTypeW(root_path: *const u16) -> u32;
    }

    fn wide(text: &str) -> Vec<u16> {
        text.encode_utf16().chain(std::iter::once(0)).collect()
    }

    fn from_wide(buffer: &[u16]) -> String {
        String::from_utf16_lossy(buffer)
            .trim_end_matches('\0')
            .to_string()
    }

    fn kind_of(path: &str) -> &'static str {
        let mut root = wide(path);
        let code = unsafe { GetDriveTypeW(root.as_mut_ptr()) };
        match code {
            DRIVE_FIXED => "fixed",
            DRIVE_REMOVABLE => "removable",
            DRIVE_REMOTE => "remote",
            _ => "unknown",
        }
    }

    fn query(root: &str) -> Option<Volume> {
        let mut root_wide = wide(root);
        let (mut free, mut total) = (0u64, 0u64);
        let ok = unsafe {
            GetDiskFreeSpaceExW(
                root_wide.as_ptr(),
                &mut free,
                &mut total,
                std::ptr::null_mut(),
            )
        };
        if ok == 0 {
            return None;
        }
        let mut label_buffer = [0u16; 256];
        let label = unsafe {
            GetVolumeInformationW(
                root_wide.as_mut_ptr(),
                label_buffer.as_mut_ptr(),
                label_buffer.len() as u32,
                std::ptr::null_mut(),
                std::ptr::null_mut(),
                std::ptr::null_mut(),
                std::ptr::null_mut(),
                0,
            )
        };
        let label = if label != 0 {
            from_wide(&label_buffer)
        } else {
            String::new()
        };
        Some(Volume {
            path: root.to_string(),
            label,
            total_bytes: total,
            free_bytes: free,
            kind: kind_of(root).to_string(),
        })
    }

    pub fn list() -> Vec<Volume> {
        let needed = unsafe { GetLogicalDriveStringsW(0, std::ptr::null_mut()) };
        if needed == 0 {
            return Vec::new();
        }
        let mut buffer = vec![0u16; needed as usize];
        let written = unsafe { GetLogicalDriveStringsW(needed, buffer.as_mut_ptr()) };
        if written == 0 {
            return Vec::new();
        }
        buffer.truncate(written as usize);
        let mut volumes = Vec::new();
        for chunk in buffer.split(|unit| *unit == 0) {
            let root: String = String::from_utf16_lossy(chunk);
            if root.len() < 2 {
                continue;
            }
            if let Some(volume) = query(&root) {
                volumes.push(volume);
            }
        }
        volumes
    }
}

#[cfg(unix)]
mod platform {
    use super::Volume;
    use std::ffi::CString;
    use std::path::Path;

    // `libc` rather than a hand-rolled statvfs binding: the struct layout
    // differs between Linux and macOS (field order and the types of
    // f_blocks/f_bfree), and a wrong guess reads garbage instead of failing.
    // It is already in the lock file through tauri, so this adds no new
    // third-party code to the build.
    fn probe(path: &str) -> Option<Volume> {
        let c_path = CString::new(path).ok()?;
        let mut stat: libc::statvfs = unsafe { std::mem::zeroed() };
        if unsafe { libc::statvfs(c_path.as_ptr(), &mut stat) } != 0 {
            return None;
        }
        let block = if stat.f_frsize > 0 {
            stat.f_frsize as u64
        } else {
            stat.f_bsize as u64
        };
        let total = stat.f_blocks as u64 * block;
        // f_bavail is what an unprivileged process may actually use; f_bfree
        // counts blocks held by root and would overstate the room.
        let free = stat.f_bavail as u64 * block;
        Some(Volume {
            path: path.to_string(),
            label: String::new(),
            total_bytes: total,
            free_bytes: free,
            kind: "fixed".to_string(),
        })
    }

    /// Mount points worth offering. macOS puts every disk under /Volumes;
    /// Linux uses /media and /mnt, plus anything the user has already mounted
    /// under /run/media (USB sticks) - everything already exists on disk, so
    /// this never has to guess a device name or mount one.
    fn candidates() -> Vec<String> {
        let mut paths = vec!["/".to_string()];
        for parent in ["/Volumes", "/media", "/mnt", "/run/media"] {
            let Ok(entries) = std::fs::read_dir(parent) else {
                continue;
            };
            for entry in entries.flatten() {
                let Ok(kind) = entry.file_type() else {
                    continue;
                };
                // One level deep: /Volumes/<disk>, /media/<user>/<disk> is the
                // odd one out and is reached through the user directory.
                if kind.is_dir() {
                    paths.push(entry.path().to_string_lossy().to_string());
                }
            }
        }
        paths.sort();
        paths.dedup();
        paths
    }

    pub fn list() -> Vec<Volume> {
        let mut volumes: Vec<Volume> = candidates()
            .into_iter()
            .filter_map(|path| probe(&path))
            .collect();
        // Keep only real filesystems: /run/media and /mnt are often tmpfs or
        // ramfs, where a 40 GB model vanishes on reboot.
        volumes.retain(|volume| {
            !Path::new(&volume.path).starts_with("/run") && volume.total_bytes > volume.free_bytes
        });
        volumes
    }
}

#[cfg(not(any(windows, unix)))]
mod platform {
    use super::Volume;

    pub fn list() -> Vec<Volume> {
        Vec::new()
    }
}

/// Every local volume the OS reports, with free space. Never fails: an
/// unreadable drive is simply absent from the list, and an empty list means
/// the UI keeps the current folder instead of guessing.
pub fn list_volumes() -> Vec<Volume> {
    platform::list()
}

/// The listed volume that holds `path`, by longest prefix. Pure, so the rule
/// ("a more specific mount wins over the drive that contains it") is testable
/// without a machine that happens to have two nested mounts.
pub fn longest_prefix_volume<'a>(path: &str, volumes: &'a [Volume]) -> Option<&'a Volume> {
    volumes
        .iter()
        .filter(|volume| is_on(path, &volume.path))
        .max_by_key(|volume| volume.path.len())
}

/// The volume that actually holds `path`, or `None` when no listed volume is
/// a prefix of it (an unmounted path, or a folder on a drive that is not
/// writable).
pub fn volume_for(path: &str) -> Option<Volume> {
    longest_prefix_volume(path, &list_volumes()).cloned()
}

/// Free space on the volume that holds `path` - what the import and download
/// paths check before writing a multi-gigabyte file.
pub fn free_space_for(path: &str) -> Option<u64> {
    volume_for(path).map(|volume| volume.free_bytes)
}

/// Whether `path` lives on `volume`. Windows paths compare case-insensitively
/// (`c:\\models` and `C:\\` are the same drive); POSIX paths do not, because
/// `/mnt/Data` and `/mnt/data` can genuinely be two different mounts.
fn is_on(path: &str, volume: &str) -> bool {
    #[cfg(windows)]
    {
        path.to_lowercase().starts_with(&volume.to_lowercase())
    }
    #[cfg(not(windows))]
    {
        path.starts_with(volume)
    }
}

/// The list plus the recommendation, in the shape the command returns.
pub fn volume_report() -> VolumeReport {
    let volumes = list_volumes();
    VolumeReport {
        recommended: recommend_location(&volumes),
        min_free_bytes: MIN_FREE_BYTES,
        volumes,
    }
}

// ── command ─────────────────────────────────────────────────────────────

/// Drives, their free space, and which one the picker should preselect.
#[tauri::command]
pub fn storage_list_volumes() -> VolumeReport {
    volume_report()
}
