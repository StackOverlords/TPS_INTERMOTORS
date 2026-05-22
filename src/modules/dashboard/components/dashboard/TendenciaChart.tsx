import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { AreaChartSkeleton } from "@/components/charts/ChartSkeletons";
import type { TrendPoint } from "../../types/dashboard.types";

interface TendenciaChartProps {
  data: TrendPoint[];
  isLoading: boolean;
}

/** Format a YYYY-MM-DD date string to an abbreviated label like "22 May". */
function formatFechaLabel(fecha: string): string {
  const [year, month, day] = fecha.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("es-BO", { day: "numeric", month: "short" });
}

/** Format a monetary value as "Bs 1,234" for the tooltip. */
function formatBs(value: number): string {
  return `Bs ${value.toLocaleString("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

const TendenciaTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    const d = payload[0].payload as TrendPoint;
    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg p-2.5 text-[10px]">
        <p className="font-semibold text-foreground mb-0.5">
          {formatFechaLabel(d.fecha)}
        </p>
        <p className="text-muted-foreground">
          Ventas:{" "}
          <span className="font-bold text-foreground">{formatBs(d.total)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function TendenciaChart({ data, isLoading }: TendenciaChartProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden border-border/40">
      <CardHeader className="flex flex-row items-center justify-between py-2 px-3 pb-0 shrink-0">
        <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
          <TrendingUp className="size-4 text-emerald-500" />
          Tendencia 30 días
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-2.5 pt-1 min-h-0">
        {isLoading ? (
          <AreaChartSkeleton className="h-full w-full" />
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Sin datos</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="emerald-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="rgb(16 185 129)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(16 185 129)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="fecha"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value: string, index: number) => {
                  // Only show every 5th label to avoid crowding over 30 points
                  if (index % 5 !== 0) return "";
                  return formatFechaLabel(value);
                }}
                interval={0}
              />

              <Tooltip
                content={<TendenciaTooltip />}
                cursor={{
                  stroke: "hsl(var(--muted-foreground))",
                  strokeOpacity: 0.3,
                  strokeWidth: 1,
                }}
              />

              <Area
                type="monotone"
                dataKey="total"
                stroke="rgb(16 185 129)"
                strokeWidth={1.5}
                fill="url(#emerald-area-grad)"
                dot={false}
                activeDot={{
                  r: 3,
                  fill: "rgb(16 185 129)",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 1.5,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
