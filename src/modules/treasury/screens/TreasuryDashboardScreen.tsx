import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import TooltipButton from "@/components/common/TooltipButton";
import { formatCurrency } from "@/utils/formaters";
import {
    AlertTriangle,
    ArrowDownCircle,
    ArrowUpCircle,
    Banknote,
    Bell,
    Loader2,
    RefreshCcw,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { TREASURY_QUERY_KEYS } from "@/lib/queryKeys";
import { useBranchStore } from "@/states/branchStore";
import useTreasuryDashboard from "../hooks/useTreasuryDashboard";
import type { TreasuryProjection } from "../types/treasury";

interface ProjectionMiniTableProps {
    label: string;
    proyeccion: TreasuryProjection;
    colorClass: string;
}

const ProjectionMiniTable = ({ label, proyeccion, colorClass }: ProjectionMiniTableProps) => {
    const buckets = [
        { key: "Vencida", value: proyeccion.vencida.total, danger: true },
        { key: "7 días", value: proyeccion.proximos_7_dias.total, danger: false },
        { key: "15 días", value: proyeccion.proximos_15_dias.total, danger: false },
        { key: "30 días", value: proyeccion.proximos_30_dias.total, danger: false },
    ];

    return (
        <div className={`rounded-lg border bg-card p-3 ${colorClass}`}>
            <h3 className="font-semibold text-sm mb-2">{label}</h3>
            <div className="space-y-1">
                {buckets.map((bucket) => (
                    <div key={bucket.key} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{bucket.key}</span>
                        <span
                            className={`font-semibold ${
                                bucket.danger && bucket.value > 0
                                    ? "text-destructive"
                                    : "text-foreground"
                            }`}
                        >
                            {formatCurrency(bucket.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TreasuryDashboardScreen = () => {
    const queryClient = useQueryClient();
    const { selectedBranchId } = useBranchStore();
    const sucursal = selectedBranchId ? Number(selectedBranchId) : undefined;

    const { data, isLoading, isFetching, isError } = useTreasuryDashboard();

    const handleRefresh = () => {
        queryClient.invalidateQueries({
            queryKey: TREASURY_QUERY_KEYS.dashboard(sucursal),
        });
    };

    if (isLoading) {
        return (
            <main className="h-full p-2 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
            </main>
        );
    }

    const posicionNetaNegativa = (data?.posicion_neta ?? 0) < 0;

    return (
        <main className="h-full p-2 gap-3 flex flex-col overflow-auto">
            {/* Header */}
            <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                        Dashboard de Tesorería
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Posición financiera en tiempo real
                        {data?.fecha && (
                            <> · Actualizado: {new Date(data.fecha).toLocaleDateString("es-ES")}</>
                        )}
                    </p>
                </div>
                <TooltipButton
                    onClick={handleRefresh}
                    buttonProps={{ variant: "outline", size: "sm", disabled: isFetching }}
                    tooltip="Actualizar dashboard"
                >
                    <RefreshCcw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
                </TooltipButton>
            </header>

            {isError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm flex-shrink-0">
                    <strong>Error:</strong> No se pudo cargar el dashboard de tesorería
                </div>
            )}

            {data && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 flex-shrink-0">
                        {/* Posición Caja */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Caja Efectivo
                                </span>
                                <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(data.posicion_caja_ef)}
                            </p>
                        </div>

                        {/* CxC Total */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Total CxC
                                </span>
                                <ArrowUpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(data.cxc_total_pendiente)}
                            </p>
                        </div>

                        {/* CxP Total */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Total CxP
                                </span>
                                <ArrowDownCircle className="h-4 w-4 text-destructive" />
                            </div>
                            <p className="text-xl font-bold text-destructive">
                                {formatCurrency(data.cxp_total_pendiente)}
                            </p>
                        </div>

                        {/* Posición Neta */}
                        <div
                            className={`rounded-lg border p-4 shadow-sm ${
                                posicionNetaNegativa
                                    ? "border-destructive/40 bg-destructive/5"
                                    : "border-border bg-card"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Posición Neta
                                </span>
                                {posicionNetaNegativa ? (
                                    <TrendingDown className="h-4 w-4 text-destructive" />
                                ) : (
                                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                )}
                            </div>
                            <p
                                className={`text-xl font-bold ${
                                    posicionNetaNegativa
                                        ? "text-destructive"
                                        : "text-emerald-600 dark:text-emerald-400"
                                }`}
                            >
                                {formatCurrency(data.posicion_neta)}
                            </p>
                            {posicionNetaNegativa && (
                                <div className="flex items-center gap-1 mt-1">
                                    <AlertTriangle className="h-3 w-3 text-destructive" />
                                    <span className="text-xs text-destructive font-medium">
                                        Posición negativa
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contadores de Alertas */}
                    <div className="rounded-lg border border-border bg-card p-4 flex-shrink-0">
                        <div className="flex items-center gap-2 mb-3">
                            <Bell className="h-4 w-4 text-primary" />
                            <h2 className="font-semibold text-sm">Resumen de Alertas</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">CxP Pendientes</span>
                                <Badge variant="warning" className="w-fit">
                                    {data.alertas.cxp_pendientes} alertas
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">CxP Vencidas</span>
                                <Badge variant="danger" className="w-fit">
                                    {data.alertas.cxp_vencidas} vencidas
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">CxC Pendientes</span>
                                <Badge variant="warning" className="w-fit">
                                    {data.alertas.cxc_pendientes} alertas
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">CxC Vencidas</span>
                                <Badge variant="danger" className="w-fit">
                                    {data.alertas.cxc_vencidas} vencidas
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Proyecciones lado a lado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
                        <div>
                            <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <ArrowDownCircle className="h-4 w-4 text-destructive" />
                                Proyección CxP (Por Pagar)
                            </h2>
                            <ProjectionMiniTable
                                label="Cuentas por Pagar"
                                proyeccion={data.proyeccion_cxp}
                                colorClass="border-destructive/20"
                            />
                        </div>
                        <div>
                            <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <ArrowUpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                Proyección CxC (Por Cobrar)
                            </h2>
                            <ProjectionMiniTable
                                label="Cuentas por Cobrar"
                                proyeccion={data.proyeccion_cxc}
                                colorClass="border-blue-200/50"
                            />
                        </div>
                    </div>
                </>
            )}
        </main>
    );
};

export default TreasuryDashboardScreen;
