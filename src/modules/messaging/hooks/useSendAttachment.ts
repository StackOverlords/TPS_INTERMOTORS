/**
 * Hook para subir archivos al chat con:
 *  - Validación cliente antes de subir
 *  - Mensaje optimista inmediato con preview local (para imágenes)
 *  - Barra de progreso real via XHR
 *  - Reemplazo con mensaje real al confirmar el servidor
 *  - Manejo de error con estado 'failed'
 *  - Limpieza de objectURL para evitar memory leaks
 */
import { useCallback, useRef } from "react";
import { nanoid } from "nanoid";
import { useChatStore } from "../stores/ChatStore";
import {
  isImageMime,
  validateAttachment,
  type SendAttachmentPayload,
} from "../types/Attachment.types";
import type { OptimisticMessage } from "../types/Message.types";
import { attachmentService } from "../service/Attachment.service";
import { soundManager } from "../utils/soundManager";

export function useSendAttachment(chatId: number) {
  const appendMessage = useChatStore((s) => s.appendMessage);
  const replaceOptimistic = useChatStore((s) => s.replaceOptimisticMessage);
  const markFailed = useChatStore((s) => s.markOptimisticAsFailed);
  const updateProgress = useChatStore((s) => s.updateOptimisticProgress);

  // Mapa de tempId → abortController para poder cancelar subidas en curso
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const send = useCallback(
    async (payload: SendAttachmentPayload): Promise<void> => {
      // ── 1. Validación cliente ────────────────────────────────────────────────
      const validation = validateAttachment(payload.file);
      if (!validation.valid) {
        // Lanzar error para que el componente lo muestre en la UI
        throw new Error(validation.error);
      }

      const tempId = nanoid();
      const isImage = isImageMime(payload.file.type);

      // ── 2. Preview local para imágenes ──────────────────────────────────────
      const localPreviewUrl = isImage
        ? URL.createObjectURL(payload.file)
        : undefined;

      // ── 3. Mensaje optimista ────────────────────────────────────────────────
      const optimistic: OptimisticMessage = {
        id: -Date.now(),
        chat_id: chatId,
        tipo: "FILE",
        tipo_label: "Archivo",
        contenido: payload.caption ?? "",
        referencia_tipo: null,
        referencia_id: null,
        remitente: null,
        es_sistema: false,
        editado: false,
        fecha_editado: null,
        fecha_reg: new Date().toISOString(),
        adjuntos: isImage
          ? [
              {
                id: -1,
                nombre_original: payload.file.name,
                tipo_mime: payload.file.type,
                extension: payload.file.name.split(".").pop() ?? "",
                tamanio: payload.file.size,
                es_imagen: true,
                url: localPreviewUrl ?? "",
                url_thumbnail: localPreviewUrl ?? null,
              },
            ]
          : [
              {
                id: -1,
                nombre_original: payload.file.name,
                tipo_mime: payload.file.type,
                extension: payload.file.name.split(".").pop() ?? "",
                tamanio: payload.file.size,
                es_imagen: false,
                url: "",
                url_thumbnail: null,
              },
            ],
        _tempId: tempId,
        _status: "uploading",
        _progress: 0,
        _localPreviewUrl: localPreviewUrl,
      };

      appendMessage(chatId, optimistic);

      // ── 4. AbortController para cancelación ─────────────────────────────────
      const abortController = new AbortController();
      abortControllers.current.set(tempId, abortController);

      try {
        const message = await attachmentService.upload(chatId, payload, {
          signal: abortController.signal,
          onProgress: (percent) => updateProgress(chatId, tempId, percent),
        });

        // ── 6. Reemplazar optimista con mensaje real ─────────────────────────
        // Limpiar objectURL antes de reemplazar (ya no necesitamos el blob local)
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        replaceOptimistic(chatId, tempId, message);
        soundManager.play("sent");
      } catch (error) {
        if ((error as Error).name === "AbortError") return; // cancelado intencionalmente

        // Limpiar objectURL en error también
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        markFailed(chatId, tempId);
        // Re-lanzar para que el componente pueda mostrar el error
        throw error;
      } finally {
        abortControllers.current.delete(tempId);
      }
    },
    [chatId, appendMessage, replaceOptimistic, markFailed, updateProgress],
  );

  /**
   * Cancela una subida en curso por tempId.
   * El mensaje optimista quedará en estado 'failed'.
   */
  const cancel = useCallback((tempId: string) => {
    abortControllers.current.get(tempId)?.abort();
  }, []);

  return { send, cancel };
}
