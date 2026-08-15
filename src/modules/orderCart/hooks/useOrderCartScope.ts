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
 * Puede recibir una sucursal explícita para ligar un borrador al carrito de
 * su sucursal original aunque la selección global cambie. Sin override usa
 * la sucursal global. `null` cuando usuario o sucursal aún no están listos.
 */
export function useOrderCartScope(branchIdOverride?: number): string | null {
  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);
  const branchId =
    branchIdOverride === undefined
      ? selectedBranchId
      : branchIdOverride.toString();
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
  }, [branchId]);

  return scopeKey;
}
