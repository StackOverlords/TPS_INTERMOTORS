import { Button } from '@/components/atoms/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/atoms/accordion';
import { Label } from '@/components/atoms/label';
import { Switch } from '@/components/atoms/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { useAllRouteConfigs } from '@/hooks/useAllRouteConfigs';
import { useUserViewConfig } from '@/hooks/useRouteViewConfig';
import type { ViewConfiguration, ViewFeaturesConfig, ViewBehaviorsConfig } from '@/config/viewConfigTypes';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';

const ViewSettings = () => {
  const routeConfigs = useAllRouteConfigs();
  const [, setRefreshKey] = useState(0);

  // Agrupar vistas por módulo
  const viewsByModule = routeConfigs.reduce(
    (acc, config) => {
      const module = config.module || 'Sin Módulo';
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(config);
      return acc;
    },
    {} as Record<string, ViewConfiguration[]>
  );

  const handleFeatureToggle = (
    viewId: string,
    featureName: keyof ViewFeaturesConfig
  ) => {
    const { getUserConfig, updateUserConfig } = useUserViewConfig(viewId);
    const userConfig = getUserConfig() || {};
    const currentEnabled = userConfig.features?.[featureName]?.enabled ?? false;

    updateUserConfig({
      features: {
        ...userConfig.features,
        [featureName]: {
          ...userConfig.features?.[featureName],
          enabled: !currentEnabled,
        },
      },
    });

    setRefreshKey(prev => prev + 1); // Force re-render
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

    setRefreshKey(prev => prev + 1);
  };

  const handleResetView = (viewId: string) => {
    const { resetUserConfig } = useUserViewConfig(viewId);
    resetUserConfig();
    setRefreshKey(prev => prev + 1);
  };

  const handleResetAll = () => {
    routeConfigs.forEach(config => {
      if (config.id) {
        const { resetUserConfig } = useUserViewConfig(config.id);
        resetUserConfig();
      }
    });
    setRefreshKey(prev => prev + 1);
  };

  // Helper para obtener el valor actual (route config + user config)
  const getFeatureEnabled = (viewId: string, featureName: keyof ViewFeaturesConfig): boolean => {
    const routeConfig = routeConfigs.find(c => c.id === viewId);
    const { getUserConfig } = useUserViewConfig(viewId);
    const userConfig = getUserConfig();

    // User config tiene prioridad
    if (userConfig?.features?.[featureName]?.enabled !== undefined) {
      return userConfig.features[featureName].enabled;
    }

    // Fallback a route config
    return routeConfig?.features?.[featureName]?.enabled ?? false;
  };

  const getBehaviorValue = (viewId: string, behaviorName: keyof ViewBehaviorsConfig): any => {
    const routeConfig = routeConfigs.find(c => c.id === viewId);
    const { getUserConfig } = useUserViewConfig(viewId);
    const userConfig = getUserConfig();

    // User config tiene prioridad
    if (userConfig?.behaviors?.[behaviorName] !== undefined) {
      return userConfig.behaviors[behaviorName];
    }

    // Fallback a route config
    return routeConfig?.behaviors?.[behaviorName];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Configuración de Vistas</h3>
          <p className="text-sm text-muted-foreground">
            Personaliza la funcionalidad y comportamiento de cada vista. Los cambios se guardan automáticamente.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetAll}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Resetear Todo
        </Button>
      </div>

      <Accordion type="multiple" className="w-full">
        {Object.entries(viewsByModule).map(([moduleName, views]) => (
          <AccordionItem key={moduleName} value={moduleName}>
            <AccordionTrigger className="text-base font-semibold">
              {moduleName}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 pt-4">
                {views.map((view) => {
                  if (!view.id) return null;

                  return (
                    <div key={view.id} className="space-y-4 pb-6 border-b last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{view.name}</h4>
                          <p className="text-sm text-muted-foreground">{view.path}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetView(view.id!)}
                          className="gap-2"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Resetear
                        </Button>
                      </div>

                      {/* Features */}
                      {view.features && Object.keys(view.features).length > 0 && (
                        <div className="space-y-3">
                          <h5 className="text-sm font-medium text-muted-foreground">
                            Funcionalidades
                          </h5>
                          <div className="grid gap-3">
                            {Object.entries(view.features).map(([key, feature]) => {
                              if (!feature) return null;

                              const featureKey = key as keyof ViewFeaturesConfig;
                              const isEnabled = getFeatureEnabled(view.id!, featureKey);

                              return (
                                <div
                                  key={key}
                                  className="flex items-center justify-between space-x-2 rounded-lg border p-3"
                                >
                                  <div className="space-y-0.5">
                                    <Label htmlFor={`${view.id}-${key}`} className="text-sm font-medium">
                                      {feature.label}
                                    </Label>
                                    {feature.description && (
                                      <p className="text-xs text-muted-foreground">
                                        {feature.description}
                                      </p>
                                    )}
                                  </div>
                                  <Switch
                                    id={`${view.id}-${key}`}
                                    checked={isEnabled}
                                    onCheckedChange={() => handleFeatureToggle(view.id!, featureKey)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Behaviors */}
                      {view.behaviors && Object.keys(view.behaviors).length > 0 && (
                        <div className="space-y-3">
                          <h5 className="text-sm font-medium text-muted-foreground">
                            Comportamientos
                          </h5>
                          <div className="grid gap-3">
                            {/* Product Selector Mode */}
                            {view.behaviors.productSelectorMode !== undefined && (
                              <div className="space-y-2 rounded-lg border p-3">
                                <Label className="text-sm font-medium">
                                  Modo de Selector de Productos
                                </Label>
                                <Select
                                  value={getBehaviorValue(view.id!, 'productSelectorMode')}
                                  onValueChange={(value) =>
                                    handleBehaviorChange(view.id!, 'productSelectorMode', value)
                                  }
                                >
                                  <SelectTrigger>
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

                            {/* Open Details In */}
                            {view.behaviors.openDetailsIn !== undefined && (
                              <div className="space-y-2 rounded-lg border p-3">
                                <Label className="text-sm font-medium">Abrir Detalles En</Label>
                                <Select
                                  value={getBehaviorValue(view.id!, 'openDetailsIn')}
                                  onValueChange={(value) =>
                                    handleBehaviorChange(view.id!, 'openDetailsIn', value)
                                  }
                                >
                                  <SelectTrigger>
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

                            {/* Persist Filters */}
                            {view.behaviors.persistFilters !== undefined && (
                              <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <Label className="text-sm font-medium">
                                  Guardar Filtros entre Sesiones
                                </Label>
                                <Switch
                                  checked={getBehaviorValue(view.id!, 'persistFilters')}
                                  onCheckedChange={(checked) =>
                                    handleBehaviorChange(view.id!, 'persistFilters', checked)
                                  }
                                />
                              </div>
                            )}

                            {/* Default Rows Per Page */}
                            {view.behaviors.defaultRowsPerPage !== undefined && (
                              <div className="space-y-2 rounded-lg border p-3">
                                <Label className="text-sm font-medium">
                                  Filas por Página por Defecto
                                </Label>
                                <Select
                                  value={String(getBehaviorValue(view.id!, 'defaultRowsPerPage'))}
                                  onValueChange={(value) =>
                                    handleBehaviorChange(view.id!, 'defaultRowsPerPage', Number(value))
                                  }
                                >
                                  <SelectTrigger>
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

                            {/* Default Search Mode */}
                            {view.behaviors.defaultSearchMode !== undefined && (
                              <div className="space-y-2 rounded-lg border p-3">
                                <Label className="text-sm font-medium">
                                  Modo de Búsqueda por Defecto
                                </Label>
                                <Select
                                  value={getBehaviorValue(view.id!, 'defaultSearchMode')}
                                  onValueChange={(value) =>
                                    handleBehaviorChange(view.id!, 'defaultSearchMode', value)
                                  }
                                >
                                  <SelectTrigger>
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
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default ViewSettings;
