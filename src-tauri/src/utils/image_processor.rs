use image::{DynamicImage, ImageFormat, GenericImageView};
use std::ptr;

pub struct CompressionOptions {
    pub quality: f32,  // 0.0 - 1.0
    pub effort: u8,    // 0-6 (método de compresión)
}

impl Default for CompressionOptions {
    fn default() -> Self {
        Self {
            quality: 0.75,  // 75% - Balance óptimo
            effort: 4,      // Balance velocidad/compresión
        }
    }
}

/// Comprime imagen a WebP usando libwebp-sys (misma librería que Squoosh)
pub fn compress_to_webp(
    image_data: &[u8],
    options: CompressionOptions,
) -> Result<Vec<u8>, String> {
    // Decodificar la imagen
    let img = image::load_from_memory(image_data)
        .map_err(|e| format!("Error al cargar imagen: {}", e))?;
    
    let (width, height) = img.dimensions();
    
    // Validar dimensiones
    if width == 0 || height == 0 {
        return Err("Dimensiones de imagen inválidas".to_string());
    }
    
    // Convertir quality de 0.0-1.0 a 0.0-100.0
    let quality = (options.quality.clamp(0.0, 1.0) * 100.0) as f32;
    
    unsafe {
        // Preparar datos según el formato
        let webp_data = match img {
            DynamicImage::ImageRgba8(rgba) => {
                // Imagen con transparencia (RGBA)
                let raw_data = rgba.into_raw();
                let stride = width as i32 * 4;
                
                let mut output: *mut u8 = ptr::null_mut();
                
                let size = libwebp_sys::WebPEncodeRGBA(
                    raw_data.as_ptr(),
                    width as i32,
                    height as i32,
                    stride,
                    quality,
                    &mut output,
                );
                
                if size == 0 || output.is_null() {
                    return Err("Error codificando WebP (RGBA)".to_string());
                }
                
                // Copiar datos antes de liberar
                let result = std::slice::from_raw_parts(output, size).to_vec();
                libwebp_sys::WebPFree(output as *mut std::ffi::c_void);
                
                result
            }
            _ => {
                // Imagen sin transparencia (RGB)
                let rgb = img.to_rgb8();
                let raw_data = rgb.into_raw();
                let stride = width as i32 * 3;
                
                let mut output: *mut u8 = ptr::null_mut();
                
                let size = libwebp_sys::WebPEncodeRGB(
                    raw_data.as_ptr(),
                    width as i32,
                    height as i32,
                    stride,
                    quality,
                    &mut output,
                );
                
                if size == 0 || output.is_null() {
                    return Err("Error codificando WebP (RGB)".to_string());
                }
                
                // Copiar datos antes de liberar
                let result = std::slice::from_raw_parts(output, size).to_vec();
                libwebp_sys::WebPFree(output as *mut std::ffi::c_void);
                
                result
            }
        };
        
        Ok(webp_data)
    }
}

/// Convierte imagen a base64 WebP
pub fn image_to_base64_webp(
    image_data: &[u8],
    options: CompressionOptions,
) -> Result<String, String> {
    let webp_bytes = compress_to_webp(image_data, options)?;
    use base64::{Engine as _, engine::general_purpose};
    let base64 = general_purpose::STANDARD.encode(&webp_bytes);
    Ok(format!("data:image/webp;base64,{}", base64))
}

/// Detecta el formato de una imagen
pub fn detect_image_format(data: &[u8]) -> Result<ImageFormat, String> {
    image::guess_format(data)
        .map_err(|e| format!("No se pudo detectar el formato: {}", e))
}

/// Obtiene información de la imagen
pub struct ImageMetadata {
    pub width: u32,
    pub height: u32,
    pub format: String,
    pub size: usize,
    pub has_alpha: bool,
}

pub fn get_image_metadata(data: &[u8]) -> Result<ImageMetadata, String> {
    let img = image::load_from_memory(data)
        .map_err(|e| format!("Error al cargar imagen: {}", e))?;
    
    let format = detect_image_format(data)?;
    let (width, height) = img.dimensions();
    let has_alpha = matches!(img, DynamicImage::ImageRgba8(_) | DynamicImage::ImageRgba16(_));
    
    Ok(ImageMetadata {
        width,
        height,
        format: format!("{:?}", format),
        size: data.len(),
        has_alpha,
    })
}

/// Verifica si los datos corresponden a una imagen WebP
pub fn is_webp(data: &[u8]) -> bool {
    // Verificar firma WebP: "RIFF" + tamaño + "WEBP"
    if data.len() < 12 {
        return false;
    }
    
    &data[0..4] == b"RIFF" && &data[8..12] == b"WEBP"
}