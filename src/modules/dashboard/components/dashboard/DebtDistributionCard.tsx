import { PieChart as PieChartIcon } from "lucide-react";
import type { ReceivableMetrics } from "../../hooks/useDashboardData";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { CardOptionsMenu } from "./CardOptionsMenu";
import { ReceivablesDonutChart } from "./ReceivablesDonutChart";

interface DebtDistributionCardProps {
  receivableMetrics: ReceivableMetrics;
}

export function DebtDistributionCard({
  receivableMetrics,
}: DebtDistributionCardProps) {
  return (
    <div className="col-span-3 min-h-0">
      <Card className="h-full flex flex-col overflow-hidden border-border/40">
        <CardHeader className="flex flex-row items-center justify-between py-2 px-3 pb-0 shrink-0">
          <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
            <PieChartIcon className="size-5 text-amber-500" />
            Deuda por Cliente
          </CardTitle>
          <CardOptionsMenu chartContainerId="chart-donut" />
        </CardHeader>
        <CardContent id="chart-donut" className="flex-1 p-2.5 pt-1 min-h-0">
          <ReceivablesDonutChart
            topDeudores={receivableMetrics.topDeudores}
            totalDeuda={receivableMetrics.totalDeuda}
          />
        </CardContent>
      </Card>
    </div>
  );
}
