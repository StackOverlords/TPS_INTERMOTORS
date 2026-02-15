import { useMemo } from "react";
import type { ReportItem } from "../../types/report.types";
import {
  BaseHorizontalBarChart,
  type BaseChartData,
  type ColorConfig,
} from "@/components/charts/Basehorizontalbarchart";
import {
  themeColorPresets,
  useChartThemeColors,
} from "@/hooks/charts/useChartThemeColors";
import { formatCurrency } from "@/utils/formaters";

interface ProductChartData extends BaseChartData {
  fullName: string;
  codigo: string;
  cantidad: number;
  precio_medio: number;
  total: number;
  ranking: number;
}

export interface SaleHorizontalBarChartProps {
  data: ReportItem[];
  dataKey: "cantidad" | "total";
  colorPreset?: keyof typeof themeColorPresets;
  customColorConfig?: ColorConfig;
  height?: number;
  limit?: number;
  maxNameLength?: number;
}

const truncateText = (text: string, maxLength: number = 30): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

const formatValue = (value: number, dataKey: "cantidad" | "total"): string => {
  if (dataKey === "total") {
    return `Bs ${value.toLocaleString("es-BO", { minimumFractionDigits: 2 })}`;
  }
  return value.toLocaleString("es-BO", { maximumFractionDigits: 0 });
};

const ProductTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ProductChartData;
    return (
      <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-80">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-bold text-foreground">#{data.ranking}</span>
          <span className="font-mono text-muted-foreground">{data.codigo}</span>
        </div>
        <p className="text-foreground font-medium mb-2 max-w-96 leading-snug text-sm">
          {data.fullName}
        </p>
        <div className="space-y-1 border-t border-border/50 pt-2">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Cantidad:</span>
            <span className="font-semibold tabular-nums">
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
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Total:</span>
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

export function SaleHorizontalBarChart({
  data,
  dataKey,
  colorPreset = "blue",
  customColorConfig,
  height = 400,
  limit = 15,
  maxNameLength = 30,
}: SaleHorizontalBarChartProps) {
  // Obtener colores según el tema
  const themeColors = useChartThemeColors(themeColorPresets[colorPreset]);

  // Configuración de color final
  const colorConfig: ColorConfig = customColorConfig || {
    type: "gradient",
    gradientStart: themeColors.gradientStart,
    gradientEnd: themeColors.gradientEnd,
  };

  // Transformar datos para el gráfico
  const chartData: ProductChartData[] = useMemo(() => {
    return data.slice(0, limit).map((item, index) => ({
      name: truncateText(item.producto, maxNameLength),
      fullName: item.producto,
      codigo: item.codigo,
      value: parseFloat(item[dataKey].toString()),
      cantidad: parseFloat(item.cantidad.toString()),
      precio_medio: parseFloat(item.precio_medio.toString()),
      total: parseFloat(item.total.toString()),
      ranking: index + 1,
    }));
  }, [data, dataKey, limit, maxNameLength]);

  return (
    <BaseHorizontalBarChart
      data={chartData}
      dataKey="value"
      colorConfig={colorConfig}
      height={height}
      limit={limit}
      customTooltip={ProductTooltip}
      valueFormatter={(value) => formatValue(value, dataKey)}
    />
  );
}
