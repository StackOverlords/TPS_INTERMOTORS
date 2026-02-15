import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ReceivablesDonutChartProps {
  topDeudores: { cliente: string; saldo: number }[];
  totalDeuda: number;
}

const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(271, 91%, 65%)",
  "hsl(142, 71%, 45%)",
  "hsl(24, 95%, 53%)",
  "hsl(330, 81%, 60%)",
  "hsl(187, 85%, 53%)",
];

export function ReceivablesDonutChart({
  topDeudores,
  totalDeuda,
}: ReceivablesDonutChartProps) {
  const chartData = useMemo(() => {
    const top5 = topDeudores.slice(0, 5);
    const otherSum = topDeudores.slice(5).reduce((s, d) => s + d.saldo, 0);
    const result = top5.map((d) => ({ name: d.cliente, value: d.saldo }));
    if (otherSum > 0) result.push({ name: "Otros", value: otherSum });
    return result;
  }, [topDeudores]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.[0]) {
      const d = payload[0].payload;
      const pct =
        totalDeuda > 0 ? ((d.value / totalDeuda) * 100).toFixed(1) : "0";
      return (
        <div className="bg-popover/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg p-2.5 text-[10px]">
          <p className="font-semibold text-foreground">{d.name}</p>
          <p className="text-muted-foreground">
            Bs {d.value.toLocaleString("es-BO", { minimumFractionDigits: 0 })} (
            {pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center h-full gap-2">
      <div className="relative flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="80%"
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-[8px] text-muted-foreground">Total</p>
            <p className="text-xs font-bold">
              Bs {(totalDeuda / 1000).toFixed(1)}k
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-1 shrink-0">
        {chartData.map((item, i) => (
          <div key={item.name} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-[8px] text-muted-foreground truncate max-w-[60px]">
              {item.name}
            </span>
            <span className="text-[8px] font-semibold tabular-nums">
              {totalDeuda > 0
                ? ((item.value / totalDeuda) * 100).toFixed(0)
                : 0}
              %
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
