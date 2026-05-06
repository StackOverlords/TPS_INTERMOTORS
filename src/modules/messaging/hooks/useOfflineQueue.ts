/**
 * useOfflineQueue.ts
 *
 * Observa el estado de conexión. Cuando la app vuelve a estar online,
 * intenta enviar todos los mensajes encolados en orden FIFO.
 *
 * Se monta en el proveedor raíz de mensajería.
 */

import { useCallback, useEffect, useRef } from "react";
import { useOfflineQueueStore } from "../stores/OfflineQueueStore";
import { useChatStore } from "../stores/ChatStore";
import type { OfflineQueueItem } from "../types/Message.types";
import { messageService } from "../service/Message.service";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

export function useOfflineQueue() {
  const isOnline = useOfflineQueueStore((s) => s.isOnline);
  const isSyncing = useOfflineQueueStore((s) => s.isSyncing);
  const queue = useOfflineQueueStore((s) => s.queue);
  const setSyncing = useOfflineQueueStore((s) => s.setSyncing);
  const dequeue = useOfflineQueueStore((s) => s.dequeue);
  const incrementAttempts = useOfflineQueueStore((s) => s.incrementAttempts);
  const removeExpired = useOfflineQueueStore((s) => s.removeExpired);

  const replaceOptimisticMessage = useChatStore(
    (s) => s.replaceOptimisticMessage,
  );
  const markOptimisticAsFailed = useChatStore((s) => s.markOptimisticAsFailed);

  const syncingRef = useRef(false);

  const processItem = useCallback(
    async (item: OfflineQueueItem): Promise<boolean> => {
      try {
        const message = await messageService.send(item.chatId, item.payload);
        replaceOptimisticMessage(item.chatId, item.tempId, message);
        await dequeue(item.tempId);
        return true;
      } catch (err) {
        await incrementAttempts(item.tempId);

        if (item.attempts + 1 >= MAX_ATTEMPTS) {
          markOptimisticAsFailed(item.chatId, item.tempId);
          await dequeue(item.tempId);
          console.error(
            `[OfflineQueue] Message ${item.tempId} exhausted retries. Dropping.`,
          );
        }
        return false;
      }
    },
    [
      dequeue,
      incrementAttempts,
      replaceOptimisticMessage,
      markOptimisticAsFailed,
    ],
  );

  const flushQueue = useCallback(async () => {
    if (syncingRef.current || queue.length === 0) return;
    syncingRef.current = true;
    setSyncing(true);

    // Limpiar items expirados antes de procesar
    await removeExpired();

    // Procesar en orden FIFO
    const currentQueue = useOfflineQueueStore.getState().queue;
    for (const item of currentQueue) {
      const success = await processItem(item);
      if (!success) {
        // Esperar antes del siguiente intento
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }

    syncingRef.current = false;
    setSyncing(false);
  }, [queue.length, setSyncing, removeExpired, processItem]);

  // Trigger de sincronización cuando vuelve la conexión
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      void flushQueue();
    }
  }, [isOnline, queue.length, isSyncing, flushQueue]);

  return {
    pendingCount: queue.length,
    isSyncing,
    flushQueue,
  };
}
