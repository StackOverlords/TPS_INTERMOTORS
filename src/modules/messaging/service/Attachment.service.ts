/**
 * Sube archivos adjuntos a un chat.
 * Usa XMLHttpRequest directamente (no axios) para tener acceso real al
 * evento de progreso de subida — axios.onUploadProgress también funciona
 * pero XHR es más predecible en Tauri WebView.
 *
 * Endpoint: POST /messaging/chats/{chatId}/attachments
 * Content-Type: multipart/form-data
 */
import authSDK from "@/services/sdk-simple-auth";
import { environment } from "@/utils/environment";
import type { SendAttachmentPayload } from "../types/Attachment.types";
import type { Message } from "../types/Message.types";
import { messageSchema } from "../schemas/Message.schema";

const MODULE = "ATTACHMENT_SERVICE";

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  /** AbortSignal para cancelar la subida */
  signal?: AbortSignal;
}

export const attachmentService = {
  /**
   * Sube un archivo adjunto al chat indicado.
   * Llama a onProgress(0..100) durante la subida.
   * Retorna el MessageResource completo con adjuntos[] cuando el servidor confirma.
   */
  async upload(
    chatId: number,
    payload: SendAttachmentPayload,
    options: UploadOptions = {},
  ): Promise<Message> {
    const token = await authSDK.getAccessToken();
    const url = `${environment.apiUrl}/messaging/chats/${chatId}/attachments`;

    const form = new FormData();
    form.append("archivo", payload.file);
    if (payload.caption?.trim()) {
      form.append("contenido", payload.caption.trim());
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);

      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      // NO poner Content-Type manualmente — el browser lo pone con el boundary

      // Cancelación via AbortSignal
      options.signal?.addEventListener("abort", () => {
        xhr.abort();
        reject(new DOMException("Upload aborted", "AbortError"));
      });

      // Progreso real de subida
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && options.onProgress) {
          options.onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 201 || xhr.status === 200) {
          try {
            const raw = JSON.parse(xhr.responseText);
            // El backend puede envolver en { data: ... } o devolver el mensaje directo
            const payload = raw.data ?? raw;
            const parsed = messageSchema.safeParse(payload);
            if (parsed.success) {
              resolve(parsed.data);
            } else {
              console.error(
                `[${MODULE}] Schema validation failed`,
                parsed.error,
              );
              reject(new Error("Respuesta inválida del servidor"));
            }
          } catch {
            reject(new Error("Error al parsear respuesta del servidor"));
          }
        } else if (xhr.status === 422) {
          // Error de validación backend
          try {
            const body = JSON.parse(xhr.responseText);
            const msg =
              body?.message ?? body?.error?.message ?? "Archivo no válido";
            reject(new Error(msg));
          } catch {
            reject(new Error("El archivo no es válido según el servidor"));
          }
        } else if (xhr.status === 403) {
          reject(
            new Error("No tienes permiso para enviar archivos en este chat"),
          );
        } else {
          reject(new Error(`Error del servidor: ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Error de red al subir el archivo"));
      });

      xhr.addEventListener("timeout", () => {
        reject(new Error("Tiempo de espera agotado"));
      });

      xhr.timeout = 120_000; // 2 minutos para archivos grandes

      xhr.send(form);
    });
  },
};
