import { useState, useCallback } from "react";
import { CalendarDays, ChevronDown, SlidersHorizontal } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/popover";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import { Calendar } from "@/components/atoms/calendar";

interface DateRangeFilterProps {
  from: Date;
  to: Date;
  onChange: (from: Date, to: Date) => void;
  className?: string;
}

const presets = [
  { label: "Hoy", getValue: () => ({ from: new Date(), to: new Date() }) },
  {
    label: "7 días",
    getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }),
  },
  {
    label: "30 días",
    getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }),
  },
  {
    label: "Este mes",
    getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }),
  },
  {
    label: "Mes pasado",
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
];

export function DateRangeFilter({
  from,
  to,
  onChange,
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState("30 días");
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>({
    from,
    to,
  });

  const handlePreset = useCallback(
    (preset: (typeof presets)[0]) => {
      const { from, to } = preset.getValue();
      setActivePreset(preset.label);
      onChange(from, to);
      setPendingRange({ from, to });
    },
    [onChange]
  );

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setPendingRange({ from, to });
    }
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    setPendingRange(range);
    // Only close & apply when both dates are selected
    if (
      range?.from &&
      range?.to &&
      range.from.getTime() !== range.to.getTime()
    ) {
      onChange(range.from, range.to);
      setActivePreset("");
      setOpen(false);
    }
  };

  const handleApply = () => {
    if (pendingRange?.from && pendingRange?.to) {
      onChange(pendingRange.from, pendingRange.to);
      setActivePreset("");
      setOpen(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-xl border border-border/60 bg-background backdrop-blur-sm p-1 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-0.5 px-1">
        <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
      </div>

      <div className="h-4 w-px bg-border/60" />

      {presets.slice(0, 4).map((preset) => (
        <button
          key={preset.label}
          onClick={() => handlePreset(preset)}
          className={cn(
            "text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition-all duration-200",
            activePreset === preset.label
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}
        >
          {preset.label}
        </button>
      ))}

      <div className="h-4 w-px bg-border/60" />

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 text-[10px] gap-1.5 px-2.5 rounded-lg font-medium",
              !activePreset
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="h-3 w-3" />
            <span className="tabular-nums">
              {format(from, "dd MMM", { locale: es })} –{" "}
              {format(to, "dd MMM", { locale: es })}
            </span>
            <ChevronDown className="h-2.5 w-2.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 rounded-xl shadow-lg border-border/60"
          align="end"
        >
          <div className="flex">
            {/* Presets sidebar */}
            <div className="border-r border-border/40 p-2 space-y-0.5 bg-muted/20">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-1">
                Rango rápido
              </p>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    handlePreset(preset);
                    setOpen(false);
                  }}
                  className={cn(
                    "block w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors",
                    activePreset === preset.label
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {/* Calendar area */}
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 pb-2 border-b border-border/40 mb-1">
                <Badge
                  variant="outline"
                  className="text-[9px] font-medium gap-1 px-2 py-0.5 bg-muted/30"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  {pendingRange?.from
                    ? format(pendingRange.from, "dd MMM yyyy", { locale: es })
                    : "—"}
                </Badge>
                <span className="text-[9px] text-muted-foreground">→</span>
                <Badge
                  variant="outline"
                  className="text-[9px] font-medium gap-1 px-2 py-0.5 bg-muted/30"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  {pendingRange?.to
                    ? format(pendingRange.to, "dd MMM yyyy", { locale: es })
                    : "—"}
                </Badge>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={!pendingRange?.from || !pendingRange?.to}
                  className="ml-auto h-6 text-[10px] px-3 rounded-lg"
                >
                  Aplicar
                </Button>
              </div>
              <Calendar
                mode="range"
                selected={pendingRange}
                onSelect={handleRangeSelect}
                numberOfMonths={2}
                locale={es}
                defaultMonth={from}
                className="pointer-events-auto"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
