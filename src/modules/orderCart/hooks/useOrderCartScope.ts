import { useEffect, useState } from "react";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";

function buildScopeKey(
  userId: string | undefined,
  branchId: string | null,
): string | null {
  if (!userId || !branchId) return null;
  return `u${userId}-b${branchId}`;
}

/**
 * Resuelve el scope (usuario id + sucursal id) del carrito de pedido.
 *
 * Llavear por `id`, no por `name` — a diferencia de `useCartWithUtils`
 * (carrito de ventas), que llavea por `user.name` y por eso homónimos
 * comparten carrito. Acá el hook resuelve el scope INTERNAMENTE: no recibe
 * user/branch por argumentos, así el call site no puede pasarlos mal.
 *
 * Reactivo a `authSDK.onAuthStateChanged` (mismo patrón que
 * `useUserRole.ts` / `useShowTabBar.ts`) para cubrir la ventana de
 * hidratación async del SDK (storage indexedDB): en el primer render
 * `getCurrentUser()` puede devolver `null` aunque haya sesión persistida,
 * y sin esta suscripción el scope quedaría pegado en `null`.
 *
 * `null` cuando no hay usuario o no hay sucursal seleccionada todavía —
 * el consumidor (`useOrderCart`) debe caer a `NULL_ORDER_CART` en ese caso.
 */
export function useOrderCartScope(): string | null {
  const branchId = useBranchStore((state) => state.selectedBranchId);
  const [scopeKey, setScopeKey] = useState<string | null>(() =>
    buildScopeKey(authSDK.getCurrentUser()?.id, branchId),
  );

  useEffect(() => {
    setScopeKey(buildScopeKey(authSDK.getCurrentUser()?.id, branchId));

    const unsubscribe = authSDK.onAuthStateChanged((authState) => {
      setScopeKey(buildScopeKey(authState.user?.id, branchId));
    });

    return () => unsubscribe();
    // branchId es dependencia intencional: al cambiar de sucursal el scope
    // debe re-derivarse aunque no cambie el estado de auth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  return scopeKey;
}
