import { useTabStore } from '@/states/tabStore';
  import { useLocation } from 'react-router';

  export const useTabActive = (tabPath?: string) => {
      // 🔥 Intentar usar useLocation, si falla retornar true
      let location;
      try {
          location = useLocation();
      } catch (e) {
          // No hay Router, retornar true (tab activa por defecto)
          return true;
      }

      const pathToCheck = tabPath || location.pathname;

      const isActive = useTabStore(
          state => {
              const currentTab = state.tabs.find(tab => tab.path === pathToCheck);
              return currentTab?.id === state.activeTabId;
          }
      );

      return isActive;
  };