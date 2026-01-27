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
  color?: string;
  height?: number;
  showGradient?: boolean;
  limit?: number;
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
  color = "#3b82f6",
  height = 400,
  showGradient = false,
  limit = 15,
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

  const getColor = (index: number) => {
    if (!showGradient) return color;
    const opacity = 1 - (index / chartData.length) * 0.5;
    return color.replace(")", `, ${opacity})`).replace("rgb", "rgba");
  };

  const dynamicHeight = Math.max(height, chartData.length * 40);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold text-foreground mb-1">
            #{data.ranking} - {data.codigo}
          </p>
          <p className="text-muted-foreground mb-2 max-w-[250px]">
            {data.fullName}
          </p>
          <div className="space-y-1">
            <p>
              Cantidad:{" "}
              <span className="font-medium">
                {data.cantidad.toLocaleString("es-BO", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </p>
            <p>
              Precio Medio:{" "}
              <span className="font-medium">
                Bs{" "}
                {data.precio_medio.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </p>
            <p>
              Total:{" "}
              <span className="font-medium text-green-600">
                Bs{" "}
                {data.total.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </p>
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
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={true}
          vertical={false}
        />
        <XAxis
          type="number"
          tickFormatter={(value) => formatValue(value, dataKey)}
          fontSize={11}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={180}
          fontSize={11}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
