import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import TooltipButton from "@/components/common/TooltipButton";
import { formatCurrency } from "@/utils/formaters";
import { AlertTriangle, ChevronDown, ChevronRight, Loader2, RefreshCcw } from "lucide-react";
import { useState } from "react";
import useCxPProjectionReport from "../hooks/useCxPProjectionReport";
import type { CxPProjectionBucket, CxPListItem } from "../schemas/cxpReport.schema";

interface ProjectionBucketCardProps {
    title: string;
    bucket: CxPProjectionBucket;
    colorClass: string;
    badgeVariant: "danger" | "warning" | "outline" | "secondary";
}

const ProjectionBucketCard = ({
    title,
    bucket,
    colorClass,
    badgeVariant,
}: ProjectionBucketCardProps) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`border rounded-lg bg-card shadow-sm ${colorClass}`}>
            {/* Header card */}
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{title}</h3>
                    <Badge variant={badgeVariant} className="font-bold text-sm">
                        {formatCurrency(bucket.total)}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {bucket.detalle.length} compra{bucket.detalle.length !== 1 ? "s" : ""}
                </p>
            </div>

            {/* Toggle detalle */}
            {bucket.detalle.length > 0 && (
                <>
                    <div className="border-t border-border px-4 py-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs w-full justify-start gap-1 text-muted-foreground"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? (
                                <ChevronDown className="h-3 w-3" />
                            ) : (
                                <ChevronRight className="h-3 w-3" />
                            )}
                            {expanded ? "Ocultar detalle" : "Ver detalle"}
                        </Button>
                    </div>

                    {expanded && (
                        <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
                            {bucket.detalle.map((item: CxPListItem) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0"
                                >
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="font-medium truncate">{item.proveedor.nombre}</span>
                                        <span className="text-muted-foreground">
                                            #{item.nro_compra} · {new Date(item.fecha_in).toLocaleDateString("es-ES")}
                                        </span>
                                        {item.plazo_pago && (
                                            <span className="text-muted-foreground">
                                                Vence: {new Date(item.plazo_pago).toLocaleDateString("es-ES")}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className="font-semibold text-destructive">
                                            {formatCurrency(item.saldo_pendiente)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const CxPProjectionScreen = () => {
    const { data, isLoading, isFetching, isError, refetch } = useCxPProjectionReport();

    if (isLoading) {
        return (
            <main className="h-full p-2 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
            </main>
        );
    }

    return (
        <main className="h-full p-2 gap-2 flex flex-col overflow-auto">
            {/* Header */}
            <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                        Proyección de Vencimientos CxP
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Cuentas por pagar agrupadas por horizonte de vencimiento
                    </p>
                </div>
                <TooltipButton
                    onClick={() => refetch()}
                    buttonProps={{ variant: "outline", size: "sm", disabled: isFetching }}
                    tooltip="Actualizar proyección"
                >
                    <RefreshCcw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
                </TooltipButton>
            </header>

            {isError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm flex-shrink-0">
                    <strong>Error:</strong> No se pudo cargar la proyección
                </div>
            )}

            {data && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <ProjectionBucketCard
                        title="Vencidas"
                        bucket={data.vencidas}
                        colorClass="border-destructive/30"
                        badgeVariant="danger"
                    />
                    <ProjectionBucketCard
                        title="Próximos 7 días"
                        bucket={data.proximos_7_dias}
                        colorClass="border-orange-300/50"
                        badgeVariant="warning"
                    />
                    <ProjectionBucketCard
                        title="Próximos 15 días"
                        bucket={data.proximos_15_dias}
                        colorClass="border-yellow-300/50"
                        badgeVariant="outline"
                    />
                    <ProjectionBucketCard
                        title="Próximos 30 días"
                        bucket={data.proximos_30_dias}
                        colorClass="border-border"
                        badgeVariant="secondary"
                    />
                </div>
            )}

            {data && (
                <div className="p-3 border border-border bg-background rounded-lg flex-shrink-0">
                    <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <span className="font-medium text-muted-foreground">Total Proyectado:</span>
                            <span className="font-bold text-destructive">
                                {formatCurrency(
                                    data.vencidas.total +
                                    data.proximos_7_dias.total +
                                    data.proximos_15_dias.total +
                                    data.proximos_30_dias.total
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default CxPProjectionScreen;
