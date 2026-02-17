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
        "h-full border-border/40 bg-background transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-border/60"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between gap-2">
          <div className={cn("rounded-lg p-1.5 shrink-0", accent)}>
            <Icon className="size-4" />
          </div>
          <div className="flex flex-col items-end">
            <p
              className={cn(
                "text-base font-bold tracking-tight leading-none mb-0.5",
                accent
              )}
            >
              {value}
            </p>
            <p className="text-sm font-semibold text-muted-foreground">
              {title}
            </p>
            {/* {subtitle && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {subtitle}
              </p>
            )} */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
