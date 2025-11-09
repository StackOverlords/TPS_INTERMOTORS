// Comandos de Tauri para logging desde JavaScript

#[tauri::command]
pub fn log_info(message: String) {
    log::info!("{}", message);
}

#[tauri::command]
pub fn log_error(message: String) {
    log::error!("{}", message);
}

#[tauri::command]
pub fn log_warn(message: String) {
    log::warn!("{}", message);
}

#[tauri::command]
pub fn log_debug(message: String) {
    log::debug!("{}", message);
}
