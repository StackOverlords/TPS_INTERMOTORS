import { useMemo } from "react";
import {
  BaseStackedBarChart,
  type BaseStackedBarData,
  type StackConfig,
} from "@/components/charts/BaseStackedBarChart";

interface AccountReceivableItem {
  nro_venta: string;
  fecha: string;
  cliente: string;
  total: string | number;
  pagos: string | number;
  saldo: string | number;
}

export interface ReceivablesStackedBarProps {
  data: AccountReceivableItem[];
  height?: number | string;
  maxClients?: number;
  isLoading?: boolean;
}

const ReceivablesTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const cobrado = data.cobrado || 0;
    const pendiente = data.pendiente || 0;
    const total = cobrado + pendiente;

    return (
      <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-[180px]">
        <p className="text-foreground font-semibold text-sm mb-2 leading-snug">
          {data.fullName || label}
        </p>
        <div className="space-y-1.5 border-t border-border/40 pt-2">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Cobrado:
            </span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              Bs {cobrado.toLocaleString("es-BO", { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Pendiente:
            </span>
            <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
              Bs{" "}
              {pendiente.toLocaleString("es-BO", { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between gap-4 pt-1.5 border-t border-border/40">
            <span className="text-muted-foreground font-medium">Total:</span>
            <span className="font-bold tabular-nums">
              Bs {total.toLocaleString("es-BO", { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground text-xs">% Cobrado:</span>
            <span className="font-semibold text-xs tabular-nums">
              {total > 0 ? ((cobrado / total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function ReceivablesStackedBar({
  data,
  height = "100%",
  maxClients = 10,
  isLoading = false,
}: ReceivablesStackedBarProps) {
  const { chartData, stacks } = useMemo(() => {
    // Agrupar por cliente
    const byClient: Record<string, { cobrado: number; pendiente: number }> = {};

    for (const item of data) {
      const key = item.cliente;
      if (!byClient[key]) byClient[key] = { cobrado: 0, pendiente: 0 };

      const pagos =
        typeof item.pagos === "string" ? parseFloat(item.pagos) : item.pagos;
      const saldo =
        typeof item.saldo === "string" ? parseFloat(item.saldo) : item.saldo;

      byClient[key].cobrado += pagos;
      byClient[key].pendiente += saldo;
    }

    // Convertir a array y ordenar por total
    const processed: BaseStackedBarData[] = Object.entries(byClient)
      .map(([cliente, vals]) => ({
        name: cliente,
        fullName: cliente,
        cobrado: Math.round(vals.cobrado),
        pendiente: Math.round(vals.pendiente),
      }))
      .sort((a, b) => b.cobrado + b.pendiente - (a.cobrado + a.pendiente))
      .slice(0, maxClients);

    // Configuración de stacks
    const stackConfig: StackConfig[] = [
      {
        dataKey: "cobrado",
        name: "Cobrado",
        color: "hsl(142, 71%, 45%)",
        gradientStart: "rgba(16, 185, 129, 0.9)",
        gradientEnd: "rgba(16, 185, 129, 0.5)",
      },
      {
        dataKey: "pendiente",
        name: "Pendiente",
        color: "hsl(24, 95%, 53%)",
        gradientStart: "rgba(249, 115, 22, 0.9)",
        gradientEnd: "rgba(249, 115, 22, 0.5)",
      },
    ];

    return { chartData: processed, stacks: stackConfig };
  }, [data, maxClients]);

  return (
    <BaseStackedBarChart
      data={chartData}
      stacks={stacks}
      height={height}
      barSize={20}
      customTooltip={ReceivablesTooltip}
      showGrid={true}
      gridOpacity={0.3}
      showLegend={true}
      xAxisAngle={-15}
      xAxisHeight={60}
      maxNameLength={12}
      valueFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
      barRadius={[4, 4, 0, 0]}
      isLoading={isLoading}
    />
  );
}
