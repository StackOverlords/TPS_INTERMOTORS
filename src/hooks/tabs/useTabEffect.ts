import { useEffect } from "react";
import { useTabActive } from "./useTabActive";

/**
 * Similar a useEffect, pero solo ejecuta el efecto cuando la tab está activa
 * Se limpia automáticamente cuando la tab se vuelve inactiva
 */
export const useTabEffect = (
    tabPath: string | undefined,
    effect: () => void | (() => void),
    deps: unknown[] = []
) => {
    const isActive = useTabActive(tabPath);

    useEffect(() => {
        if (isActive) {
            return effect();
        }
    }, [isActive, ...deps]);
};