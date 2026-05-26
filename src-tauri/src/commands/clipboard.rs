use arboard::Clipboard;
use base64::{engine::general_purpose, Engine};
use image::{ImageBuffer, RgbaImage};
use std::io::Cursor;

#[tauri::command]
pub fn read_clipboard_image() -> Result<String, String> {
    let mut clipboard =
        Clipboard::new().map_err(|e| format!("Error abriendo clipboard: {e}"))?;

    let image_data = clipboard
        .get_image()
        .map_err(|_| "no_image".to_string())?;

    let width = image_data.width as u32;
    let height = image_data.height as u32;
    let bytes: Vec<u8> = image_data.bytes.into_owned();

    let img: RgbaImage = ImageBuffer::from_raw(width, height, bytes)
        .ok_or("Error creando buffer de imagen")?;

    let mut png_bytes: Vec<u8> = Vec::new();
    img.write_to(&mut Cursor::new(&mut png_bytes), image::ImageFormat::Png)
        .map_err(|e| format!("Error convirtiendo a PNG: {e}"))?;

    Ok(general_purpose::STANDARD.encode(&png_bytes))
}
