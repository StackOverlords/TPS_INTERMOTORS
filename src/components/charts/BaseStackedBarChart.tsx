import type { ReactNode } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { StackedBarChartSkeleton } from "./ChartSkeletons";

export interface BaseStackedBarData {
  name: string;
  [key: string]: any;
}

export interface StackConfig {
  dataKey: string;
  name: string;
  color: string;
  gradientStart?: string;
  gradientEnd?: string;
}

export interface BaseStackedBarChartProps {
  data: BaseStackedBarData[];
  stacks: StackConfig[];
  height?: number | string;
  barSize?: number;
  customTooltip?: (props: any) => ReactNode;
  showGrid?: boolean;
  gridOpacity?: number;
  margin?: {
    top?: number;
    right?: number;
    left?: number;
    bottom?: number;
  };
  showLegend?: boolean;
  xAxisAngle?: number;
  xAxisHeight?: number;
  valueFormatter?: (value: number) => string;
  maxNameLength?: number;
  showBrightness?: boolean;
  brightnessIntensity?: number;
  barRadius?: [number, number, number, number];
  isLoading?: boolean;
}

const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

export function BaseStackedBarChart({
  data,
  stacks,
  height = "100%",
  barSize = 20,
  customTooltip,
  showGrid = true,
  gridOpacity = 0.3,
  margin = { top: 10, right: 10, left: -20, bottom: 0 },
  showLegend = true,
  xAxisAngle = -15,
  xAxisHeight = 60,
  valueFormatter = (value) => value.toLocaleString(),
  maxNameLength = 15,
  showBrightness = false,
  brightnessIntensity = 0.1,
  barRadius = [2, 2, 0, 0],
  isLoading = false,
}: BaseStackedBarChartProps) {
  // Truncar nombres largos
  const chartData = data.map((item) => ({
    ...item,
    displayName: truncateText(item.name, maxNameLength),
  }));

  // Gradientes para cada stack
  const gradientIds = stacks.map((_, idx) => `stack-gradient-${idx}`);

  // Legend personalizada
  const renderLegend = () => (
    <div className="flex items-center justify-center gap-4 text-[9px] text-muted-foreground mt-2">
      {stacks.map((stack, _idx) => (
        <span key={stack.dataKey} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: stack.color }}
          />
          {stack.name}
        </span>
      ))}
    </div>
  );

  if (isLoading) return <StackedBarChartSkeleton bars={6} />;

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        <p>No hay datos para mostrar en el gráfico</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={margin}>
        <defs>
          {stacks.map((stack, idx) => {
            if (stack.gradientStart && stack.gradientEnd) {
              return (
                <linearGradient
                  key={gradientIds[idx]}
                  id={gradientIds[idx]}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={stack.gradientStart}
                    stopOpacity={1}
                  />
                  <stop
                    offset="100%"
                    stopColor={stack.gradientEnd}
                    stopOpacity={0.6}
                  />
                </linearGradient>
              );
            }
            return null;
          })}
        </defs>

        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
            stroke="hsl(var(--border))"
            opacity={gridOpacity}
            strokeWidth={0.6}
          />
        )}

        <XAxis
          dataKey="displayName"
          tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          angle={xAxisAngle}
          textAnchor="end"
          height={xAxisHeight}
          interval={0}
        />

        <YAxis
          tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => valueFormatter(v)}
        />

        <Tooltip
          content={customTooltip || undefined}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.15 }}
        />

        {showLegend && <Legend content={renderLegend} />}

        {stacks.map((stack, idx) => {
          const isLast = idx === stacks.length - 1;
          const fill =
            stack.gradientStart && stack.gradientEnd
              ? `url(#${gradientIds[idx]})`
              : stack.color;

          return (
            <Bar
              key={stack.dataKey}
              dataKey={stack.dataKey}
              name={stack.name}
              stackId="a"
              fill={fill}
              radius={isLast ? barRadius : [0, 0, 0, 0]}
              barSize={barSize}
            >
              {showBrightness &&
                chartData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={fill}
                    style={{
                      filter: `brightness(${1 - (index / chartData.length) * brightnessIntensity})`,
                    }}
                  />
                ))}
            </Bar>
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}
