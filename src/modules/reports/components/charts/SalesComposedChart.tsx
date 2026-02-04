// components/charts/SalesComposedChart.tsx
import { useMemo } from "react";
import type { ReportItem } from "../../types/report.types";
import {
  BaseComposedChart,
  type BaseComposedData,
  type ColorConfig,
} from "@/components/charts/BaseComposedChart";
import {
  themeColorPresets,
  useChartThemeColors,
} from "@/hooks/charts/useChatThemeColors";
import { formatCurrency } from "@/utils/formaters";
import { Badge } from "@/components/atoms/badge";

interface ProductComposedData extends BaseComposedData {
  fullName: string;
  codigo: string;
  cantidad: number;
  precio_medio: number;
  subtotal: number;
  descuento: number;
  total: number;
  sucursal: string;
}

export interface SalesComposedChartProps {
  data: ReportItem[];
  colorPreset?: keyof typeof themeColorPresets;
  customColorConfig?: ColorConfig;
  height?: number;
  limit?: number;
  maxNameLength?: number;
}

const ProductTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ProductComposedData;

    return (
      <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-80">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-border/50">
          <Badge variant="outline" className="text-xs">
            {data.sucursal}
          </Badge>
          <span className="font-mono text-muted-foreground text-xs">
            {data.codigo}
          </span>
        </div>

        {/* Producto */}
        <p className="text-foreground font-medium mb-3 max-w-96 leading-snug text-sm">
          {data.fullName}
        </p>

        {/* Métricas principales - Destacadas */}
        <div className="space-y-2 mb-2">
          <div className="flex justify-between gap-4 bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
            <span className="text-muted-foreground font-medium">
              Cantidad Vendida:
            </span>
            <span className="font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {data.cantidad.toLocaleString("es-BO", {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          <div className="flex justify-between gap-4 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
            <span className="text-muted-foreground font-medium">
              Precio Medio:
            </span>
            <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {formatCurrency(data.precio_medio)}
            </span>
          </div>
        </div>

        {/* Métricas adicionales */}
        <div className="space-y-1 pt-2 border-t border-border/50">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(data.subtotal)}
            </span>
          </div>
          {data.descuento > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Descuento:</span>
              <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
                -{formatCurrency(data.descuento)}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-4 pt-1 border-t border-border/50">
            <span className="text-muted-foreground font-medium">Total:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(data.total)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function SalesComposedChart({
  data,
  colorPreset = "blue",
  customColorConfig,
  height = 600,
  limit = 15,
  maxNameLength = 35,
}: SalesComposedChartProps) {
  const themeColors = useChartThemeColors(themeColorPresets[colorPreset]);

  const colorConfig: ColorConfig = customColorConfig || {
    type: "gradient",
    barGradientStart: themeColors.gradientStart,
    barGradientEnd: themeColors.gradientEnd,
    lineColor: "#f59e0b", // amber-500 para el precio
  };

  const chartData: ProductComposedData[] = useMemo(() => {
    return data.slice(0, limit).map((item) => ({
      name: item.producto,
      barValue: parseFloat(item.cantidad.toString()),
      lineValue: parseFloat(item.precio_medio.toString()),
      fullName: item.producto,
      codigo: item.codigo,
      cantidad: parseFloat(item.cantidad.toString()),
      precio_medio: parseFloat(item.precio_medio.toString()),
      subtotal: parseFloat(item.subtotal.toString()),
      descuento: parseFloat(item.subtotal_descuento.toString()),
      total: parseFloat(item.total.toString()),
      sucursal: item.sucursal,
    }));
  }, [data, limit]);

  return (
    <BaseComposedChart
      data={chartData}
      colorConfig={colorConfig}
      height={height}
      limit={limit}
      customTooltip={ProductTooltip}
      barLabel="Cantidad Vendida"
      lineLabel="Precio Medio (Bs)"
      maxNameLength={maxNameLength}
      barValueFormatter={(value) =>
        value.toLocaleString("es-BO", { maximumFractionDigits: 0 })
      }
      lineValueFormatter={(value) => formatCurrency(value)}
      showLegend={true}
    />
  );
}
