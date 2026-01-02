import { useTabActive } from '@/contexts/TabActiveContext';
import { useHotkeys as useHotkeysOriginal } from 'react-hotkeys-hook';
import type { Options, Keys } from 'react-hotkeys-hook';

export const useTabHotkeys = (
    keys: Keys,
    callback: (event: KeyboardEvent) => void,
    options?: Options,
    deps?: any[]
) => {
    const { isTabActive } = useTabActive();

    return useHotkeysOriginal(
        keys,
        (event) => {
            if (!isTabActive) return;
            callback(event);
        },
        {
            ...options,
            enabled: isTabActive && (options?.enabled !== false),
        },
        deps
    );
};