import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/tabs";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useBranchStore } from "@/states/branchStore";
import { Bell } from "lucide-react";
import { AlertList } from "../components/AlertList";
import useMarkAllAlertsRead from "../hooks/mutations/useMarkAllAlertsRead";
import useAlerts from "../hooks/queries/useAlerts";

const AlertsScreen = () => {
    const { selectedBranchId } = useBranchStore();
    const sucursal = selectedBranchId ? Number(selectedBranchId) : 0;

    // Alertas CxP
    const {
        data: cxpAlertsData,
        isLoading: isLoadingCxP,
        isError: isErrorCxP,
    } = useAlerts({ tipo_documento: "CxP", pagina_registros: 100 });

    // Alertas CxC
    const {
        data: cxcAlertsData,
        isLoading: isLoadingCxC,
        isError: isErrorCxC,
    } = useAlerts({ tipo_documento: "CxC", pagina_registros: 100 });

    const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllAlertsRead();

    const cxpAlerts = cxpAlertsData?.data ?? [];
    const cxcAlerts = cxcAlertsData?.data ?? [];

    const handleMarkAllCxP = () => {
        markAllRead(
            { sucursal, tipo_documento: "CxP" },
            {
                onSuccess: () => {
                    showSuccessToast({
                        title: "Alertas CxP marcadas",
                        description: "Todas las alertas de Cuentas por Pagar fueron marcadas como leídas",
                    });
                },
                onError: (error) => {
                    showErrorToast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "Error desconocido",
                    });
                },
            }
        );
    };

    const handleMarkAllCxC = () => {
        markAllRead(
            { sucursal, tipo_documento: "CxC" },
            {
                onSuccess: () => {
                    showSuccessToast({
                        title: "Alertas CxC marcadas",
                        description: "Todas las alertas de Cuentas por Cobrar fueron marcadas como leídas",
                    });
                },
                onError: (error) => {
                    showErrorToast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "Error desconocido",
                    });
                },
            }
        );
    };

    return (
        <main className="h-full p-2 gap-2 flex flex-col">
            {/* Header */}
            <header className="bg-background rounded-lg p-2 border border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-lg font-bold text-primary">Centro de Alertas</h1>
                        <p className="text-sm text-muted-foreground">
                            Alertas de vencimiento de cuentas por pagar y cobrar
                        </p>
                    </div>
                </div>
            </header>

            {/* Tabs CxP / CxC */}
            <div className="flex-1 min-h-0 bg-background rounded-lg border border-border flex flex-col">
                <Tabs defaultValue="cxp" className="flex flex-col h-full">
                    <div className="px-2 pt-2 border-b border-border flex-shrink-0">
                        <TabsList>
                            <TabsTrigger value="cxp" className="gap-2">
                                CxP — Cuentas por Pagar
                                {cxpAlerts.length > 0 && (
                                    <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5">
                                        {cxpAlerts.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="cxc" className="gap-2">
                                CxC — Cuentas por Cobrar
                                {cxcAlerts.length > 0 && (
                                    <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5">
                                        {cxcAlerts.length}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="cxp" className="flex-1 min-h-0 p-2 mt-0">
                        <AlertList
                            alerts={cxpAlerts}
                            isLoading={isLoadingCxP}
                            isError={isErrorCxP}
                            tipo_documento="CxP"
                            onMarkAllRead={handleMarkAllCxP}
                            isMarkingAll={isMarkingAll}
                        />
                    </TabsContent>

                    <TabsContent value="cxc" className="flex-1 min-h-0 p-2 mt-0">
                        <AlertList
                            alerts={cxcAlerts}
                            isLoading={isLoadingCxC}
                            isError={isErrorCxC}
                            tipo_documento="CxC"
                            onMarkAllRead={handleMarkAllCxC}
                            isMarkingAll={isMarkingAll}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
};

export default AlertsScreen;
