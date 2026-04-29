use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};

pub mod commands;
pub mod utils;
mod logging;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            // Comandos de imagen
            commands::image::compress_image_to_webp,
            commands::image::get_image_info,
            commands::image::check_is_webp,
            // Comandos de sistema de archivos
            commands::fs::reveal_in_folder,
            // Comandos de logging
            logging::log_info,
            logging::log_error,
            logging::log_warn,
            logging::log_debug,
        ])
        .setup(|app| {
            if option_env!("TAURI_DEV_TOOLS").is_some() {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }

            // Habilitar logging tanto en desarrollo como en producción
            let log_level = if cfg!(debug_assertions) {
                log::LevelFilter::Debug
            } else {
                log::LevelFilter::Info
            };

            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log_level)
                    .targets([
                        // Logs en stdout (terminal)
                        Target::new(TargetKind::Stdout),
                        // Logs en el webview (consola del navegador)
                        Target::new(TargetKind::Webview),
                        // Logs persistentes en archivo
                        Target::new(TargetKind::LogDir {
                            file_name: Some("app".into()),
                        }),
                    ])
                    .build(),
            )?;

            // Generar un log inicial para crear el archivo
            log::info!("TPS Intermotors iniciado correctamente");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
