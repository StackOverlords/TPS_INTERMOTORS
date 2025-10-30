import { useTabStore } from '@/states/tabStore';
import { useLocation } from 'react-router';

/**
 * Hook que retorna true si la tab actual está activa
 * Útil para ejecutar lógica solo cuando la vista está visible
 */
export const useTabActive = (tabPath?: string) => {

    const location = useLocation();
    const pathToCheck = tabPath || location.pathname;

    const isActive = useTabStore(
        state => {
            const currentTab = state.tabs.find(tab => tab.path === pathToCheck);
            return currentTab?.id === state.activeTabId;
        }
    );

    return isActive;
};