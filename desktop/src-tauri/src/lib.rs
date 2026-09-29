mod qdm;

use std::sync::Arc;

/// Shared Tauri state. The download engine is QDM's, see `qdm::mod` for the
/// port notes and upstream attribution.
pub struct AppState {
    pub engine: Arc<qdm::DownloadEngine>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            qdm::commands::download_add,
            qdm::commands::download_start,
            qdm::commands::download_pause,
            qdm::commands::download_resume,
            qdm::commands::download_cancel,
            qdm::commands::download_remove,
            qdm::commands::download_retry,
            qdm::commands::download_get_all,
            qdm::commands::download_missing_files,
            qdm::commands::download_open_file,
            qdm::commands::download_open_folder,
            qdm::commands::download_pause_all,
            qdm::commands::download_resume_all,
            qdm::commands::download_probe,
            qdm::commands::download_provide_auth,
            qdm::commands::config_get,
            qdm::commands::config_set,
            qdm::commands::dialog_select_folder,
        ])
        .setup(|app| {
            use tauri::Manager;
            use tauri::menu::{MenuBuilder, MenuItemBuilder};
            use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

            let config = qdm::commands::load_config(app.handle());
            let engine = qdm::DownloadEngine::new(config, app.handle().clone());
            app.manage(AppState { engine });

            let show = MenuItemBuilder::with_id("show", "Show Syntara").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit Syntara").build(app)?;
            let menu = MenuBuilder::new(app).items(&[&show, &quit]).build()?;

            let mut builder = TrayIconBuilder::with_id("syntara-tray")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                });

            if let Some(icon) = app.default_window_icon().cloned() {
                builder = builder.icon(icon);
            }
            builder.build(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run the Syntara desktop application");
}
