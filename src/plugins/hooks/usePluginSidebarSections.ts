/**
 * usePluginSidebarSections — Hook reactivo para las secciones del sidebar de plugins.
 *
 * Usa useSyncExternalStore (React 18+/19) sobre el bus `subscribeUI()` del PluginManager.
 * Garantías idénticas al hook useRegistryRoutes (Batch 1):
 * - Re-renderiza SOLO cuando el array de secciones muta (register/deactivate).
 * - NO re-renderiza si el contenido no cambió — getSidebarSections() devuelve la
 *   misma referencia de array entre mutaciones (caché invalidable en plugin-manager).
 * - Seguro para Concurrent Mode (useSyncExternalStore es la API correcta).
 *
 * Decisión de bus: se usa `subscribeUI()` (firma `() => void`) que es el bus
 * aditivo de Fase 3, separado del `subscribe()` tipado con ManagerEvent.
 * Esto es compatible directamente con useSyncExternalStore sin adaptadores.
 */

import { useSyncExternalStore } from "react";
import type { SidebarSection } from "@tps/plugin-sdk";
import { PluginManager } from "@/plugins/plugin-manager";

/**
 * Devuelve el array de secciones del sidebar aportadas por plugins activos,
 * actualizándose reactivamente cuando se registran o desactivan plugins.
 *
 * La referencia del array es estable mientras no haya mutación —
 * misma referencia = React omite el re-render.
 *
 * @returns SidebarSection[] — Lista de secciones de plugins, ordenada por `order`.
 */
export function usePluginSidebarSections(): SidebarSection[] {
  return useSyncExternalStore(
    // subscribe: React llama esto para suscribirse; el retorno es el unsubscribe.
    // subscribeUI() tiene firma () => void — compatible directamente.
    (onStoreChange) => PluginManager.subscribeUI(onStoreChange),
    // getSnapshot: debe devolver la misma referencia si el contenido no cambió.
    // PluginManager.getSidebarSections() usa sidebarSectionsCache internamente.
    () => PluginManager.getSidebarSections(),
    // getServerSnapshot: sin SSR en Tauri, usamos el mismo snapshot.
    () => PluginManager.getSidebarSections(),
  );
}
