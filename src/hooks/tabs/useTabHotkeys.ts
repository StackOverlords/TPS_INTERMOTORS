import { useTabActiveRef } from '@/contexts/TabActiveContext';
import { useCallback, useRef } from 'react';
import { useHotkeys as useHotkeysOriginal } from 'react-hotkeys-hook';
import type { Options, Keys } from 'react-hotkeys-hook';

/**
 * `useHotkeys` que solo dispara en la pestaña visible.
 *
 * Las pestañas ocultas ignoran la tecla con `ignoreEventWhen`, que la librería
 * evalúa al pulsar y antes de `preventDefault`/`stopPropagation`: la tecla
 * sigue llegando a la pestaña visible. Antes se usaba `enabled: isTabActive`,
 * que des-registraba y volvía a registrar cada atajo al cambiar de pestaña; el
 * HotkeysProvider guarda los atajos registrados en su estado, así que cada
 * cambio de pestaña re-renderizaba TODOS los componentes con atajos (todas las
 * pantallas y tablas montadas), varias veces.
 */
export const useTabHotkeys = (
    keys: Keys,
    callback: (event: KeyboardEvent) => void,
    options?: Options,
    deps?: any[]
) => {
    const isTabActiveRef = useTabActiveRef();

    const callerIgnoreRef = useRef(options?.ignoreEventWhen);
    callerIgnoreRef.current = options?.ignoreEventWhen;

    // Identidad estable: react-hotkeys-hook compara las opciones y una función
    // nueva en cada render volvería a registrar el atajo.
    const ignoreEventWhen = useCallback(
        (event: KeyboardEvent) =>
            !isTabActiveRef.current || (callerIgnoreRef.current?.(event) ?? false),
        [isTabActiveRef]
    );

    return useHotkeysOriginal(
        keys,
        (event) => {
            if (!isTabActiveRef.current) return;
            callback(event);
        },
        {
            ...options,
            ignoreEventWhen,
            enabled: options?.enabled !== false,
        },
        deps
    );
};
