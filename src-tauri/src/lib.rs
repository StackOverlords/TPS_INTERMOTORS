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
            // Comandos de clipboard
            commands::clipboard::read_clipboard_image,
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
            // Comandos de plugins externos (Fase 4)
            commands::plugins::get_external_plugins,
            commands::plugins::install_plugin,
            commands::plugins::uninstall_plugin,
            commands::plugins::set_plugin_enabled,
        ])
        .setup(|app| {
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

            // Habilitar asset protocol scope para el directorio de plugins.
            // Esto permite al WebView hacer fetch de los remoteEntry.js via asset://
            // usando convertFileSrc() en el lado TypeScript.
            //
            // API: app.asset_protocol_scope().allow_directory(dir, recursive)
            // Disponible porque tauri feature "protocol-asset" está activada en Cargo.toml.
            // El scope estático de tauri.conf.json (assetProtocol.scope) solo soporta
            // variables conocidas en tiempo de build; app_data_dir es dinámico, por eso
            // se permite en runtime aquí.
            {
                let plugins_dir = app
                    .path()
                    .app_data_dir()
                    .map(|d| d.join("plugins"))
                    .ok();
                if let Some(dir) = plugins_dir {
                    // Crear el dir si no existe para que allow_directory no falle
                    let _ = std::fs::create_dir_all(&dir);
                    if let Err(e) = app.asset_protocol_scope().allow_directory(&dir, true) {
                        log::warn!("No se pudo habilitar asset scope para plugins: {e}");
                    } else {
                        log::info!("Asset protocol scope habilitado para: {}", dir.display());
                    }
                }
            }

            // Generar un log inicial para crear el archivo
            log::info!("TPS Intermotors iniciado correctamente");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
