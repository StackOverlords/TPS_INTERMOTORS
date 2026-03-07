import { cn } from "@/lib/utils";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../atoms/badge";
import { Button } from "../atoms/button";
import { Calendar } from "../atoms/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../atoms/popover";

interface PopoverDatePickerProps {
  /** Fecha seleccionada */
  value?: Date | null;
  /** Cambia la fecha */
  onChange: (date: Date | undefined) => void;
  /** Texto a mostrar cuando no hay fecha */
  placeholder?: string;
  /** Deshabilita fechas */
  disabled?: (date: Date) => boolean;
  /** Muestra error visual */
  hasError?: string | null;
  /** Clase adicional */
  className?: string;
}

const PopoverDatePicker: React.FC<PopoverDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled,
  hasError = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState<Date | undefined>(undefined);

  const parseDateToLocal = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    localDate.setHours(0, 0, 0, 0);
    return localDate;
  };

  const localMidnightDate = useMemo(() => {
    if (!value) return null;
    if (typeof value === "string") {
      return parseDateToLocal(value);
    }
    const localDate = new Date(value);
    localDate.setHours(0, 0, 0, 0);
    return localDate;
  }, [value]);

  const formattedDate = useMemo(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return value
      ? formatInTimeZone(value, timeZone, "dd/MM/yyyy", { locale: es })
      : placeholder;
  }, [value, placeholder]);

  // Actualizar el mes cuando se abre el popover
  useEffect(() => {
    if (isOpen) {
      setDisplayMonth(localMidnightDate || new Date());
    }
  }, [isOpen, localMidnightDate]);

  // Función para seleccionar la fecha de hoy
  const selectToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    onChange(today);
    setIsOpen(false);
  };

  // Manejador de teclado para el botón trigger
  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Si NO hay fecha seleccionada, seleccionar hoy
      if (!value) {
        e.preventDefault();
        e.stopPropagation();
        selectToday();
      }
    }
  };

  // Handler para cuando el year/month picker actualiza la fecha seleccionada
  const handleSelectDate = (date: Date) => {
    date.setHours(0, 0, 0, 0);
    onChange(date);
    // Sync the display month to the new date
    setDisplayMonth(date);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            "w-full justify-between text-left font-normal px-2",
            !value && "text-muted-foreground",
            hasError &&
              "border-destructive focus:border-destructive focus:ring-destructive",
            className
          )}
        >
          <div className="flex items-center truncate">
            <CalendarIcon className="mr-1 size-4" />
            {formattedDate}
          </div>

          {value && (
            <Badge
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
              className="rounded-md p-0 flex items-center justify-center size-6 cursor-pointer text-destructive hover:text-destructive/80 hover:bg-destructive/10 bg-transparent hover:border-destructive/30"
            >
              <X className="size-3" />
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={localMidnightDate ?? undefined}
          onSelect={(date) => {
            onChange(date);
            setIsOpen(false);
          }}
          onTodayClick={selectToday}
          onSelectDate={handleSelectDate}
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          disabled={disabled}
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};

export default PopoverDatePicker;
