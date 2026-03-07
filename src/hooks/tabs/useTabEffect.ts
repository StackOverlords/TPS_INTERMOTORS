import { useEffect } from "react";
import { useTabActive } from "./useTabActive";

interface UseTabEffectOptions {
  requireTab?: boolean; // si true, no ejecuta el efecto cuando tabPath es undefined
}
/**
 * Similar a useEffect, pero solo ejecuta el efecto cuando la tab está activa
 * Se limpia automáticamente cuando la tab se vuelve inactiva
 */
export const useTabEffect = (
  tabPath: string | undefined,
  effect: () => void | (() => void),
  deps: unknown[] = [],
  options: UseTabEffectOptions = {},
) => {
  const { requireTab = false } = options;
  const isActive = useTabActive(tabPath);

  useEffect(() => {
    if (requireTab && !tabPath) return;
    if (isActive) {
      return effect();
    }
  }, [isActive, ...deps]);
};
