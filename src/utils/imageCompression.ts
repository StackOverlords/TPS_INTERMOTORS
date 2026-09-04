import { getHttp, getImageProcessor } from "@/platform";

export interface CompressionOptions {
  quality?: number; // 0-100 (default: 75)
  effort?: number; // 0-6 (default: 4)
}

export interface ImageInfo {
  width: number;
  height: number;
  format: string;
  size: number;
  isWebP: boolean;
}

export interface CompressionResult {
  data: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  skipped: boolean;
  reason?: string;
}

/**
 * Detecta si una imagen ya es WebP
 */
function isWebPImage(base64Data: string): boolean {
  return base64Data.startsWith("data:image/webp");
}

/**
 * Estima la calidad de una imagen WebP basándose en su tamaño
 * Heurística: bytes por pixel indica nivel de compresión
 */
async function estimateWebPQuality(base64Data: string): Promise<number> {
  return new Promise((resolve) => {
    const base64Content = base64Data.split(",")[1] || base64Data;
    const sizeInBytes = (base64Content.length * 3) / 4;

    const img = new Image();
    img.onload = () => {
      const pixels = img.width * img.height;
      const bytesPerPixel = sizeInBytes / pixels;

      // Heurística basada en bytes por pixel
      // >3 bpp = alta calidad (~90%)
      // 1.5-3 bpp = media-alta (~75-85%)
      // 0.8-1.5 bpp = media (~60-75%)
      // <0.8 bpp = baja (<60%)

      let estimatedQuality: number;
      if (bytesPerPixel > 3) {
        estimatedQuality = 90;
      } else if (bytesPerPixel > 2) {
        estimatedQuality = 85;
      } else if (bytesPerPixel > 1.5) {
        estimatedQuality = 75;
      } else if (bytesPerPixel > 0.8) {
        estimatedQuality = 60;
      } else {
        estimatedQuality = 40;
      }

      resolve(estimatedQuality);
    };
    img.onerror = () => resolve(75); // Default si falla
    img.src = base64Data;
  });
}

/**
 * Obtiene información detallada de la imagen
 */
export async function getImageInfo(base64Data: string): Promise<ImageInfo> {
  try {
    return await getImageProcessor().getImageInfo(base64Data);
  } catch (error) {
    console.error("Error getting image info:", error);
    throw error;
  }
}

/**
 * Reglas:
 * 1. Si NO es WebP → Comprimir siempre
 * 2. Si ES WebP y calidad actual > calidad solicitada → Comprimir (reducir es válido)
 * 3. Si ES WebP y calidad actual ≤ calidad solicitada → NO comprimir (evitar ruido)
 */
export async function smartCompressToWebP(
  base64Data: string,
  options: CompressionOptions = {},
): Promise<CompressionResult> {
  const { quality = 75, effort = 4 } = options;

  try {
    const isWebP = isWebPImage(base64Data);
    const originalSize =
      (base64Data.split(",")[1]?.length || base64Data.length) * 0.75;

    if (isWebP) {
      // Estimar calidad actual
      const currentQuality = await estimateWebPQuality(base64Data);

      if (currentQuality <= quality) {
        return {
          data: base64Data,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1,
          skipped: true,
          reason: `Ya es WebP con calidad ~${currentQuality}%. No se comprime para evitar degradación (solicitado: ${quality}%)`,
        };
      }

      // Si llegamos aquí: currentQuality > quality → Podemos comprimir
      console.log(`Comprimiendo WebP: ${currentQuality}% → ${quality}%`);
    }

    // Comprimir (sea por no ser WebP o por reducción de calidad válida)
    const compressed = await getImageProcessor().compressToWebP(base64Data, {
      quality: quality / 100,
      effort,
    });

    const compressedSize =
      (compressed.split(",")[1]?.length || compressed.length) * 0.75;

    return {
      data: compressed,
      originalSize,
      compressedSize,
      compressionRatio: compressedSize / originalSize,
      skipped: false,
    };
  } catch (error) {
    console.error("Error compressing image:", error);
    throw new Error(`No se pudo comprimir la imagen: ${error}`);
  }
}

/**
 * Comprime imagen forzadamente (siempre recomprime)
 * Usar solo cuando se necesite específicamente
 */
export async function forceCompressToWebP(
  base64Data: string,
  options: CompressionOptions = {},
): Promise<string> {
  const { quality = 75, effort = 4 } = options;

  try {
    return await getImageProcessor().compressToWebP(base64Data, {
      quality: quality / 100,
      effort,
    });
  } catch (error) {
    console.error("Error compressing image:", error);
    throw new Error(`No se pudo comprimir la imagen: ${error}`);
  }
}

/**
 * Formatea bytes a tamaño legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calcula el ahorro de compresión en porcentaje
 */
export function calculateSavings(
  originalSize: number,
  compressedSize: number,
): number {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}

/**
 * Convierte un File a base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Error leyendo el archivo"));
    reader.readAsDataURL(file);
  });
}

/**
 * Convierte un base64 data URL a un objeto File
 */
export function base64ToFile(base64Data: string, filename: string): File {
  const arr = base64Data.split(",");
  const mimeMatch = arr[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/webp";
  const bstr = atob(arr[1] ?? "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

// Función pura sin estado
export async function fetchImageAsBlobUrl(url: string): Promise<string> {
  const blob = await getHttp().fetchBlob(url);
  return URL.createObjectURL(blob);
}
