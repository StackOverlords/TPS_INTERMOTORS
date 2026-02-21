import { Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DatePeriod } from "../../hooks/useDateFilters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";

interface CardTimeFilterProps {
  value?: DatePeriod | null;
  onChange?: (period: DatePeriod | null) => void;
}

const periods: { value: DatePeriod; label: string }[] = [
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "90d", label: "Últimos 90 días" },
  { value: "1y", label: "Último año" },
];

export function CardTimeFilter({ value, onChange }: CardTimeFilterProps) {
  const activeLabel = value
    ? (periods.find((p) => p.value === value)?.label ?? "Personalizado")
    : "Usar filtro global";

  const handleClick = (period: DatePeriod | null) => {
    onChange?.(period);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 text-[9px] font-medium transition-colors px-1.5 py-0.5 rounded-md hover:bg-muted/50",
            value
              ? "text-primary hover:text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="h-2.5 w-2.5" />
          {activeLabel}
          <ChevronDown className="h-2.5 w-2.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem
          onClick={() => handleClick(null)}
          className={cn(
            "text-xs cursor-pointer",
            !value && "font-semibold text-primary"
          )}
        >
          Usar filtro global
        </DropdownMenuItem>
        <div className="my-1 h-px bg-border" />
        {periods.map((period) => (
          <DropdownMenuItem
            key={period.value}
            onClick={() => handleClick(period.value)}
            className={cn(
              "text-xs cursor-pointer",
              value === period.value && "font-semibold text-primary"
            )}
          >
            {period.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
