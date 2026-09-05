use tauri_plugin_log::{Target, TargetKind};

pub mod commands;
pub mod utils;
mod logging;

/// Determina el MIME type correcto por extensión de archivo.
/// CRÍTICO para que WebKitGTK acepte los module scripts ESM.
fn mime_type_for(path: &std::path::Path) -> &'static str {
    match path.extension().and_then(|e| e.to_str()) {
        Some("js") | Some("mjs") => "text/javascript",
        Some("json") => "application/json",
        Some("css") => "text/css",
        Some("wasm") => "application/wasm",
        Some("map") => "application/json",
        Some("html") | Some("htm") => "text/html",
        _ => "application/octet-stream",
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // -----------------------------------------------------------------------
        // Custom URI scheme `plugin://` para servir bundles ESM de plugins externos.
        //
        // Por qué NO usamos el asset protocol:
        //   `convertFileSrc()` encodea toda la ruta con encodeURIComponent → los `/`
        //   se convierten en `%2F` → un solo segmento → los `import("./assets/...")` del
        //   remoteEntry.js de Module Federation resuelven a la raíz → chunks 404.
        //   Con un scheme propio NOSOTROS controlamos el parsing y preservamos la
        //   estructura de directorios para que la resolución relativa funcione.
        //
        // Firma usada (tauri 2.9):
        //   register_uri_scheme_protocol<N, T, H>(uri_scheme: N, protocol_handler: H) -> Self
        //   H: Fn(UriSchemeContext<'_, R>, Request<Vec<u8>>) -> Response<T> + Send + Sync + 'static
        //   donde UriSchemeContext::app_handle() -> &AppHandle<R>
        //
        // Mapeo de URLs:
        //   Linux/macOS: plugin://localhost/<id>/remoteEntry.js → <plugins_dir>/<id>/remoteEntry.js
        //   Windows:     http://plugin.localhost/<id>/...        → idem
        // -----------------------------------------------------------------------
        .register_uri_scheme_protocol("plugin", |ctx, request| {
            // Obtener la URI del request
            let uri = request.uri().to_string();

            // Extraer el path después del host. Las URIs tienen forma:
            //   plugin://localhost/<path>   (Linux/macOS)
            //   http://plugin.localhost/<path>  (Windows — Tauri normaliza internamente)
            // Buscamos el tercer "/" que separa el host del path.
            let path_str = uri
                .splitn(4, '/')
                .nth(3)
                .unwrap_or("")
                .to_string();

            // Percent-decode el path para manejar caracteres especiales.
            let decoded = percent_decode(&path_str);

            // Resolver el directorio de plugins via el helper de commands::plugins.
            let app = ctx.app_handle();
            let plugins_base = match commands::plugins::plugins_dir(app) {
                Ok(p) => p,
                Err(e) => {
                    log::error!("plugin:// handler — no se pudo resolver plugins_dir: {e}");
                    return tauri::http::Response::builder()
                        .status(500)
                        .header("Content-Type", "text/plain")
                        .body(b"Internal Server Error".to_vec())
                        .unwrap();
                }
            };

            // Construir el path candidato dentro de plugins_dir.
            // decoded puede ser "" si la URI es plugin://localhost/ sin path.
            let candidate = plugins_base.join(&decoded);

            // SEGURIDAD anti path-traversal: canonicalizar ambos paths y verificar
            // que el candidato esté DENTRO de plugins_base.
            let canonical_base = match plugins_base.canonicalize() {
                Ok(p) => p,
                Err(e) => {
                    log::error!("plugin:// handler — no se pudo canonicalizar plugins_dir: {e}");
                    return tauri::http::Response::builder()
                        .status(500)
                        .header("Content-Type", "text/plain")
                        .body(b"Internal Server Error".to_vec())
                        .unwrap();
                }
            };

            let canonical_candidate = match candidate.canonicalize() {
                Ok(p) => p,
                Err(_) => {
                    // canonicalize falla si el archivo no existe
                    log::warn!("plugin:// handler — archivo no encontrado: {}", candidate.display());
                    return tauri::http::Response::builder()
                        .status(404)
                        .header("Content-Type", "text/plain")
                        .body(b"Not Found".to_vec())
                        .unwrap();
                }
            };

            // Verificar que el path está dentro de plugins_dir (anti path-traversal).
            if !canonical_candidate.starts_with(&canonical_base) {
                log::warn!(
                    "plugin:// handler — intento de path-traversal bloqueado: {}",
                    canonical_candidate.display()
                );
                return tauri::http::Response::builder()
                    .status(403)
                    .header("Content-Type", "text/plain")
                    .body(b"Forbidden".to_vec())
                    .unwrap();
            }

            // Leer el archivo.
            let bytes = match std::fs::read(&canonical_candidate) {
                Ok(b) => b,
                Err(e) => {
                    log::error!(
                        "plugin:// handler — error leyendo {}: {e}",
                        canonical_candidate.display()
                    );
                    return tauri::http::Response::builder()
                        .status(500)
                        .header("Content-Type", "text/plain")
                        .body(b"Internal Server Error".to_vec())
                        .unwrap();
                }
            };

            let mime = mime_type_for(&canonical_candidate);
            log::debug!(
                "plugin:// serving {} ({}) — {} bytes",
                canonical_candidate.display(),
                mime,
                bytes.len()
            );

            tauri::http::Response::builder()
                .status(200)
                .header("Content-Type", mime)
                .header("Access-Control-Allow-Origin", "*")
                .body(bytes)
                .unwrap()
        })
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

            // NOTA: el bloque `asset_protocol_scope().allow_directory(...)` fue ELIMINADO.
            // El asset protocol ya no se usa para plugins — reemplazado por el custom scheme
            // `plugin://` registrado arriba, que sirve correctamente los bundles ESM
            // multi-chunk de Module Federation preservando la estructura de directorios.

            // Generar un log inicial para crear el archivo
            log::info!("TPS Intermotors iniciado correctamente");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Decodifica percent-encoding en un path string.
/// Reemplaza `%XX` → byte crudo y convierte a String UTF-8.
/// En caso de secuencias inválidas, devuelve el string original.
fn percent_decode(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let (Some(h), Some(l)) = (
                hex_val(bytes[i + 1]),
                hex_val(bytes[i + 2]),
            ) {
                out.push(h << 4 | l);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8(out).unwrap_or_else(|_| s.to_string())
}

/// Convierte un dígito hexadecimal ASCII (0-9, a-f, A-F) a su valor numérico.
fn hex_val(b: u8) -> Option<u8> {
    match b {
        b'0'..=b'9' => Some(b - b'0'),
        b'a'..=b'f' => Some(b - b'a' + 10),
        b'A'..=b'F' => Some(b - b'A' + 10),
        _ => None,
    }
}
