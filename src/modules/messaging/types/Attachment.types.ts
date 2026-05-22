// ─────────────────────────────────────────────────────────────────────────────
// ATTACHMENT
// ─────────────────────────────────────────────────────────────────────────────

export interface Attachment {
  id: number;
  nombre_original: string;
  tipo_mime: string;
  extension: string;
  tamanio: number; // bytes
  es_imagen: boolean;
  url: string;
  url_thumbnail: string | null; // solo cuando es_imagen === true (320×320 JPEG)
  ancho: number | null;
  alto: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD PAYLOAD
// ─────────────────────────────────────────────────────────────────────────────

export interface SendAttachmentPayload {
  file: File;
  /** Caption opcional — equivalente al campo "contenido" */
  caption?: string;
  /** Dimensiones reales de la imagen — reservan espacio en el optimista para evitar layout shift */
  width?: number;
  height?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT-SIDE VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

export const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export const ATTACHMENT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export type AllowedMimeType = (typeof ATTACHMENT_ALLOWED_TYPES)[number];

export function validateAttachment(
  file: File,
): { valid: true } | { valid: false; error: string } {
  if (file.size > ATTACHMENT_MAX_SIZE) {
    return {
      valid: false,
      error: `El archivo supera el límite de 10 MB (${formatFileSize(file.size)})`,
    };
  }
  if (!ATTACHMENT_ALLOWED_TYPES.includes(file.type as AllowedMimeType)) {
    return {
      valid: false,
      error:
        "Tipo de archivo no permitido. Se aceptan imágenes, PDF, Word y Excel.",
    };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}
