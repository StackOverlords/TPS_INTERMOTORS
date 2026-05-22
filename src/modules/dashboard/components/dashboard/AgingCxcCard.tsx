import { CreditCard } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { BarChartSkeleton } from "@/components/charts/ChartSkeletons";
import type { CxcAging } from "../../types/dashboard.types";

interface AgingCxcCardProps {
  data: CxcAging | undefined;
  isLoading: boolean;
}

/** Format a monetary value as "Bs 1,234". */
function formatBs(value: number): string {
  return `Bs ${value.toLocaleString("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

const AgingTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.[0]) {
    const d = payload[0].payload as AgingChartRow;
    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg p-2.5 text-[10px]">
        <p className="font-semibold text-foreground mb-0.5">{label}</p>
        <p className="text-muted-foreground">
          Cuentas:{" "}
          <span className="font-bold text-foreground">{d.count}</span>
        </p>
        <p className="text-muted-foreground">
          Total:{" "}
          <span className="font-bold text-foreground">{formatBs(d.total)}</span>
        </p>
      </div>
    );
  }
  return null;
};

interface AgingChartRow {
  name: string;
  count: number;
  total: number;
  color: string;
}

function buildChartData(data: CxcAging): AgingChartRow[] {
  // Backend returns CUMULATIVE buckets:
  //   vencida_30_dias = overdue > 30 days (includes those also > 60 days)
  //   vencida_60_dias = overdue > 60 days (subset of above)
  //
  // Disjoint buckets:
  //   "+60 días" = vencida_60_dias_* values (most severe)
  //   "+30 días" = vencida_30_dias_* MINUS vencida_60_dias_* (31-60 day band)
  const bucket60count = data.vencida_60_dias_count;
  const bucket60total = data.vencida_60_dias_total;

  const bucket30count = Math.max(
    0,
    data.vencida_30_dias_count - data.vencida_60_dias_count
  );
  const bucket30total = Math.max(
    0,
    data.vencida_30_dias_total - data.vencida_60_dias_total
  );

  return [
    {
      name: "+30 días",
      count: bucket30count,
      total: bucket30total,
      // amber for 31-60 day band
      color: "hsl(38 92% 50%)",
    },
    {
      name: "+60 días",
      count: bucket60count,
      total: bucket60total,
      // red for most overdue
      color: "hsl(0 72% 51%)",
    },
  ];
}

export function AgingCxcCard({ data, isLoading }: AgingCxcCardProps) {
  const isEmpty =
    data === undefined ||
    (data.vencida_30_dias_count === 0 && data.vencida_60_dias_count === 0);

  const chartData = data ? buildChartData(data) : [];

  return (
    <Card className="h-full flex flex-col overflow-hidden border-border/40">
      <CardHeader className="flex flex-row items-center justify-between py-2 px-3 pb-0 shrink-0">
        <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
          <CreditCard className="size-4 text-red-500" />
          Cartera Vencida CxC
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-2.5 pt-1 min-h-0">
        {isLoading ? (
          <BarChartSkeleton bars={2} series={1} className="h-full w-full" />
        ) : isEmpty ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm font-medium text-muted-foreground">—</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              barSize={36}
            >
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis hide />
              <Tooltip
                content={<AgingTooltip />}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.15 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
