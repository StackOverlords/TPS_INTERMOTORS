import { useMemo } from "react"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "../atoms/popover"
import { Button } from "../atoms/button"
import { Badge } from "../atoms/badge"
import { Calendar } from "../atoms/calendar"

interface PopoverDatePickerProps {
    /** Fecha seleccionada */
    value?: Date | null
    /** Cambia la fecha */
    onChange: (date: Date | undefined) => void
    /** Texto a mostrar cuando no hay fecha */
    placeholder?: string
    /** Deshabilita fechas */
    disabled?: (date: Date) => boolean
    /** Muestra error visual */
    hasError?: string | null
    /** Clase adicional */
    className?: string
}

const PopoverDatePicker: React.FC<PopoverDatePickerProps> = ({
    value,
    onChange,
    placeholder = "Seleccionar fecha",
    disabled,
    hasError = false,
    className,
}) => {
    const parseDateToLocal = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        localDate.setHours(0, 0, 0, 0); // Ensure midnight local time
        return localDate;
    };

    const localMidnightDate = useMemo(() => {
        if (!value) return null;
        if (typeof value === 'string') {
            return parseDateToLocal(value);
        }
        const localDate = new Date(value);
        localDate.setHours(0, 0, 0, 0); // Ensure midnight local time
        return localDate;
    }, [value]);

    const formattedDate = useMemo(() => {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return value ? formatInTimeZone(value, timeZone, 'dd/MM/yyyy', { locale: es }) : placeholder
    }, [value, placeholder])

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "flex-1 justify-between text-left font-normal",
                        !value && "text-muted-foreground",
                        hasError && "border-red-500 focus:border-red-500",
                        className
                    )}
                >
                    <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formattedDate}
                    </div>

                    {value && (
                        <Badge
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange(undefined)
                            }}
                            className="rounded-md p-0 flex items-center justify-center size-6 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent hover:border-red-200"
                        >
                            <X className="size-3" />
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={localMidnightDate ?? undefined}
                    onSelect={onChange}
                    disabled={disabled}
                    className="p-3 pointer-events-auto"
                />
            </PopoverContent>
        </Popover>
    )
}

export default PopoverDatePicker;