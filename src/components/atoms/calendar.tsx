import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "./button";
import { es } from "date-fns/locale";
import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  onTodayClick?: () => void;
  autoFocusToday?: boolean;
  /** Called when year or month picker selects a date (only when a date was already selected) */
  onSelectDate?: (date: Date) => void;
};

type PickerView = "none" | "year" | "month";

// 4 cols × 5 rows = 20 years per page
const YEARS_PER_PAGE = 20;

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  onTodayClick,
  autoFocusToday = false,
  onSelectDate,
  ...props
}: CalendarProps) {
  const todayButtonRef = useRef<HTMLButtonElement>(null);
  const [pickerView, setPickerView] = useState<PickerView>("none");

  // The month currently displayed in the calendar (controlled from outside)
  const displayedMonth: Date = (props.month as Date) ?? new Date();
  const displayedYear = displayedMonth.getFullYear();
  const displayedMonthIndex = displayedMonth.getMonth();

  // Today's real values — used only for "today" highlight
  const todayYear = new Date().getFullYear();
  const todayMonthIndex = new Date().getMonth();

  // The selected date — used for "selected" highlight
  // Access safely since `selected` only exists on certain DayPicker mode variants
  const selectedRaw = "selected" in props ? props.selected : undefined;
  const selectedDate = selectedRaw instanceof Date ? selectedRaw : null;
  const selectedYear = selectedDate ? selectedDate.getFullYear() : null;
  const selectedMonthIndex = selectedDate ? selectedDate.getMonth() : null;

  // Year page anchor: first year of the current 20-year block
  const [yearPageStart, setYearPageStart] = useState<number>(() => {
    return displayedYear - (displayedYear % YEARS_PER_PAGE);
  });

  // Sync page to show the displayed year whenever the picker opens
  useEffect(() => {
    if (pickerView === "year") {
      setYearPageStart(displayedYear - (displayedYear % YEARS_PER_PAGE));
    }
  }, [pickerView, displayedYear]);

  useEffect(() => {
    if (autoFocusToday) {
      const timer = setTimeout(() => {
        todayButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocusToday]);

  const years = Array.from(
    { length: YEARS_PER_PAGE },
    (_, i) => yearPageStart + i
  );

  const handleYearSelect = (year: number) => {
    const newMonth = new Date(displayedMonth);
    newMonth.setFullYear(year);
    props.onMonthChange?.(newMonth);
    // If a date was already selected, update it preserving month and day
    if (selectedDate && onSelectDate) {
      const updated = new Date(selectedDate);
      updated.setFullYear(year);
      onSelectDate(updated);
    }
    setPickerView("none");
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newMonth = new Date(displayedMonth);
    newMonth.setMonth(monthIndex);
    props.onMonthChange?.(newMonth);
    // If a date was already selected, update it preserving year and day
    if (selectedDate && onSelectDate) {
      const updated = new Date(selectedDate);
      updated.setMonth(monthIndex);
      onSelectDate(updated);
    }
    setPickerView("none");
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const monthName = capitalize(
    displayedMonth.toLocaleDateString("es", { month: "long" })
  );

  return (
    <div className="relative">
      {/* ── Year picker overlay ── */}
      {pickerView === "year" && (
        <div className="absolute inset-0 z-10 bg-popover rounded-md p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <Button
              onClick={() => setYearPageStart((p) => p - YEARS_PER_PAGE)}
              variant={"outline"}
              className="w-8"
              aria-label="Página anterior de años"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium">
              {yearPageStart} – {yearPageStart + YEARS_PER_PAGE - 1}
            </span>
            <Button
              onClick={() => setYearPageStart((p) => p + YEARS_PER_PAGE)}
              variant={"outline"}
              className="w-8"
              aria-label="Página siguiente de años"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* 4 cols × 5 rows = 20 years */}
          <div className="grid grid-cols-4 gap-1 flex-1">
            {years.map((year) => {
              const isSelected = year === selectedYear;
              const isToday = year === todayYear;
              return (
                <Button
                  key={year}
                  variant={
                    isSelected ? "default" : isToday ? "secondary" : "ghost"
                  }
                  onClick={() => handleYearSelect(year)}
                  className="text-xs px-1 font-normal"
                >
                  {year}
                </Button>
              );
            })}
          </div>

          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPickerView("none")}
              className="text-xs px-2 py-1 h-auto"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* ── Month picker overlay ── */}
      {pickerView === "month" && (
        <div className="absolute inset-0 z-10 bg-popover rounded-md p-3 flex flex-col">
          <div className="flex items-center justify-center mb-2">
            <span className="text-sm font-medium">{displayedYear}</span>
          </div>

          {/* 3 cols × 4 rows = 12 months */}
          <div className="grid grid-cols-3 gap-1 flex-1">
            {MONTHS_ES.map((name, index) => {
              const isSelected =
                index === selectedMonthIndex && displayedYear === selectedYear;
              const isToday =
                index === todayMonthIndex && displayedYear === todayYear;
              const isCurrent = index === displayedMonthIndex;
              return (
                <Button
                  key={index}
                  variant={
                    isSelected ? "default" : isToday ? "secondary" : "ghost"
                  }
                  onClick={() => handleMonthSelect(index)}
                  className={cn(
                    "text-xs px-1 font-normal",
                    !isSelected &&
                      !isToday &&
                      isCurrent &&
                      "border border-border"
                  )}
                >
                  {name.slice(0, 3)}
                </Button>
              );
            })}
          </div>

          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPickerView("none")}
              className="text-xs px-2 py-1 h-auto"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <DayPicker
        locale={es}
        navLayout="after"
        showOutsideDays={showOutsideDays}
        fixedWeeks={true}
        className={cn("p-3", className)}
        classNames={{
          month: "flex flex-col items-center capitalize",
          nav: "flex justify-between items-center w-full mb-2",
          month_caption: "text-sm font-medium text-center absolute top-4",
          weekdays:
            "text-xs text-muted-foreground font-normal flex justify-between items-center text-center",
          button_next: cn(
            buttonVariants({
              variant: "outline",
              className:
                "size-8 [&_.rdp-chevron]:fill-foreground hover:[&_.rdp-chevron]:fill-accent-foreground",
            })
          ),
          button_previous: cn(
            buttonVariants({
              variant: "outline",
              className:
                "size-8 [&_.rdp-chevron]:fill-foreground hover:[&_.rdp-chevron]:fill-accent-foreground",
            })
          ),
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "size-8 p-0 font-normal aria-selected:opacity-100"
          ),
          range_end: "day-range-end",
          selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          today: "bg-accent text-accent-foreground",
          outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          disabled: "text-muted-foreground opacity-50",
          range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          hidden: "invisible",
          ...classNames,
        }}
        components={{
          MonthCaption: () => (
            <div className="text-sm font-medium text-center absolute top-4 left-0 right-0 flex items-center justify-center pointer-events-none">
              {/* Month button */}
              <Button
                onClick={() => setPickerView("month")}
                variant={"ghost"}
                className="h-auto px-1.5 py-0.5 text-sm font-medium capitalize hover:underline underline-offset-2 pointer-events-auto"
                title="Seleccionar mes"
                aria-label={`Mes ${monthName}, click para cambiar`}
              >
                {monthName}
              </Button>

              {/* Year button */}
              <Button
                onClick={() => setPickerView("year")}
                variant={"ghost"}
                className="h-auto px-1.5 py-0.5 text-sm font-medium hover:underline underline-offset-2 pointer-events-auto"
                title="Seleccionar año"
                aria-label={`Año ${displayedYear}, click para cambiar`}
              >
                {displayedYear}
              </Button>
            </div>
          ),
        }}
        footer={
          <footer className="flex flex-wrap gap-1 justify-end mt-2">
            <Button
              ref={todayButtonRef}
              variant="ghost"
              size="sm"
              onClick={onTodayClick}
              className="text-xs px-2 py-1 h-auto"
            >
              Hoy
            </Button>
          </footer>
        }
        {...props}
      />
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
