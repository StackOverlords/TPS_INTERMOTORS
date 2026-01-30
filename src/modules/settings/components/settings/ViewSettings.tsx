import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select';
import { Switch } from '@/components/atoms/switch';
import type { ViewBehaviorsConfig, ViewConfiguration, ViewFeaturesConfig } from '@/config/viewConfigTypes';
import { useAllRouteConfigs } from '@/hooks/useAllRouteConfigs';
import { useViewConfig } from '@/hooks/useViewConfig'; // ← CAMBIO PRINCIPAL
import { cn } from '@/lib/utils';
import { ChevronRight, Loader2, RotateCcw, Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

const ViewSettings = () => {
  const routeConfigs = useAllRouteConfigs();
  const [selectedViewId, setSelectedViewId] = useState<string | null>(
    routeConfigs[0]?.id || null
  );
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ NUEVO: Hook unificado de configuración
  const {
    config: viewConfig,
    isLoading: isLoadingConfig,
    isUpdating,
    updateFeature,
    updateBehavior,
    resetConfig,
    resetAllConfigs,
  } = useViewConfig(selectedViewId || '');

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

  const handleFeatureToggle = useCallback(async (
    featureName: keyof ViewFeaturesConfig
  ) => {
    if (!selectedViewId || !viewConfig) return;

    const currentEnabled = viewConfig.features?.[featureName]?.enabled ?? false;
    
    try {
      await updateFeature(featureName, !currentEnabled);
    } catch (error) {
      console.error('Error updating feature:', error);
    }
  }, [selectedViewId, viewConfig, updateFeature]);

  const handleBehaviorChange = useCallback(async (
    behaviorName: keyof ViewBehaviorsConfig,
    value: any
  ) => {
    if (!selectedViewId) return;

    try {
      await updateBehavior(behaviorName, value);
    } catch (error) {
      console.error('Error updating behavior:', error);
    }
  }, [selectedViewId, updateBehavior]);

  const handleResetView = useCallback(async () => {
    if (!selectedViewId) return;

    try {
      await resetConfig();
    } catch (error) {
      console.error('Error resetting config:', error);
    }
  }, [selectedViewId, resetConfig]);

  const handleResetAll = useCallback(async () => {
    try {
      await resetAllConfigs();
    } catch (error) {
      console.error('Error resetting all configs:', error);
    }
  }, [resetAllConfigs]);

  const getFeatureEnabled = useCallback((featureName: keyof ViewFeaturesConfig): boolean => {
    return viewConfig?.features?.[featureName]?.enabled ?? false;
  }, [viewConfig]);

  const getBehaviorValue = useCallback((behaviorName: keyof ViewBehaviorsConfig): any => {
    return viewConfig?.behaviors?.[behaviorName];
  }, [viewConfig]);

  return (
    <div className="flex gap-2 h-full rounded-lg">
      {/* LEFT SIDEBAR */}
      <div className="w-64 flex border border-border flex-col rounded-lg bg-card overflow-hidden shadow-sm">
        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
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
                className="w-full flex items-center gap-1 px-2 py-1 hover:bg-accent rounded text-xs font-medium text-foreground"
              >
                <ChevronRight
                  className={cn(
                    "h-3 w-3 transition-transform",
                    expandedModules.has(moduleName) && "rotate-90"
                  )}
                />
                <span className="flex-1 text-left">{moduleName}</span>
                <span className="text-[10px] text-muted-foreground">{views.length}</span>
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
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-accent text-muted-foreground"
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
            onClick={handleResetAll}
            disabled={isUpdating}
            className="w-full h-7 text-xs gap-1.5"
          >
            <RotateCcw className={cn("h-3 w-3", isUpdating && "animate-spin")} />
            Resetear Todo
          </Button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 border border-border rounded-lg bg-card overflow-hidden flex flex-col">
        {selectedView ? (
          <>
            {/* Header */}
            <div className="p-2 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">{selectedView.name}</h3>
                {viewConfig?._sources && (
                  <p className="text-xs text-muted-foreground">
                    {Object.values(viewConfig._sources.features || {}).some(s => s === 'user') ||
                     Object.values(viewConfig._sources.behaviors || {}).some(s => s === 'user')
                      ? 'Configuración personalizada'
                      : 'Configuración por defecto'}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetView}
                disabled={isUpdating || isLoadingConfig}
                className="h-7 text-xs"
              >
                <RotateCcw className={cn("size-3", isUpdating && "animate-spin")} />
                Resetear
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-2 space-y-2">
              {isLoadingConfig ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Features */}
                  {selectedView.features && Object.keys(selectedView.features).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Funcionalidades
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(selectedView.features).map(([key, feature]) => {
                          if (!feature) return null;
                          const featureKey = key as keyof ViewFeaturesConfig;
                          const isEnabled = getFeatureEnabled(featureKey);
                          const source = viewConfig?._sources?.features?.[key];

                          return (
                            <div
                              key={key}
                              className="flex items-center justify-between p-2 rounded hover:bg-accent transition-colors border border-transparent hover:border-border"
                            >
                              <div className="flex-1 pr-3">
                                <div className="flex items-center gap-2">
                                  <Label
                                    htmlFor={`${selectedView.id}-${key}`}
                                    className="text-sm font-semibold cursor-pointer text-foreground"
                                  >
                                    {feature.label}
                                  </Label>
                                  {source === 'user' && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                                      Personalizado
                                    </span>
                                  )}
                                </div>
                                {feature.description && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {feature.description}
                                  </p>
                                )}
                              </div>
                              <Switch
                                id={`${selectedView.id}-${key}`}
                                checked={isEnabled}
                                disabled={isUpdating}
                                onCheckedChange={() => handleFeatureToggle(featureKey)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Behaviors */}
                  {selectedView.behaviors && Object.keys(selectedView.behaviors).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Comportamientos
                      </h4>
                      <div className="space-y-2">
                        {selectedView.behaviors.productSelectorMode !== undefined && (
                          <div className="space-y-1.5 p-2 border border-border rounded">
                            <Label className="text-xs font-semibold text-foreground">Modo Selector de Productos</Label>
                            <Select
                              value={getBehaviorValue('productSelectorMode')}
                              onValueChange={(value) =>
                                handleBehaviorChange('productSelectorMode', value)
                              }
                              disabled={isUpdating}
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
                          <div className="space-y-1.5 p-2 border border-border rounded">
                            <Label className="text-xs font-semibold text-foreground">Abrir Detalles En</Label>
                            <Select
                              value={getBehaviorValue('openDetailsIn')}
                              onValueChange={(value) =>
                                handleBehaviorChange('openDetailsIn', value)
                              }
                              disabled={isUpdating}
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
                          <div className="flex items-center justify-between p-2 border border-border rounded">
                            <Label className="text-xs font-semibold text-foreground">Guardar Filtros</Label>
                            <Switch
                              checked={getBehaviorValue('persistFilters')}
                              disabled={isUpdating}
                              onCheckedChange={(checked) =>
                                handleBehaviorChange('persistFilters', checked)
                              }
                            />
                          </div>
                        )}

                        {selectedView.behaviors.defaultRowsPerPage !== undefined && (
                          <div className="space-y-1.5 p-2 border border-border rounded">
                            <Label className="text-xs font-semibold text-foreground">Filas por Página</Label>
                            <Select
                              value={String(getBehaviorValue('defaultRowsPerPage'))}
                              onValueChange={(value) =>
                                handleBehaviorChange('defaultRowsPerPage', Number(value))
                              }
                              disabled={isUpdating}
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
                          <div className="space-y-1.5 p-2 border border-border rounded">
                            <Label className="text-xs font-semibold text-foreground">Modo de Búsqueda</Label>
                            <Select
                              value={getBehaviorValue('defaultSearchMode')}
                              onValueChange={(value) =>
                                handleBehaviorChange('defaultSearchMode', value)
                              }
                              disabled={isUpdating}
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
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Selecciona una vista</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSettings;