/**
 * useRegistryRoutes — Hook React para consumir el RouteRegistry de forma reactiva.
 *
 * Usa useSyncExternalStore (React 18+) sobre el subscribe() del RouteRegistry.
 * Garantías:
 * - Re-renderiza cuando el registry muta (register / unregister / clear).
 * - NO re-renderiza si el contenido no cambió (la caché interna del registry
 *   devuelve la misma referencia de array cuando no hay mutación).
 * - Seguro para Concurrent Mode (useSyncExternalStore es la API correcta para
 *   stores externos en React 18+ / React 19).
 *
 * Por qué useSyncExternalStore y no useState + useEffect:
 *   - useSyncExternalStore evita el "tearing" en Concurrent Mode.
 *   - No introduce un ciclo extra: snapshot se calcula inline y React lo compara
 *     por referencia (Object.is) — si el array es el mismo objeto, no hay re-render.
 *   - Es la API oficial de React para integrar stores externos (zustand, jotai,
 *     y ahora RouteRegistry lo usan así).
 */

import { useSyncExternalStore } from "react";
import type { RouteConfig } from "@tps/plugin-sdk";
import { RouteRegistry } from "@/plugins/core/route-registry";

/**
 * Devuelve el array de rutas registradas en el RouteRegistry,
 * actualizándose reactivamente cuando el registry cambia.
 *
 * La referencia del array es estable mientras no haya mutación —
 * misma referencia = React omite el re-render.
 *
 * @returns RouteConfig[] — Lista plana de rutas de plugins registradas.
 */
export function useRegistryRoutes(): RouteConfig[] {
  return useSyncExternalStore(
    // subscribe: React llama esto para suscribirse; el retorno es el unsubscribe.
    (onStoreChange) => RouteRegistry.subscribe(onStoreChange),
    // getSnapshot: debe devolver la misma referencia si el contenido no cambió.
    // RouteRegistry.getAllRoutes() usa flatCache internamente para garantizarlo.
    () => RouteRegistry.getAllRoutes(),
    // getServerSnapshot: sin SSR en Tauri, usamos el mismo snapshot.
    () => RouteRegistry.getAllRoutes(),
  );
}
