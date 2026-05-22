import {
  Bell,
  Package,
  AlertCircle,
  Clock,
  FileText,
  Truck,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Skeleton } from "@/components/atoms/skeleton";
import type { AlertasResponse } from "../../types/dashboard.types";

interface AlertasPanelProps {
  data: AlertasResponse | undefined;
  isLoading: boolean;
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

const BADGE_RED =
  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-red-500/15 text-red-600 dark:text-red-400";
const BADGE_YELLOW =
  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400";
const BADGE_BLUE =
  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400";

function formatBs(value: number): string {
  return value.toLocaleString("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// ── Alert row ─────────────────────────────────────────────────────────────────

interface AlertRowProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

function AlertRow({ icon, label, children }: AlertRowProps) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border/40 last:border-0">
      <div className="shrink-0 mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground leading-none mb-1">
          {label}
        </p>
        <div className="flex flex-wrap items-center gap-1">{children}</div>
      </div>
    </div>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function AlertasSkeleton() {
  return (
    <div className="space-y-0">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-2 py-1.5 border-b border-border/40 last:border-0"
        >
          <Skeleton className="size-4 rounded-full mt-0.5 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-2 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AlertasPanel({ data, isLoading }: AlertasPanelProps) {
  // Determine if all counts are zero (todo en orden)
  const allClear =
    data !== undefined &&
    data.stock_minimo.count_criticos === 0 &&
    data.stock_minimo.count_cercanos === 0 &&
    data.cxp.vencidas_count === 0 &&
    data.cxp.vence_7_dias_total === 0 &&
    data.cxc.vencida_30_dias_count === 0 &&
    data.cotizaciones_sin_convertir.mas_de_7_dias === 0 &&
    data.pedidos_en_transito.count === 0;

  return (
    <Card className="h-full flex flex-col overflow-hidden border-border/40">
      <CardHeader className="flex flex-row items-center justify-between py-2 px-3 pb-0 shrink-0">
        <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
          <Bell className="size-4 text-amber-500" />
          Alertas
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-2.5 pt-2 min-h-0 overflow-y-auto">
        {isLoading || data === undefined ? (
          <AlertasSkeleton />
        ) : allClear ? (
          <div className="h-full flex flex-col items-center justify-center gap-1.5 py-4">
            <CheckCircle2 className="size-6 text-emerald-500" />
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Todo en orden
            </p>
            <p className="text-[10px] text-muted-foreground">
              Sin alertas activas
            </p>
          </div>
        ) : (
          <div>
            {/* 1. Stock mínimo */}
            <AlertRow icon={<Package className="size-3.5" />} label="Stock mínimo">
              {data.stock_minimo.count_criticos > 0 && (
                <span className={BADGE_RED}>
                  {data.stock_minimo.count_criticos} críticos
                </span>
              )}
              {data.stock_minimo.count_cercanos > 0 && (
                <span className={BADGE_YELLOW}>
                  {data.stock_minimo.count_cercanos} cerca del mínimo
                </span>
              )}
              {data.stock_minimo.count_criticos === 0 &&
                data.stock_minimo.count_cercanos === 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    Sin alertas
                  </span>
                )}
            </AlertRow>

            {/* 2. CxP vencidas */}
            <AlertRow
              icon={<AlertCircle className="size-3.5" />}
              label="CxP vencidas"
            >
              {data.cxp.vencidas_count > 0 && (
                <span className={BADGE_RED}>
                  {data.cxp.vencidas_count} vencidas · Bs{" "}
                  {formatBs(data.cxp.vencidas_total)}
                </span>
              )}
              {data.cxp.vence_7_dias_total > 0 && (
                <span className={BADGE_YELLOW}>
                  vence en 7 días: Bs {formatBs(data.cxp.vence_7_dias_total)}
                </span>
              )}
              {data.cxp.vencidas_count === 0 &&
                data.cxp.vence_7_dias_total === 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    Sin alertas
                  </span>
                )}
            </AlertRow>

            {/* 3. CxC aging */}
            <AlertRow icon={<Clock className="size-3.5" />} label="CxC vencida">
              {data.cxc.vencida_60_dias_count > 0 && (
                <span className={BADGE_RED}>
                  {data.cxc.vencida_60_dias_count} cuentas +60d · Bs{" "}
                  {formatBs(data.cxc.vencida_60_dias_total)}
                </span>
              )}
              {data.cxc.vencida_30_dias_count - data.cxc.vencida_60_dias_count >
                0 && (
                <span className={BADGE_YELLOW}>
                  {data.cxc.vencida_30_dias_count -
                    data.cxc.vencida_60_dias_count}{" "}
                  cuentas +30d · Bs{" "}
                  {formatBs(
                    data.cxc.vencida_30_dias_total -
                      data.cxc.vencida_60_dias_total
                  )}
                </span>
              )}
              {data.cxc.vencida_30_dias_count === 0 && (
                <span className="text-[10px] text-muted-foreground">
                  Sin alertas
                </span>
              )}
            </AlertRow>

            {/* 4. Cotizaciones abiertas */}
            <AlertRow
              icon={<FileText className="size-3.5" />}
              label="Cotizaciones abiertas"
            >
              {data.cotizaciones_sin_convertir.mas_de_7_dias > 0 ? (
                <span className={BADGE_YELLOW}>
                  {data.cotizaciones_sin_convertir.mas_de_7_dias} sin cerrar
                  &gt;7d
                  {data.cotizaciones_sin_convertir.mas_de_15_dias > 0 &&
                    ` (${data.cotizaciones_sin_convertir.mas_de_15_dias} >15d)`}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  Sin alertas
                </span>
              )}
            </AlertRow>

            {/* 5. Pedidos en tránsito */}
            <AlertRow
              icon={<Truck className="size-3.5" />}
              label="Pedidos en tránsito"
            >
              {data.pedidos_en_transito.count > 0 ? (
                <>
                  <span className={BADGE_BLUE}>
                    {data.pedidos_en_transito.count} pedido
                    {data.pedidos_en_transito.count !== 1 ? "s" : ""}
                  </span>
                  {data.pedidos_en_transito.items[0] && (
                    <span className="text-[10px] text-muted-foreground truncate">
                      {data.pedidos_en_transito.items[0].proveedor}
                      {data.pedidos_en_transito.items[0].fecha_llegada
                        ? ` · ${data.pedidos_en_transito.items[0].fecha_llegada}`
                        : ""}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  Sin pedidos
                </span>
              )}
            </AlertRow>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
