//! Tauri command surface for the ported QDM download engine.
//!
//! Command names, payloads and return types match QDM's `lib.rs` so the
//! engine-side contract stays identical to upstream.

use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

use super::types::{AppConfig, DownloadItem, NewDownloadRequest, ProbeResult};
use crate::AppState;

// ── Config helpers ─────────────────────────────────────────────────────

fn config_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_config_dir()
        .unwrap_or_default()
        .join("config.json")
}

pub fn default_config(app: &AppHandle) -> AppConfig {
    AppConfig {
        // Deviation from QDM: model files land in a dedicated folder inside
        // app data instead of the user's Downloads directory, so queued
        // multi-file downloads need no per-file save dialog.
        download_dir: app
            .path()
            .app_data_dir()
            .unwrap_or_default()
            .join("models")
            .to_string_lossy()
            .to_string(),
        max_concurrent_downloads: 3,
        max_segments_per_download: 8,
        speed_limit: 0,
        // Syntara renders progress in its own UI; no OS notifications.
        show_notifications: false,
        minimize_to_tray: true,
        start_with_windows: false,
        theme: "dark".to_string(),
        ytdlp_path: String::new(),
        ytdlp_browser: "chrome".to_string(),
    }
}

pub fn load_config(app: &AppHandle) -> AppConfig {
    let path = config_path(app);
    if let Ok(content) = std::fs::read_to_string(&path) {
        if let Ok(stored) = serde_json::from_str::<serde_json::Value>(&content) {
            let defaults = default_config(app);
            return AppConfig {
                download_dir: stored["downloadDir"]
                    .as_str()
                    .unwrap_or(&defaults.download_dir)
                    .to_string(),
                max_concurrent_downloads: stored["maxConcurrentDownloads"]
                    .as_u64()
                    .unwrap_or(defaults.max_concurrent_downloads as u64)
                    as u32,
                max_segments_per_download: stored["maxSegmentsPerDownload"]
                    .as_u64()
                    .unwrap_or(defaults.max_segments_per_download as u64)
                    as u32,
                speed_limit: stored["speedLimit"]
                    .as_u64()
                    .unwrap_or(defaults.speed_limit),
                show_notifications: stored["showNotifications"]
                    .as_bool()
                    .unwrap_or(defaults.show_notifications),
                minimize_to_tray: stored["minimizeToTray"]
                    .as_bool()
                    .unwrap_or(defaults.minimize_to_tray),
                start_with_windows: stored["startWithWindows"]
                    .as_bool()
                    .unwrap_or(defaults.start_with_windows),
                theme: stored["theme"]
                    .as_str()
                    .unwrap_or(&defaults.theme)
                    .to_string(),
                ytdlp_path: stored["ytdlpPath"]
                    .as_str()
                    .unwrap_or(&defaults.ytdlp_path)
                    .to_string(),
                ytdlp_browser: stored["ytdlpBrowser"]
                    .as_str()
                    .unwrap_or(&defaults.ytdlp_browser)
                    .to_string(),
            };
        }
    }
    default_config(app)
}

pub fn save_config(app: &AppHandle, config: &AppConfig) {
    let path = config_path(app);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).ok();
    }
    if let Ok(json) = serde_json::to_string_pretty(config) {
        std::fs::write(&path, json).ok();
    }
}

// ── Download commands ──────────────────────────────────────────────────

#[tauri::command]
pub async fn download_add(
    state: State<'_, AppState>,
    request: NewDownloadRequest,
) -> Result<DownloadItem, String> {
    state.engine.add_download(request).await
}

