import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { viewConfigStore } from '@/stores/viewConfigStore';
import { viewConfigService } from '@/services/viewConfigService';
import { mergeViewConfigs } from '@/lib/viewConfigUtils';
import authSDK from '@/services/sdk-simple-auth';
import { viewConfigs } from '@/view-configs/viewConfigs';
import type {
  MergedViewConfig,
  ViewConfiguration,
  TableState
} from '@/view-configs/viewConfigTypes';

export function useViewConfig(viewId: string) {
  const user = authSDK.getCurrentUser();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Configuración base (código)
  const baseConfig = viewConfigs[viewId];

  // 2. Configuración de organización (backend)
  const {
    data: orgConfig,
    isLoading: isLoadingOrg,
  } = useQuery({
    queryKey: ['view-config', 'organization', viewId],
    queryFn: () => viewConfigService.getOrganizationConfig(viewId),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      // Si es 404, no reintentar (significa que no hay config de org)
      if (error?.response?.status === 404) {
        return false;
      }
      // Si es error de CORS/Network (500 sin headers CORS), no reintentar
      if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
        console.warn(`[useViewConfig] Network error for ${viewId}, usando config local`, error);
        return false;
      }
      // Para otros errores, reintentar hasta 1 vez
      return failureCount < 1;
    },
    throwOnError: (error: any) => {
      // No lanzar error si es 404
      if (error?.response?.status === 404) {
        return false;
      }
      // Si es error de CORS/Network (error 500 sin headers), no lanzar
      // Esto permite que la app funcione solo con config local
      if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
        return false;
      }
      return true;
    },
  });

  // 3. Configuración de usuario (Tauri Store)
  const {
    data: userConfig,
    isLoading: isLoadingUser,
    refetch: refetchUserConfig,
  } = useQuery({
    queryKey: ['view-config', 'user', viewId, user?.name],
    queryFn: async () => {
      if (!user?.name) return null;
      try {
        return await viewConfigStore.getUserConfig(viewId, user.name);
      } catch (error) {
        console.error('Error loading user config:', error);
        return null;
      }
    },
    enabled: !!user?.name,
    // No reintentar errores de Tauri Store
    retry: false,
  });

  // Merge de configuraciones
  const finalConfig: MergedViewConfig = mergeViewConfigs(
    baseConfig,
    orgConfig || undefined,
    userConfig || undefined
  );

  useEffect(() => {
    if (!isLoadingOrg && !isLoadingUser) {
      setIsInitialized(true);
    }
  }, [isLoadingOrg, isLoadingUser]);

  // Mutación para actualizar config de usuario
  const updateConfigMutation = useMutation({
    mutationFn: async (config: Partial<ViewConfiguration>) => {
      if (!user?.name) throw new Error('Usuario no autenticado');

      const currentUserConfig = await viewConfigStore.getUserConfig(viewId, user.name) || {};

      const updatedConfig: Partial<ViewConfiguration> = {
        features: {
          ...currentUserConfig.features,
          ...config.features,
        },
        behaviors: {
          ...currentUserConfig.behaviors,
          ...config.behaviors,
        },
        table: {
          behaviors: {
            ...currentUserConfig.table?.behaviors,
            ...config.table?.behaviors,
          },
          state: {
            ...currentUserConfig.table?.state,
            ...config.table?.state,
          },
        },
      };

      await viewConfigStore.setUserConfig(viewId, user.name, updatedConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['view-config', 'user', viewId, user?.name],
      });
    },
  });

  const updateTableStateMutation = useMutation({
    mutationFn: async (tableState: Partial<TableState> | undefined) => {
      if (!user?.name) throw new Error('Usuario no autenticado');

      if (tableState === undefined) {
        // Resetear completamente
        await viewConfigStore.resetTableState(viewId, user.name);
      } else {
        // Actualizar parcialmente
        await viewConfigStore.updateTableState(viewId, user.name, tableState);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['view-config', 'user', viewId, user?.name],
      });
    },
  });

  // Mutación para resetear config de usuario
  const resetConfigMutation = useMutation({
    mutationFn: async () => {
      if (!user?.name) throw new Error('Usuario no autenticado');
      await viewConfigStore.deleteUserConfig(viewId, user.name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['view-config', 'user', viewId, user?.name],
      });
    },
  });

  // Mutación para resetear TODAS las configs del usuario
  const resetAllConfigsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.name) throw new Error('Usuario no autenticado');
      await viewConfigStore.clearAllUserConfigs(user.name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['view-config', 'user'],
      });
    },
  });

  // Sincronización en tiempo real
  useEffect(() => {
    const handleConfigUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.viewId === viewId || customEvent.detail.action === 'clear-all') {
        refetchUserConfig();
      }
    };

    window.addEventListener('view-config:updated', handleConfigUpdate);

    return () => {
      window.removeEventListener('view-config:updated', handleConfigUpdate);
    };
  }, [viewId, refetchUserConfig]);

  // Helpers para actualizar features y behaviors específicos
  const updateFeature = useCallback(
    (featureName: string, enabled: boolean) => {
      return updateConfigMutation.mutateAsync({
        features: {
          [featureName]: {
            ...finalConfig.features?.[featureName],
            enabled,
          },
        },
      });
    },
    [updateConfigMutation, finalConfig.features]
  );

  const updateBehavior = useCallback(
    (behaviorName: string, value: any) => {
      return updateConfigMutation.mutateAsync({
        behaviors: {
          [behaviorName]: value,
        },
      });
    },
    [updateConfigMutation]
  );

  return {
    config: finalConfig,
    isLoading: !isInitialized,
    isUpdating: updateConfigMutation.isPending || updateTableStateMutation.isPending,

    // Métodos de actualización
    updateConfig: updateConfigMutation.mutateAsync,
    updateFeature,
    updateBehavior,

    updateTableState: updateTableStateMutation.mutateAsync,

    // Métodos de reset
    resetConfig: resetConfigMutation.mutateAsync,
    resetAllConfigs: resetAllConfigsMutation.mutateAsync,

    // Helpers
    isFeatureEnabled: (featureName: string) =>
      finalConfig.features?.[featureName]?.enabled ?? false,
    getBehaviorValue: <T = any>(behaviorName: string): T | undefined =>
      finalConfig.behaviors?.[behaviorName] as T | undefined,
    getTableBehaviorValue: <T = any>(behaviorName: string): T | undefined =>
      finalConfig.table?.behaviors?.[behaviorName as keyof typeof finalConfig.table.behaviors] as T | undefined,
  };
}

// Hook simplificado para casos de solo lectura
export function useViewConfigReadOnly(viewId: string) {
  const { config, isLoading } = useViewConfig(viewId);
  return { config, isLoading };
}