use std::path::Path;

/// Abre el explorador de archivos del sistema en la carpeta que contiene el archivo indicado.
/// Cross-platform: Linux (xdg-open), Windows (explorer /select), macOS (open -R).
#[tauri::command]
pub fn reveal_in_folder(path: String) -> Result<(), String> {
    let p = Path::new(&path);

    // Si el path es un archivo, usar el directorio padre; si ya es carpeta, usarlo directo.
    let target = if p.is_file() {
        p.parent()
            .map(|d| d.to_string_lossy().to_string())
            .unwrap_or(path.clone())
    } else {
        path.clone()
    };

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&target)
            .spawn()
            .map_err(|e| format!("xdg-open failed: {e}"))?;
    }

    #[cfg(target_os = "windows")]
    {
        // /select muestra el archivo seleccionado dentro de la carpeta
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| format!("explorer failed: {e}"))?;
    }

    #[cfg(target_os = "macos")]
    {
        // -R revela el archivo en Finder con selección
        std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| format!("open failed: {e}"))?;
    }

    Ok(())
}
