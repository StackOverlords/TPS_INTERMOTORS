import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { TABS_CONFIG } from "@/config/tabsConfig";
import { MAX_MOUNTED_TABS_LIMIT, MIN_MOUNTED_TABS, useTabsConfigStore } from "@/stores/tabsConfigStore";
import { LayoutDashboard, RotateCcw } from "lucide-react";

const AdvancedSettings = () => {
    const maxMountedTabs = useTabsConfigStore((state) => state.maxMountedTabs);
    const setMaxMountedTabs = useTabsConfigStore((state) => state.setMaxMountedTabs);
    const resetTabsConfig = useTabsConfigStore((state) => state.reset);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5" />
                        Gestión de Pestañas en Memoria
                    </CardTitle>
                    <CardDescription>
                        Controla cuántas pestañas permanecen montadas en memoria simultáneamente.
                        Las pestañas de formularios (compras, ventas, pedidos, etc.) siempre se preservan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5 flex-1">
                            <Label htmlFor="max-mounted-tabs">Pestañas máximas en memoria</Label>
                            <p className="text-sm text-muted-foreground">
                                Rango permitido: {MIN_MOUNTED_TABS}–{MAX_MOUNTED_TABS_LIMIT}. Valor por defecto: {TABS_CONFIG.MAX_MOUNTED_TABS}.
                                Un valor mayor consume más RAM pero reduce recargas al navegar.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                id="max-mounted-tabs"
                                type="number"
                                min={MIN_MOUNTED_TABS}
                                max={MAX_MOUNTED_TABS_LIMIT}
                                value={maxMountedTabs}
                                onChange={(e) => setMaxMountedTabs(Number(e.target.value))}
                                className="w-20 text-center"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={resetTabsConfig}
                                title="Restaurar valor por defecto"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdvancedSettings;
