import { Card, CardContent } from "@/components/atoms/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
interface BentoMetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  accent: string;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  onClick?: () => void;
}

export function BentoMetricCard({
  title,
  value,
  icon: Icon,
  accent,
  subtitle,
  trend,
  onClick,
}: BentoMetricCardProps) {
  return (
    <Card
      className={cn(
        "h-full border-border/40 bg-card/80 backdrop-blur-sm transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-border/60"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className={cn("rounded-lg p-1.5 shrink-0", accent)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                trend.positive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              )}
            >
              {trend.positive ? (
                <TrendingUp className="h-2.5 w-2.5" />
              ) : (
                <TrendingDown className="h-2.5 w-2.5" />
              )}
              {trend.value}
            </div>
          )}
        </div>
        <div>
          <p className="text-base font-bold tracking-tight leading-none mb-0.5">
            {value}
          </p>
          <p className="text-[10px] font-medium text-muted-foreground">
            {title}
          </p>
          {subtitle && (
            <p className="text-[9px] text-muted-foreground/70 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
