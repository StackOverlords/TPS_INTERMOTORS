import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select';
import { Switch } from '@/components/atoms/switch';
import type { ViewBehaviorsConfig, ViewConfiguration, ViewFeaturesConfig } from '@/config/viewConfigTypes';
import { useAllRouteConfigs } from '@/hooks/useAllRouteConfigs';
import { useUserViewConfig } from '@/hooks/useRouteViewConfig';
import { cn } from '@/lib/utils';
import { ChevronRight, RotateCcw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

const ViewSettings = () => {
  const routeConfigs = useAllRouteConfigs();
  const [selectedViewId, setSelectedViewId] = useState<string | null>(
    routeConfigs[0]?.id || null
  );
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Cache de configuraciones - este es el estado que controla el render
  const [configCache, setConfigCache] = useState<Record<string, any>>({});

  // Agrupar vistas por módulo
  const viewsByModule = useMemo(() => {
    return routeConfigs.reduce((acc, config) => {
      const module = config.module || 'Otros';
      if (!acc[module]) acc[module] = [];
      acc[module].push(config);
      return acc;
    }, {} as Record<string, ViewConfiguration[]>);
  }, [routeConfigs]);

  // Filtrar por búsqueda
  const filteredModules = useMemo(() => {
    if (!searchQuery) return viewsByModule;

    const filtered: Record<string, ViewConfiguration[]> = {};
    Object.entries(viewsByModule).forEach(([module, views]) => {
      const matchingViews = views.filter(v =>
        v.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingViews.length > 0) {
        filtered[module] = matchingViews;
      }
    });
    return filtered;
  }, [viewsByModule, searchQuery]);

  const selectedView = routeConfigs.find(v => v.id === selectedViewId);

  const toggleModule = (moduleName: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      newSet.has(moduleName) ? newSet.delete(moduleName) : newSet.add(moduleName);
      return newSet;
    });
  };

  const handleFeatureToggle = (viewId: string, featureName: keyof ViewFeaturesConfig) => {
    const { getUserConfig, updateUserConfig } = useUserViewConfig(viewId);
    const routeConfig = routeConfigs.find(c => c.id === viewId);
    const userConfig = getUserConfig() || {};

    // Obtener valor actual desde cache o desde config
    const currentEnabled = configCache[`${viewId}-${featureName}`]
      ?? userConfig.features?.[featureName]?.enabled
      ?? routeConfig?.features?.[featureName]?.enabled
      ?? false;

    const newEnabled = !currentEnabled;

    // Actualizar localStorage
    updateUserConfig({
      features: {
        ...userConfig.features,
        [featureName]: {
          ...userConfig.features?.[featureName],
          enabled: newEnabled,
        },
      },
    });

    // Actualizar cache inmediatamente
    setConfigCache(prev => ({
      ...prev,
      [`${viewId}-${featureName}`]: newEnabled
    }));
  };

  const handleBehaviorChange = (
    viewId: string,
    behaviorName: keyof ViewBehaviorsConfig,
    value: any
  ) => {
    const { getUserConfig, updateUserConfig } = useUserViewConfig(viewId);
    const userConfig = getUserConfig() || {};

    updateUserConfig({
      behaviors: {
        ...userConfig.behaviors,
        [behaviorName]: value,
      },
    });

    // Actualizar cache inmediatamente
    setConfigCache(prev => ({
      ...prev,
      [`${viewId}-behavior-${behaviorName}`]: value
    }));
  };

  const handleResetView = (viewId: string) => {
    const { resetUserConfig } = useUserViewConfig(viewId);
    resetUserConfig();

    // Limpiar cache para esta vista
    setConfigCache(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (key.startsWith(`${viewId}-`)) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  };

  const getFeatureEnabled = (viewId: string, featureName: keyof ViewFeaturesConfig): boolean => {
    const cacheKey = `${viewId}-${featureName}`;

    // Si está en cache, usar ese valor
    if (configCache[cacheKey] !== undefined) {
      return configCache[cacheKey];
    }

    // Si no, obtener de configs
    const routeConfig = routeConfigs.find(c => c.id === viewId);
    const { getUserConfig } = useUserViewConfig(viewId);
    const userConfig = getUserConfig();
    return userConfig?.features?.[featureName]?.enabled ?? routeConfig?.features?.[featureName]?.enabled ?? false;
  };

  const getBehaviorValue = (viewId: string, behaviorName: keyof ViewBehaviorsConfig): any => {
    const cacheKey = `${viewId}-behavior-${behaviorName}`;

    // Si está en cache, usar ese valor
    if (configCache[cacheKey] !== undefined) {
      return configCache[cacheKey];
    }

    // Si no, obtener de configs
    const routeConfig = routeConfigs.find(c => c.id === viewId);
    const { getUserConfig } = useUserViewConfig(viewId);
    const userConfig = getUserConfig();
    return userConfig?.behaviors?.[behaviorName] ?? routeConfig?.behaviors?.[behaviorName];
  };

  return (
    <div className="flex gap-3 h-[600px]">
      {/* LEFT SIDEBAR */}
      <div className="w-64 flex border border-gray-200 flex-col rounded-lg bg-white overflow-hidden">
        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Buscar vista..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-auto p-1.5">
          {Object.entries(filteredModules).map(([moduleName, views]) => (
            <div key={moduleName} className="mb-1">
              <button
                onClick={() => toggleModule(moduleName)}
                className="w-full flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-xs font-medium text-gray-700"
              >
                <ChevronRight
                  className={cn(
                    "h-3 w-3 transition-transform",
                    expandedModules.has(moduleName) && "rotate-90"
                  )}
                />
                <span className="flex-1 text-left">{moduleName}</span>
                <span className="text-[10px] text-gray-400">{views.length}</span>
              </button>

              {expandedModules.has(moduleName) && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {views.map((view) => (
                    <button
                      key={view.id}
                      onClick={() => setSelectedViewId(view.id!)}
                      className={cn(
                        "w-full text-left px-2 py-1 rounded text-xs transition-colors",
                        selectedViewId === view.id
                          ? "bg-blue-50 text-blue-500 font-medium"
                          : "hover:bg-gray-50 text-gray-600"
                      )}
                    >
                      {view.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              routeConfigs.forEach(c => c.id && useUserViewConfig(c.id).resetUserConfig());
              setConfigCache({}); // Limpiar todo el cache
            }}
            className="w-full h-7 text-xs gap-1.5"
          >
            <RotateCcw className="h-3 w-3" />
            Resetear Todo
          </Button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 border border-gray-200 rounded-lg bg-white overflow-hidden flex flex-col">
        {selectedView ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">{selectedView.name}</h3>
                <p className="text-xs text-gray-500">{selectedView.path}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleResetView(selectedView.id!)}
                className="h-7 text-xs gap-1.5"
              >
                <RotateCcw className="h-3 w-3" />
                Resetear
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-6">
              {/* Features */}
              {selectedView.features && Object.keys(selectedView.features).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Funcionalidades
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(selectedView.features).map(([key, feature]) => {
                      if (!feature) return null;
                      const featureKey = key as keyof ViewFeaturesConfig;
                      const isEnabled = getFeatureEnabled(selectedView.id!, featureKey);

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 pr-3">
                            <Label htmlFor={`${selectedView.id}-${key}`} className="text-sm font-medium cursor-pointer">
                              {feature.label}
                            </Label>
                            {feature.description && (
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {feature.description}
                              </p>
                            )}
                          </div>
                          <Switch
                            id={`${selectedView.id}-${key}`}
                            checked={isEnabled}
                            onCheckedChange={() => handleFeatureToggle(selectedView.id!, featureKey)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Behaviors */}
              {selectedView.behaviors && Object.keys(selectedView.behaviors).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Comportamientos
                  </h4>
                  <div className="space-y-2">
                    {selectedView.behaviors.productSelectorMode !== undefined && (
                      <div className="space-y-1.5 p-3 rounded">
                        <Label className="text-xs font-medium">Modo Selector de Productos</Label>
                        <Select
                          value={getBehaviorValue(selectedView.id!, 'productSelectorMode')}
                          onValueChange={(value) =>
                            handleBehaviorChange(selectedView.id!, 'productSelectorMode', value)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="embedded">Integrado</SelectItem>
                            <SelectItem value="modal">Modal</SelectItem>
                            <SelectItem value="window">Ventana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedView.behaviors.openDetailsIn !== undefined && (
                      <div className="space-y-1.5 p-3 border border-gray-200 rounded">
                        <Label className="text-xs font-medium">Abrir Detalles En</Label>
                        <Select
                          value={getBehaviorValue(selectedView.id!, 'openDetailsIn')}
                          onValueChange={(value) =>
                            handleBehaviorChange(selectedView.id!, 'openDetailsIn', value)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="same-page">Misma Página</SelectItem>
                            <SelectItem value="new-tab">Nueva Pestaña</SelectItem>
                            <SelectItem value="modal">Modal</SelectItem>
                            <SelectItem value="window">Ventana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedView.behaviors.persistFilters !== undefined && (
                      <div className="flex items-center justify-between py-2 px-3 border border-gray-200 rounded">
                        <Label className="text-xs font-medium">Guardar Filtros</Label>
                        <Switch
                          checked={getBehaviorValue(selectedView.id!, 'persistFilters')}
                          onCheckedChange={(checked) =>
                            handleBehaviorChange(selectedView.id!, 'persistFilters', checked)
                          }
                        />
                      </div>
                    )}

                    {selectedView.behaviors.defaultRowsPerPage !== undefined && (
                      <div className="space-y-1.5 p-3 border border-gray-200 rounded">
                        <Label className="text-xs font-medium">Filas por Página</Label>
                        <Select
                          value={String(getBehaviorValue(selectedView.id!, 'defaultRowsPerPage'))}
                          onValueChange={(value) =>
                            handleBehaviorChange(selectedView.id!, 'defaultRowsPerPage', Number(value))
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedView.behaviors.defaultSearchMode !== undefined && (
                      <div className="space-y-1.5 p-3 border border-gray-200 rounded">
                        <Label className="text-xs font-medium">Modo de Búsqueda</Label>
                        <Select
                          value={getBehaviorValue(selectedView.id!, 'defaultSearchMode')}
                          onValueChange={(value) =>
                            handleBehaviorChange(selectedView.id!, 'defaultSearchMode', value)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realtime">Tiempo Real</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">Selecciona una vista</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSettings;
