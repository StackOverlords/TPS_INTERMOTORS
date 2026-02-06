import { useMemo } from "react";
import {
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  Package,
} from "lucide-react";
import type { StockMinimoItem } from "../types/StockMinimoReport.types";
import {
  BasePieChart,
  type BasePieChartData,
  type PieColorConfig,
  type PieSliceColor,
} from "@/components/charts/Basepiechart";

// ─── Tipos internos ──────────────────────────────────────────────────────────

interface StockCategoryData extends BasePieChartData {
  /** Nombre completo sin truncar */
  fullName: string;
  /** Color resuelto de la categoría */
  color: string;
  /** Ícono de lucide para la leyenda */
  icon: React.ReactNode;
  /** Descripción corta para la leyenda */
  description: string;
  /** Porcentaje pre-calculado (0-100) */
  percentage: number;
}

// ─── Colores fijos por categoría (critico → bajo → normal) ──────────────────

const STOCK_SLICE_COLORS: PieSliceColor[] = [
  {
    color: "#ef4444",
    gradientStart: "rgba(239, 68, 68, 0.95)",
    gradientEnd: "rgba(220, 38, 38, 0.75)",
  },
  {
    color: "#f97316",
    gradientStart: "rgba(249, 115, 22, 0.95)",
    gradientEnd: "rgba(234, 88, 12, 0.75)",
  },
  {
    color: "#22c55e",
    gradientStart: "rgba(34, 197, 94, 0.95)",
    gradientEnd: "rgba(22, 163, 74, 0.75)",
  },
];

const STOCK_COLOR_CONFIG: PieColorConfig = {
  type: "gradient",
  sliceColors: STOCK_SLICE_COLORS,
};

// ─── Tooltip personalizado ───────────────────────────────────────────────────

function StockTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload as StockCategoryData;

  return (
    <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-[180px]">
      {/* Header con ícono + nombre */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="p-1.5 rounded-md"
          style={{ backgroundColor: `${item.color}18` }}
        >
          <div style={{ color: item.color }}>{item.icon}</div>
        </div>
        <span className="font-semibold text-foreground text-sm">
          {item.name}
        </span>
      </div>

      {/* Body */}
      <div className="space-y-1.5 border-t border-border/40 pt-2">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Productos:</span>
          <span className="font-bold tabular-nums">
            {item.value.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Porcentaje:</span>
          <span
            className="font-bold tabular-nums"
            style={{ color: item.color }}
          >
            {item.percentage.toFixed(1)}%
          </span>
        </div>
        <div className="text-muted-foreground/70 italic mt-1">
          {item.description}
        </div>
      </div>
    </div>
  );
}

// ─── Leyenda lateral custom ──────────────────────────────────────────────────
// Se renderiza como `renderItem` de legendConfig → BasePieChart la coloca
// automáticamente en la posición "right".

function StockLegendItem({ item }: { item: StockCategoryData }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/40 transition-colors cursor-default">
      {/* Dot de color */}
      <div
        className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
        style={{ backgroundColor: item.color }}
      />
      {/* Ícono + texto */}
      <div
        className="p-1 rounded-md flex-shrink-0"
        style={{ backgroundColor: `${item.color}12` }}
      >
        <div style={{ color: item.color, display: "flex" }}>{item.icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground truncate">
          {item.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {item.value.toLocaleString()} productos
        </div>
      </div>
      {/* Porcentaje */}
      <div
        className="text-lg font-bold flex-shrink-0"
        style={{ color: item.color }}
      >
        {item.percentage.toFixed(1)}%
      </div>
    </div>
  );
}

// ─── Props del componente ────────────────────────────────────────────────────

export interface StockDistributionChartProps {
  data: StockMinimoItem[];
  /** Altura del gráfico en px. Default 320 */
  height?: number;
  /** Radio exterior. Default 120 */
  outerRadius?: number;
  /** Radio interior (donut). Default 60 */
  innerRadius?: number;
}

// ─── Componente principal ────────────────────────────────────────────────────

export function StockDistributionChart({
  data,
  height = 320,
  outerRadius = 120,
  innerRadius = 60,
}: StockDistributionChartProps) {
  const { chartData, totalItems } = useMemo(() => {
    const critico = data.filter(
      (item) => parseFloat(item.stock_actual) <= 0
    ).length;

    const bajoMinimo = data.filter(
      (item) => item.diferencia < 0 && parseFloat(item.stock_actual) > 0
    ).length;

    const normal = data.filter((item) => item.diferencia >= 0).length;
    const total = data.length;

    const categories: StockCategoryData[] = [
      {
        name: "Stock Crítico",
        fullName: "Stock Crítico",
        value: critico,
        color: STOCK_SLICE_COLORS[0].color,
        icon: <AlertTriangle className="size-4" />,
        description: "Sin stock disponible",
        percentage: total > 0 ? (critico / total) * 100 : 0,
      },
      {
        name: "Bajo Mínimo",
        fullName: "Bajo Mínimo",
        value: bajoMinimo,
        color: STOCK_SLICE_COLORS[1].color,
        icon: <TrendingDown className="size-4" />,
        description: "Por debajo del mínimo requerido",
        percentage: total > 0 ? (bajoMinimo / total) * 100 : 0,
      },
      {
        name: "Normal",
        fullName: "Normal",
        value: normal,
        color: STOCK_SLICE_COLORS[2].color,
        icon: <CheckCircle2 className="size-4" />,
        description: "Niveles de stock normales",
        percentage: total > 0 ? (normal / total) * 100 : 0,
      },
    ].filter((cat) => cat.value > 0); // filtrar categorías sin datos

    return { chartData: categories, totalItems: total };
  }, [data]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full space-y-4 p-2">
      {/* Gráfico + leyenda lateral via BasePieChart */}
      <BasePieChart
        data={chartData}
        dataKey="value"
        colorConfig={STOCK_COLOR_CONFIG}
        height={height}
        outerRadius={outerRadius}
        innerRadius={innerRadius}
        paddingAngle={2}
        customTooltip={StockTooltip}
        valueFormatter={(v) =>
          v.toLocaleString("es-BO", { maximumFractionDigits: 0 })
        }
        labelConfig={{
          show: true,
          minPercentage: 5,
          formatter: (pct) => `${pct.toFixed(0)}%`,
          color: "white",
          fontSize: 14,
          fontWeight: 700,
        }}
        legendConfig={{
          show: true,
          position: "right",
          renderItem: (item) => (
            <StockLegendItem item={item as unknown as StockCategoryData} />
          ),
        }}
        animate={true}
        animationDuration={800}
        emptyText="Sin datos disponibles"
        emptyDescription="No hay productos para mostrar. Ajusta los filtros y presiona 'Buscar' para cargar el reporte."
      />

      {/* Total general — tarjeta inferior */}
      {totalItems > 0 && (
        <div className="flex justify-end">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-1.5">
              <Package className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Total de productos:
              </span>
            </div>
            <span className="text-base font-bold text-primary tabular-nums">
              {totalItems.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