#[tauri::command]
pub async fn download_start(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<DownloadItem>, String> {
    Ok(state.engine.start_download(&id).await)
}

#[tauri::command]
pub async fn download_pause(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<DownloadItem>, String> {
    Ok(state.engine.pause_download(&id).await)
}

#[tauri::command]
pub async fn download_resume(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<DownloadItem>, String> {
    Ok(state.engine.resume_download(&id).await)
}

#[tauri::command]
pub async fn download_cancel(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    Ok(state.engine.cancel_download(&id).await)
}

#[tauri::command]
pub async fn download_remove(
    state: State<'_, AppState>,
    id: String,
    delete_file: bool,
) -> Result<bool, String> {
    Ok(state.engine.remove_download(&id, delete_file).await)
}

#[tauri::command]
pub async fn download_retry(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<DownloadItem>, String> {
    Ok(state.engine.retry_download(&id).await)
}

#[tauri::command]
pub async fn download_get_all(state: State<'_, AppState>) -> Result<Vec<DownloadItem>, String> {
    Ok(state.engine.get_all_downloads().await)
}

#[tauri::command]
pub async fn download_open_file(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    Ok(state.engine.open_file(&id).await)
}

#[tauri::command]
pub async fn download_open_folder(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    Ok(state.engine.open_folder(&id).await)
}

#[tauri::command]
pub async fn download_pause_all(state: State<'_, AppState>) -> Result<(), String> {
    state.engine.pause_all().await;
    Ok(())
}

#[tauri::command]
pub async fn download_resume_all(state: State<'_, AppState>) -> Result<(), String> {
    state.engine.resume_all().await;
    Ok(())
}

#[tauri::command]
pub async fn download_probe(
    state: State<'_, AppState>,
    url: String,
    headers: Option<std::collections::HashMap<String, String>>,
) -> Result<ProbeResult, String> {
    Ok(match state.engine.probe_url(&url, headers.as_ref()).await {
        Ok(result) => result,
        Err(e) => ProbeResult {
            file_size: -1,
            resumable: false,
            file_name: String::new(),
            final_url: url,
            error: Some(e),
        },
    })
}

#[tauri::command]
pub async fn download_provide_auth(
    state: State<'_, AppState>,
    id: String,
    username: String,
    password: String,
) -> Result<bool, String> {
    Ok(state.engine.provide_auth(&id, &username, &password).await)
}

// ── Config commands ────────────────────────────────────────────────────

#[tauri::command]
pub async fn config_get(state: State<'_, AppState>) -> Result<AppConfig, String> {
    Ok(state.engine.config.lock().await.clone())
}

#[tauri::command]
pub async fn config_set(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    config: serde_json::Value,
) -> Result<AppConfig, String> {
    let current = state.engine.config.lock().await.clone();
    let new_config = AppConfig {
        download_dir: config["downloadDir"]
            .as_str()
            .unwrap_or(&current.download_dir)
            .to_string(),
        max_concurrent_downloads: config["maxConcurrentDownloads"]
            .as_u64()
            .unwrap_or(current.max_concurrent_downloads as u64)
            as u32,
        max_segments_per_download: config["maxSegmentsPerDownload"]
            .as_u64()
            .unwrap_or(current.max_segments_per_download as u64)
            as u32,
        speed_limit: config["speedLimit"].as_u64().unwrap_or(current.speed_limit),
        show_notifications: config["showNotifications"]
            .as_bool()
            .unwrap_or(current.show_notifications),
        minimize_to_tray: config["minimizeToTray"]
            .as_bool()
            .unwrap_or(current.minimize_to_tray),
        start_with_windows: config["startWithWindows"]
            .as_bool()
            .unwrap_or(current.start_with_windows),
        theme: config["theme"]
            .as_str()
            .unwrap_or(&current.theme)
            .to_string(),
        ytdlp_path: config["ytdlpPath"]
            .as_str()
            .unwrap_or(&current.ytdlp_path)
            .to_string(),
        ytdlp_browser: config["ytdlpBrowser"]
            .as_str()
            .unwrap_or(&current.ytdlp_browser)
            .to_string(),
    };
    drop(current);
    state.engine.update_config(new_config.clone()).await;
    save_config(&app_handle, &new_config);
    Ok(new_config)
}

// ── Dialog command ─────────────────────────────────────────────────────

#[tauri::command]
pub async fn dialog_select_folder(app_handle: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::{DialogExt, FilePath};
    let (tx, rx) = tokio::sync::oneshot::channel::<Option<FilePath>>();
    app_handle.dialog().file().pick_folder(move |path| {
        tx.send(path).ok();
    });
    Ok(rx.await.ok().flatten().map(|p| format!("{}", p)))
}
