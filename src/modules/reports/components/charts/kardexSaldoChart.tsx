import { useMemo } from "react";
import { formatCurrency } from "@/utils/formaters";
import {
  BaseAreaChart,
  type BaseAreaData,
  type AreaColorConfig,
} from "@/components/charts/BaseAreaChart";
import type { KardexReportItem } from "../../types/kardexReport.types";

// ─── Tipos de transacción ────────────────────────────────────────────────────

type TipoTransaccion = "C" | "V" | "D" | "SA" | "TI" | "TS";

interface TransactionStyle {
  label: string;
  badgeClass: string;
  dotClass: string;
}

const TRANSACTION_STYLES: Record<TipoTransaccion, TransactionStyle> = {
  C: {
    label: "Compra",
    badgeClass:
      "bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-700",
    dotClass: "bg-emerald-500 dark:bg-emerald-400",
  },
  V: {
    label: "Venta",
    badgeClass:
      "bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-700",
    dotClass: "bg-amber-500 dark:bg-amber-400",
  },
  D: {
    label: "Devolución",
    badgeClass:
      "bg-violet-100 text-violet-700 border border-violet-300 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-700",
    dotClass: "bg-violet-500 dark:bg-violet-400",
  },
  SA: {
    label: "Salida Ajuste",
    badgeClass:
      "bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-600",
    dotClass: "bg-slate-500 dark:bg-slate-400",
  },
  TI: {
    label: "Transferencia In",
    badgeClass:
      "bg-sky-100 text-sky-700 border border-sky-300 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-700",
    dotClass: "bg-sky-500 dark:bg-sky-400",
  },
  TS: {
    label: "Transferencia Out",
    badgeClass:
      "bg-zinc-100 text-zinc-600 border border-zinc-300 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-600",
    dotClass: "bg-zinc-500 dark:bg-zinc-400",
  },
};

const getTransactionStyle = (tipo: string): TransactionStyle =>
  TRANSACTION_STYLES[tipo as TipoTransaccion] ?? {
    label: tipo,
    badgeClass:
      "bg-gray-100 text-gray-600 border border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-600",
    dotClass: "bg-gray-500",
  };

// Tipos que generan movimiento de entrada (aumentan saldo)
const ENTRADA_TIPOS: TipoTransaccion[] = ["C", "TI", "D"];
// Tipos que generan movimiento de salida (disminuyen saldo)
const SALIDA_TIPOS: TipoTransaccion[] = ["V", "SA", "TS", "D"];

// ─── Tipos internos del chart ────────────────────────────────────────────────

interface KardexSaldoData extends BaseAreaData {
  fecha: string;
  tipo_transaccion: string;
  num_transaccion: string;
  proveedor_cliente: string;
  cantidad: number;
  entrada_costo: number;
  entrada_total: number;
  salida_precio: number;
  salida_total: number;
  saldo: number;
}

// ─── Tooltip personalizado ───────────────────────────────────────────────────

const KardexSaldoTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload as KardexSaldoData;
  const tipo = d.tipo_transaccion as TipoTransaccion;
  const style = getTransactionStyle(tipo);

  // Mostrar entrada si el tipo lo implica Y tiene algún valor relevante
  const showEntrada =
    ENTRADA_TIPOS.includes(tipo) &&
    (d.entrada_total > 0 || d.entrada_costo > 0);

  // Mostrar salida si el tipo lo implica Y tiene algún valor relevante
  const showSalida =
    SALIDA_TIPOS.includes(tipo) && (d.salida_total > 0 || d.salida_precio > 0);

  const hasMovimiento = showEntrada || showSalida;

  return (
    <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-72">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.badgeClass}`}
        >
          <span className={`size-1.5 rounded-full ${style.dotClass}`} />
          {style.label}
        </span>
        <span className="font-mono text-muted-foreground">
          {d.num_transaccion}
        </span>
        <span className="ml-auto text-muted-foreground tabular-nums">
          {d.fecha}
        </span>
      </div>

      {/* Proveedor / Cliente */}
      {d.proveedor_cliente && (
        <p className="text-foreground font-medium mb-2 leading-snug">
          {d.proveedor_cliente}
        </p>
      )}

      {/* Cantidad */}
      <div className="flex justify-between gap-4 mb-2">
        <span className="text-muted-foreground">Cantidad:</span>
        <span className="font-semibold tabular-nums">
          {d.cantidad.toLocaleString("es-BO", { maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Movimiento de entrada / salida */}
      {hasMovimiento && (
        <div className="space-y-1 pt-1 border-t border-border/50 mb-2">
          {showEntrada && (
            <>
              {d.entrada_costo > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Costo entrada:</span>
                  <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(d.entrada_costo)}
                  </span>
                </div>
              )}
              {d.entrada_total > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Total entrada:</span>
                  <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(d.entrada_total)}
                  </span>
                </div>
              )}
            </>
          )}

          {showSalida && (
            <>
              {d.salida_precio > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    {tipo === "SA"
                      ? "Costo ajuste:"
                      : tipo === "TS"
                        ? "Costo transferencia:"
                        : "Precio salida:"}
                  </span>
                  <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
                    {formatCurrency(d.salida_precio)}
                  </span>
                </div>
              )}
              {d.salida_total > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    {tipo === "SA"
                      ? "Total ajuste:"
                      : tipo === "TS"
                        ? "Total transferencia:"
                        : "Total salida:"}
                  </span>
                  <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
                    {formatCurrency(d.salida_total)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Saldo */}
      <div className="flex justify-between gap-4 pt-1 border-t border-border/50">
        <span className="text-muted-foreground font-medium">Saldo:</span>
        <span className="font-bold text-sky-600 dark:text-sky-400 tabular-nums">
          {d.saldo.toLocaleString("es-BO", { maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};

// ─── Color config ────────────────────────────────────────────────────────────

const SALDO_COLOR_CONFIG: AreaColorConfig = {
  type: "gradient",
  strokeColor: "hsl(199, 89%, 48%)",
  gradientStart: "hsl(199, 89%, 48%)",
  gradientEnd: "hsl(199, 89%, 48%)",
  gradientStartOpacity: 0.4,
  gradientEndOpacity: 0.02,
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface KardexSaldoChartProps {
  data: KardexReportItem[];
  height?: number | string;
  /** Límite visual controlado desde el padre via chartVisualLimit del hook */
  limit?: number;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function KardexSaldoChart({
  data,
  height = 280,
  limit,
}: KardexSaldoChartProps) {
  const chartData: KardexSaldoData[] = useMemo(() => {
    const slice = limit != null ? data.slice(0, limit) : data;
    return slice.map((item) => ({
      // BaseAreaData
      name: item.fecha,
      value: item.saldo,
      // extras para tooltip
      fecha: item.fecha,
      tipo_transaccion: item.tipo_transaccion,
      num_transaccion: item.num_transaccion,
      proveedor_cliente: item.proveedor_cliente,
      cantidad: item.cantidad,
      entrada_costo: item.entrada_costo,
      entrada_total: item.entrada_total,
      salida_precio: item.salida_precio,
      salida_total: item.salida_total,
      saldo: item.saldo,
    }));
  }, [data, limit]);

  return (
    <BaseAreaChart
      data={chartData}
      colorConfig={SALDO_COLOR_CONFIG}
      dataKey="value"
      nameKey="name"
      height={height}
      seriesLabel="Saldo"
      customTooltip={KardexSaldoTooltip}
      showGrid
      showDots
      dotRadius={4}
      activeDotRadius={6}
      strokeWidth={2.5}
      areaType="monotone"
      margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
      xAxisAngle={-35}
      xAxisHeight={70}
      yAxisTickFormatter={(v) =>
        v.toLocaleString("es-BO", { maximumFractionDigits: 0 })
      }
      emptyMessage="No hay movimientos para mostrar"
    />
  );
}
