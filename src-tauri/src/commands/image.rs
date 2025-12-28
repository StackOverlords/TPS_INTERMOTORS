use crate::utils::image_processor::{
    get_image_metadata, image_to_base64_webp, is_webp, CompressionOptions,
};
use base64::{engine::general_purpose, Engine};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct ImageInfo {
    pub width: u32,
    pub height: u32,
    pub format: String,
    pub size: usize,
    #[serde(rename = "isWebP")]
    pub is_web_p: bool,
}

/// Comprime imagen a WebP con opciones personalizables
#[tauri::command]
pub async fn compress_image_to_webp(
    base64_data: String,
    quality: Option<f32>,
    effort: Option<u8>,
) -> Result<String, String> {
    // Extraer datos del base64
    let data = if let Some(comma_pos) = base64_data.find(',') {
        &base64_data[comma_pos + 1..]
    } else {
        &base64_data
    };

    // Decodificar base64
    let image_bytes = general_purpose::STANDARD
        .decode(data)
        .map_err(|e| format!("Error decodificando base64: {}", e))?;

    // Configurar opciones (valores óptimos)
    let options = CompressionOptions {
        quality: quality.unwrap_or(0.75), // 75% por defecto
        effort: effort.unwrap_or(4),      // Esfuerzo 4 (balance)
    };

    // Comprimir
    image_to_base64_webp(&image_bytes, options)
}

/// Obtiene información detallada de la imagen
#[tauri::command]
pub async fn get_image_info(base64_data: String) -> Result<ImageInfo, String> {
    let data = if let Some(comma_pos) = base64_data.find(',') {
        &base64_data[comma_pos + 1..]
    } else {
        &base64_data
    };

    let image_bytes = general_purpose::STANDARD
        .decode(data)
        .map_err(|e| format!("Error decodificando: {}", e))?;

    let metadata = get_image_metadata(&image_bytes)?;
    let is_webp_format = is_webp(&image_bytes);

    Ok(ImageInfo {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        is_web_p: is_webp_format,
    })
}

/// Verifica si una imagen ya está en formato WebP
#[tauri::command]
pub async fn check_is_webp(base64_data: String) -> Result<bool, String> {
    let data = if let Some(comma_pos) = base64_data.find(',') {
        &base64_data[comma_pos + 1..]
    } else {
        &base64_data
    };

    let image_bytes = general_purpose::STANDARD
        .decode(data)
        .map_err(|e| format!("Error: {}", e))?;

    Ok(is_webp(&image_bytes))
}