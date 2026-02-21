import { BarChart3 } from "lucide-react";
import type { AccountReceivableItem } from "../../hooks/useDashboardData";
import type { DatePeriod } from "../../hooks/useDateFilters";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { CardTimeFilter } from "./CardTimeFilterIcon";
import { ReceivablesStackedBar } from "./ReceivablesStackedBarChart";
import { CardOptionsMenu } from "./CardOptionsMenu";

interface ReceivablesCardProps {
  data: AccountReceivableItem[];
  onNavigate?: () => void;
  period?: DatePeriod | null;
  onPeriodChange?: (period: DatePeriod | null) => void;
}

export function ReceivablesCard({
  data,
  onNavigate,
  period,
  onPeriodChange,
}: ReceivablesCardProps) {
  return (
    <div className="col-span-6 min-h-0">
      <Card className="h-full flex flex-col overflow-hidden border-border/40">
        <CardHeader className="flex flex-row items-center justify-between py-2 px-3 pb-0 shrink-0">
          <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
            <BarChart3 className="size-5 text-blue-500" />
            Cuentas por Cobrar
          </CardTitle>
          <div className="flex items-center gap-1">
            <CardTimeFilter value={period} onChange={onPeriodChange} />
            <CardOptionsMenu
              onNavigate={onNavigate}
              navigateLabel="Ver reporte completo"
              chartContainerId="chart-stacked"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-2 pt-1 min-h-0">
          <div id="chart-stacked" className="h-full">
            <ReceivablesStackedBar data={data} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
