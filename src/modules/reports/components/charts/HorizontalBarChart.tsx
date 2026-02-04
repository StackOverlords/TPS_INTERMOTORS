import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ReportItem } from "../../types/report.types";

interface HorizontalBarChartProps {
  data: ReportItem[];
  dataKey: "cantidad" | "total";
  gradientStart?: string;
  gradientEnd?: string;
  color?: string;
  height?: number | string;
  showGradient?: boolean;
  limit?: number;
  useDynamicHeight?: boolean;
  minHeight?: number;
  barHeight?: number;
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

export function HorizontalBarChart({
  data,
  dataKey,
  gradientStart = "rgba(59, 130, 246, 1)",
  gradientEnd = "rgba(59, 130, 246, 0.55)",
  color = "#3b82f6",
  height = "100%",
  showGradient = true,
  limit = 15,
  useDynamicHeight = false,
  minHeight = 300,
  barHeight = 38,
}: HorizontalBarChartProps) {
  const chartData = useMemo(() => {
    return data.slice(0, limit).map((item, index) => ({
      name: truncateText(item.producto),
      fullName: item.producto,
      codigo: item.codigo,
      value: parseFloat(item[dataKey].toString()),
      cantidad: parseFloat(item.cantidad.toString()),
      precio_medio: parseFloat(item.precio_medio.toString()),
      total: parseFloat(item.total.toString()),
      ranking: index + 1,
    }));
  }, [data, dataKey, limit]);

  const dynamicHeight = useDynamicHeight
    ? Math.max(minHeight, chartData.length * barHeight)
    : height;

  const gradientId = `gradient-${dataKey}-${Date.now()}`;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-bold text-foreground">#{data.ranking}</span>
            <span className="font-mono text-muted-foreground">
              {data.codigo}
            </span>
          </div>
          <p className="text-foreground font-medium mb-2 max-w-[240px] leading-snug text-sm">
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
                Bs{" "}
                {data.precio_medio.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold text-green-500 tabular-nums">
                Bs{" "}
                {data.total.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        <p>No hay datos para mostrar en el gráfico</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={dynamicHeight}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={gradientEnd} stopOpacity={0.5} />
            <stop offset="100%" stopColor={gradientStart} stopOpacity={1} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={true}
          vertical={true}
          stroke="hsl(var(--border))"
          opacity={1}
          strokeWidth={0.6}
          syncWithTicks={true}
        />
        <XAxis
          type="number"
          tickFormatter={(value) => formatValue(value, dataKey)}
          fontSize={12}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={{ strokeWidth: 0.5, stroke: "hsl(var(--border))" }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={180}
          fontSize={12}
          tickLine={false}
          axisLine={{ strokeWidth: 0.5, stroke: "hsl(var(--border))" }}
          stroke="hsl(var(--muted-foreground))"
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.8 }}
        />
        <Bar
          dataKey="value"
          radius={[0, 8, 8, 0]}
          fill={showGradient ? `url(#${gradientId})` : color}
          className="drop-shadow-sm"
        >
          {chartData.map((_entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={showGradient ? `url(#${gradientId})` : color}
              style={{
                filter: `brightness(${1 - (index / chartData.length) * 0.15})`,
              }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
