import { useMemo } from "react";
import type { ReportItem } from "../../types/report.types";
import {
  BaseScatterChart,
  type BaseScatterData,
  type ColorConfig,
} from "@/components/charts/BaseScatterChart";
import {
  themeColorPresets,
  useChartThemeColors,
} from "@/hooks/charts/useChatThemeColors";
import { formatCurrency } from "@/utils/formaters";
import { Badge } from "@/components/atoms/badge";

interface ProductScatterData extends BaseScatterData {
  fullName: string;
  codigo: string;
  cantidad: number;
  precio_medio: number;
  total: number;
  sucursal: string;
}

export interface SalesScatterChartProps {
  data: ReportItem[];
  colorPreset?: keyof typeof themeColorPresets;
  customColorConfig?: ColorConfig;
  height?: number;
  limit?: number;
}

const ProductTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ProductScatterData;

    return (
      <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-80">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-border/50">
          <Badge variant="outline" className="text-xs">
            {data.sucursal}
          </Badge>
          <span className="font-mono text-muted-foreground">{data.codigo}</span>
        </div>

        {/* Producto */}
        <p className="text-foreground font-medium mb-3 max-w-96 leading-snug text-sm">
          {data.fullName}
        </p>

        {/* Métricas */}
        <div className="space-y-1.5">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Cantidad:</span>
            <span className="font-semibold tabular-nums text-blue-600 dark:text-blue-400">
              {data.cantidad.toLocaleString("es-BO", {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Precio Medio:</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(data.precio_medio)}
            </span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t border-border/50">
            <span className="text-muted-foreground">Total Ventas:</span>
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

export function SalesScatterChart({
  data,
  colorPreset = "blue",
  customColorConfig,
  height = 600,
  limit = 50,
}: SalesScatterChartProps) {
  const themeColors = useChartThemeColors(themeColorPresets[colorPreset]);

  const colorConfig: ColorConfig = customColorConfig || {
    type: "gradient",
    gradientStart: themeColors.gradientStart,
    gradientEnd: themeColors.gradientEnd,
  };

  const chartData: ProductScatterData[] = useMemo(() => {
    return data.map((item) => ({
      x: parseFloat(item.precio_medio.toString()),
      y: parseFloat(item.cantidad.toString()),
      z: parseFloat(item.total.toString()),
      name: item.producto,
      fullName: item.producto,
      codigo: item.codigo,
      cantidad: parseFloat(item.cantidad.toString()),
      precio_medio: parseFloat(item.precio_medio.toString()),
      total: parseFloat(item.total.toString()),
      sucursal: item.sucursal,
    }));
  }, [data]);

  return (
    <BaseScatterChart
      data={chartData}
      colorConfig={colorConfig}
      height={height}
      limit={limit}
      customTooltip={ProductTooltip}
      xAxisLabel="Precio Medio (Bs)"
      yAxisLabel="Cantidad Vendida"
      showLegend={false}
      minPointSize={100}
      maxPointSize={1200}
    />
  );
}
