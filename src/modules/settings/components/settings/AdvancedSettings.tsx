import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { TABS_CONFIG } from "@/config/tabsConfig";
import { cn } from "@/lib/utils";
import { MAX_MOUNTED_TABS_LIMIT, MIN_MOUNTED_TABS, useTabsConfigStore } from "@/stores/tabsConfigStore";
import { GalleryHorizontal, LayoutDashboard, RotateCcw, Shrink } from "lucide-react";

const SettingRow = ({
    label,
    description,
    children,
}: {
    label: string;
    description: string;
    children: React.ReactNode;
}) => (
    <div className="flex items-center justify-between gap-6 py-3.5 border-b border-border last:border-0">
        <div className="space-y-0.5 min-w-0">
            <p className="text-sm font-medium leading-none">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            {children}
        </div>
    </div>
);

const AdvancedSettings = () => {
    const maxMountedTabs = useTabsConfigStore((state) => state.maxMountedTabs);
    const setMaxMountedTabs = useTabsConfigStore((state) => state.setMaxMountedTabs);
    const resetTabsConfig = useTabsConfigStore((state) => state.reset);
    const tabOverflowMode = useTabsConfigStore((state) => state.tabOverflowMode);
    const setTabOverflowMode = useTabsConfigStore((state) => state.setTabOverflowMode);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            Pestañas
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={resetTabsConfig}
                            title="Restaurar configuración por defecto"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <SettingRow
                        label="Pestañas máximas en memoria"
                        description={`Cuántas pestañas permanecen montadas. Más pestañas = menos recargas al navegar, pero más uso de RAM. Rango: ${MIN_MOUNTED_TABS}–${MAX_MOUNTED_TABS_LIMIT}.`}
                    >
                        <Input
                            id="max-mounted-tabs"
                            type="number"
                            min={MIN_MOUNTED_TABS}
                            max={MAX_MOUNTED_TABS_LIMIT}
                            value={maxMountedTabs}
                            onChange={(e) => setMaxMountedTabs(Number(e.target.value))}
                            className="w-16 text-center h-8 text-sm"
                        />
                    </SettingRow>

                    <SettingRow
                        label="Comportamiento al acumularse"
                        description="Comprimir: las pestañas se achican y truncan el título. Scroll: mantienen su ancho y se hace scroll horizontal."
                    >
                        <div className="flex rounded-md border border-border overflow-hidden">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTabOverflowMode('compress')}
                                className={cn(
                                    "rounded-none h-8 px-3 gap-1.5 border-r border-border text-xs",
                                    tabOverflowMode === 'compress' && "bg-primary text-primary-foreground"
                                )}
                            >
                                <Shrink className="h-3.5 w-3.5" />
                                Comprimir
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTabOverflowMode('scroll')}
                                className={cn(
                                    "rounded-none h-8 px-3 gap-1.5 text-xs",
                                    tabOverflowMode === 'scroll' && "bg-primary text-primary-foreground"
                                )}
                            >
                                <GalleryHorizontal className="h-3.5 w-3.5" />
                                Scroll
                            </Button>
                        </div>
                    </SettingRow>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdvancedSettings;
