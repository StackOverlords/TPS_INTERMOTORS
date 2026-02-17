import { TrendingUp } from "lucide-react";
import { CardTimeFilter } from "./CardTimeFilterIcon";
import type { SalesReportItem } from "../../hooks/useDashboardData";
import type { DatePeriod } from "../../hooks/useDateFilters";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { SaleHorizontalBarChart } from "@/modules/reports/components/charts/saleHorizontalBarChart";
import { CardOptionsMenu } from "./CardOptionsMenu";

interface TopSoldCardProps {
  data: SalesReportItem[];
  onNavigate?: () => void;
  period?: DatePeriod | null;
  onPeriodChange?: (period: DatePeriod | null) => void;
}

export function TopSoldCard({
  data,
  onNavigate,
  period,
  onPeriodChange,
}: TopSoldCardProps) {
  return (
    <div className="col-span-4 min-h-0">
      <Card className="h-full flex flex-col border-border/40 relative overflow-visible">
        <CardHeader className="flex flex-row items-center justify-between py-2 px-3 pb-0 shrink-0">
          <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
            <TrendingUp className="size-5 text-blue-500" />
            Top Más Vendidos
          </CardTitle>
          <div className="flex items-center gap-1">
            <CardTimeFilter value={period} onChange={onPeriodChange} />
            <CardOptionsMenu
              onNavigate={onNavigate}
              navigateLabel="Ver ranking completo"
              chartContainerId="chart-most-sold"
            />
          </div>
        </CardHeader>
        <CardContent
          className="flex-1 p-2 pt-1 min-h-0 relative"
          style={{ overflow: "visible" }}
        >
          <div
            id="chart-most-sold"
            className="h-full w-full flex items-center"
            style={{ overflow: "visible" }}
          >
            <SaleHorizontalBarChart
              data={data}
              dataKey="cantidad"
              limit={10}
              colorPreset="blue"
              compactMode={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
