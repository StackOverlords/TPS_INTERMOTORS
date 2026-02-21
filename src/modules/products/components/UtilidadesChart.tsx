import { useMemo } from "react";
import type { UtilidadesItem } from "../types/UtilidadesReport.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  ChartBar,
} from "lucide-react";
import { formatCurrency } from "@/utils/formaters";
import {
  BaseHorizontalBarChart,
  type BaseChartData,
  type ColorConfig,
} from "@/components/charts/Basehorizontalbarchart";
import {
  themeColorPresets,
  useChartThemeColors,
} from "@/hooks/charts/useChartThemeColors";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
interface UtilidadesChartData extends BaseChartData {
  producto: string;
  codigo: string;
  ventas: number;
  importe_costo: number;
  importe_venta: number;
  utilidad: number;
}

export interface UtilidadesChartProps {
  data: UtilidadesItem[];
  limit?: number;
  /** Mostrar las cards de métricas superiores */
  showStats?: boolean;
}

// ─────────────────────────────────────────────
// Tooltip — glassmorphism (bg semi-transparente + blur)
// ─────────────────────────────────────────────
const UtilidadesToolip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload as UtilidadesChartData;
  const margen = d.importe_venta > 0 ? (d.utilidad / d.importe_venta) * 100 : 0;

  // color según signo — respeta dark/light
  const signClass =
    d.utilidad > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : d.utilidad < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-[260px]">
      {/* producto */}
      <p className="text-foreground font-semibold text-sm mb-2 leading-snug truncate">
        {d.producto}
      </p>

      {/* campos */}
      <div className="space-y-1.5 border-t border-border/50 pt-2">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Código:</span>
          <span className="font-mono font-medium">{d.codigo}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Unidades:</span>
          <span className="font-semibold tabular-nums">
            {d.ventas.toLocaleString("es-BO", { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Costo:</span>
          <span className="font-medium text-red-600 dark:text-red-400 tabular-nums">
            {formatCurrency(d.importe_costo)}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Ingreso:</span>
          <span className="font-medium text-blue-600 dark:text-blue-400 tabular-nums">
            {formatCurrency(d.importe_venta)}
          </span>
        </div>

        {/* utilidad + margen (separados visualmente) */}
        <div className="border-t border-border/50 pt-1.5 mt-1 space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground font-semibold">
              Utilidad:
            </span>
            <span className={`font-bold tabular-nums ${signClass}`}>
              {formatCurrency(d.utilidad)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Margen:</span>
            <span className={`font-semibold tabular-nums ${signClass}`}>
              {margen.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Stats opcionales
// ─────────────────────────────────────────────
function StatsRow({ data }: { data: UtilidadesItem[] }) {
  const stats = useMemo(() => {
    const totalUtilidad = data.reduce(
      (s, i) => s + parseFloat(i.utilidad.toString()),
      0
    );
    const totalIngreso = data.reduce(
      (s, i) => s + parseFloat(i.importe_venta.toString()),
      0
    );
    const margenPromedio =
      totalIngreso > 0 ? (totalUtilidad / totalIngreso) * 100 : 0;
    const rentables = data.filter(
      (i) => parseFloat(i.utilidad.toString()) > 0
    ).length;
    const noRentables = data.length - rentables;

    return { totalUtilidad, margenPromedio, rentables, noRentables };
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-l-4 border-green-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="size-5 text-green-600" />
            <span className="text-sm font-medium text-muted-foreground">
              Utilidad Total
            </span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalUtilidad)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="size-5 text-blue-600" />
            <span className="text-sm font-medium text-muted-foreground">
              Margen Promedio
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.margenPromedio.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-orange-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="size-5 text-orange-600" />
            <span className="text-sm font-medium text-muted-foreground">
              Rentables / No Rentables
            </span>
          </div>
          <div className="text-2xl font-bold">
            <span className="text-green-600">{stats.rentables}</span>
            <span className="text-muted-foreground mx-2">/</span>
            <span className="text-red-600">{stats.noRentables}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export function UtilidadesChart({
  data,
  limit = 20,
  showStats = false,
}: UtilidadesChartProps) {
  // ── mapeo + ordenamiento descendente por utilidad ──
  const chartData: UtilidadesChartData[] = useMemo(() => {
    return [...data]
      .map((item) => ({
        // campos que exige BaseChartData
        name:
          item.producto.length > 30
            ? item.producto.substring(0, 30) + "..."
            : item.producto,
        value: parseFloat(item.utilidad.toString()),

        // campos extras que consume el tooltip
        producto: item.producto,
        codigo: item.codigo,
        ventas: parseFloat(item.ventas.toString()),
        importe_costo: parseFloat(item.importe_costo.toString()),
        importe_venta: parseFloat(item.importe_venta.toString()),
        utilidad: parseFloat(item.utilidad.toString()),
      }))
      .sort((a, b) => b.utilidad - a.utilidad)
      .slice(0, limit);
  }, [data, limit]);

  const themeColors = useChartThemeColors(themeColorPresets["purple"]);

  // Configuración de color final
  const colorConfig: ColorConfig = {
    type: "gradient",
    gradientStart: themeColors.gradientStart,
    gradientEnd: themeColors.gradientEnd,
  };

  // ── título dinámico ──
  const title =
    chartData.length === data.length
      ? `Todos los Productos (${data.length}) – Mayor a Menor`
      : `Top ${Math.min(limit, data.length)} Productos – Mayor a Menor Utilidad`;

  // ── estado vacío ──
  if (data.length === 0) {
    return (
      <Card className="h-full border-none shadow-none">
        <CardContent className="flex flex-col items-center justify-center h-full py-16">
          <Package className="size-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin datos disponibles</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            No hay productos para mostrar. Ajusta los filtros y presiona
            "Buscar" para cargar el reporte.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full space-y-4">
      {showStats && <StatsRow data={data} />}

      <Card className="border-none shadow-none h-full flex flex-col">
        <CardHeader className="flex flex-shrink-0">
          <CardTitle className="text-base flex items-center gap-2">
            <ChartBar className="size-4" />
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="min-h-0 flex-1">
          <BaseHorizontalBarChart
            data={chartData}
            dataKey="value"
            colorConfig={colorConfig}
            limit={chartData.length || limit}
            customTooltip={UtilidadesToolip}
            valueFormatter={(v) =>
              formatCurrency(typeof v === "number" ? v : parseFloat(v))
            }
            showLegend
            legendName="Utilidad (Bs.)"
            labelConfig={{
              formatter: (value) =>
                formatCurrency(
                  typeof value === "number" ? value : parseFloat(value)
                ),
              color: "#10b981",
              fontSize: 13,
              fontWeight: 600,
              offsetX: 12,
              show: chartData.length <= 25, // mostrar solo si hay pocos ítems
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
