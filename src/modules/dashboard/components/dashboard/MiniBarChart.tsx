import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SalesReportItem {
  sucursal: string;
  codigo: string;
  producto: string;
  cantidad: number;
  precio_medio: number;
  subtotal: number;
  subtotal_descuento: number;
  total: number;
}

interface MiniBarChartProps {
  data: SalesReportItem[];
  dataKey: "cantidad" | "total";
  color: string;
  limit?: number;
}

const truncate = (text: string, max: number = 14): string =>
  text.length > max ? text.substring(0, max) + "…" : text;

const formatVal = (value: number, key: "cantidad" | "total"): string => {
  if (key === "total")
    return `Bs ${value.toLocaleString("es-BO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  return value.toLocaleString("es-BO", { maximumFractionDigits: 0 });
};

export function MiniBarChart({
  data,
  dataKey,
  color,
  limit = 5,
}: MiniBarChartProps) {
  const chartData = useMemo(() => {
    return data.slice(0, limit).map((item, i) => ({
      name: truncate(item.producto),
      fullName: item.producto,
      value: Number(item[dataKey]),
      ranking: i + 1,
    }));
  }, [data, dataKey, limit]);

  const gradientId = `mini-grad-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.[0]) {
      const d = payload[0].payload;
      return (
        <div className="bg-popover/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg p-2.5 text-[10px]">
          <p className="font-semibold text-foreground mb-0.5">{d.fullName}</p>
          <p className="text-muted-foreground">
            {dataKey === "total" ? "Ingreso" : "Cantidad"}:{" "}
            <span className="font-bold text-foreground">
              {formatVal(d.value, dataKey)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
        </defs>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.15 }}
        />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          fill={`url(#${gradientId})`}
          barSize={12}
        >
          {chartData.map((_, i) => (
            <Cell
              key={i}
              fill={`url(#${gradientId})`}
              style={{
                filter: `brightness(${1 - (i / chartData.length) * 0.1})`,
              }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
