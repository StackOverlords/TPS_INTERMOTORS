import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/utils/formaters";
import {
  ChartError,
  DonutChartSkeleton,
} from "@/components/charts/ChartSkeletons";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReceivablesDonutChartProps {
  topDeudores: { cliente: string; saldo: number }[];
  totalDeuda: number;
  isLoading?: boolean;
  isError?: boolean;
}

// ─── Paleta con gradientes ────────────────────────────────────────────────────

const SLICE_COLORS = [
  {
    color: "hsl(217, 91%, 60%)",
    start: "hsla(217,91%,60%,0.9)",
    end: "hsla(217,91%,60%,0.4)",
  },
  {
    color: "hsl(271, 91%, 65%)",
    start: "hsla(271,91%,65%,0.9)",
    end: "hsla(271,91%,65%,0.4)",
  },
  {
    color: "hsl(142, 71%, 45%)",
    start: "hsla(142,71%,45%,0.9)",
    end: "hsla(142,71%,45%,0.4)",
  },
  {
    color: "hsl(24, 95%, 53%)",
    start: "hsla(24,95%,53%,0.9)",
    end: "hsla(24,95%,53%,0.4)",
  },
  {
    color: "hsl(330, 81%, 60%)",
    start: "hsla(330,81%,60%,0.9)",
    end: "hsla(330,81%,60%,0.4)",
  },
  {
    color: "hsl(187, 85%, 53%)",
    start: "hsla(187,85%,53%,0.9)",
    end: "hsla(187,85%,53%,0.4)",
  },
];

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function DebtTooltip({ active, payload, totalDeuda }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const pct = totalDeuda > 0 ? ((d.value / totalDeuda) * 100).toFixed(1) : "0";

  return (
    <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-2.5 text-[10px] min-w-40">
      <p className="font-semibold text-foreground text-xs mb-1.5 leading-snug">
        {d.name}
      </p>
      <div className="space-y-1 border-t border-border/40 pt-1.5">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Saldo:</span>
          <span className="font-bold tabular-nums">
            {formatCurrency(d.value)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Participación:</span>
          <span className="font-bold tabular-nums">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ReceivablesDonutChart({
  topDeudores,
  totalDeuda,
  isLoading = false,
  isError = false,
}: ReceivablesDonutChartProps) {
  // IDs únicos por instancia para los gradientes
  const instanceId = useMemo(() => Math.random().toString(36).substr(2, 9), []);

  const chartData = useMemo(() => {
    const top5 = topDeudores.slice(0, 5);
    const otherSum = topDeudores.slice(5).reduce((s, d) => s + d.saldo, 0);
    const result = top5.map((d) => ({ name: d.cliente, value: d.saldo }));
    if (otherSum > 0) result.push({ name: "Otros", value: otherSum });
    return result;
  }, [topDeudores]);

  if (isLoading) return <DonutChartSkeleton legendItems={5} />;
  if (isError)
    return <ChartError message="No se pudo cargar la distribución de deuda" />;

  return (
    <div className="flex flex-col h-full gap-1.5 min-h-0">
      {/* Gráfico con texto central superpuesto */}
      <div className="relative flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {SLICE_COLORS.map((sc, i) => (
                <linearGradient
                  key={`${instanceId}-grad-${i}`}
                  id={`${instanceId}-grad-${i}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor={sc.start} stopOpacity={1} />
                  <stop offset="100%" stopColor={sc.end} stopOpacity={1} />
                </linearGradient>
              ))}
            </defs>

            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="42%"
              outerRadius="78%"
              paddingAngle={3}
              dataKey="value"
              stroke="hsl(var(--border))"
              strokeWidth={1}
              isAnimationActive
              animationBegin={0}
              animationDuration={500}
            >
              {chartData.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={`url(#${instanceId}-grad-${i % SLICE_COLORS.length})`}
                />
              ))}
            </Pie>

            <Tooltip
              content={(props) => (
                <DebtTooltip {...props} totalDeuda={totalDeuda} />
              )}
              cursor={false}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Texto central — absolutamente centrado sobre el SVG */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-[9px] text-muted-foreground leading-tight">
              Total
            </p>
            <p className="text-xs font-bold leading-tight tabular-nums">
              {formatCurrency(totalDeuda)}
            </p>
          </div>
        </div>
      </div>

      {/* Leyenda manual fuera del SVG — no compite con el gráfico */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-1 flex-shrink-0">
        {chartData.map((item, i) => {
          const pct =
            totalDeuda > 0 ? ((item.value / totalDeuda) * 100).toFixed(0) : "0";
          const color = SLICE_COLORS[i % SLICE_COLORS.length].color;
          return (
            <div key={item.name} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[8px] text-muted-foreground truncate max-w-[60px]">
                {item.name}
              </span>
              <span className="text-[8px] font-semibold tabular-nums">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
