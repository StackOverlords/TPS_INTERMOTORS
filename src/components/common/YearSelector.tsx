import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../atoms/popover";
import { Button } from "../atoms/button";

interface YearSelectorProps {
    value: string;
    onValueChange: (year: string) => void;
    // label?: string;
    minYear?: number;
    maxYear?: number;
}

export const YearSelector: React.FC<YearSelectorProps> = ({
    value,
    onValueChange,
    // label = "Selecciona la gestión",
    minYear = 1990,
    maxYear = new Date().getFullYear()
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [rangeStart, setRangeStart] = useState(() => {
        const selectedYear = parseInt(value);
        // Calcular el rango que contiene el año seleccionado
        const rangeIndex = Math.floor((selectedYear - minYear) / 12);
        return minYear + (rangeIndex * 12);
    });

    // Generar 12 años desde rangeStart
    const years = Array.from({ length: 12 }, (_, i) => rangeStart + i)
        .filter(year => year >= minYear && year <= maxYear);

    const canGoPrevious = rangeStart > minYear;
    const canGoNext = rangeStart + 12 <= maxYear;

    const handlePrevious = () => {
        if (canGoPrevious) {
            setRangeStart(prev => Math.max(prev - 12, minYear));
        }
    };

    const handleNext = () => {
        if (canGoNext) {
            setRangeStart(prev => prev + 12);
        }
    };

    const handleYearSelect = (year: number) => {
        onValueChange(year.toString());
        setIsOpen(false);
    };

    const getRangeLabel = () => {
        const endYear = Math.min(rangeStart + 11, maxYear);
        return `${rangeStart}-${endYear}`;
    };

    return (
        <div className="space-y-2">
            {/* <label className="text-sm font-medium text-muted-foreground">
                {label}
            </label> */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        size={'sm'}
                        variant="outline"
                        className={cn(
                            "max-w-[200px] w-full justify-between text-left font-normal bg-background",
                            !value && "text-muted-foreground"
                        )}
                    >
                        <span>{value || "Seleccionar año"}</span>
                        <Calendar className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 bg-background border shadow-lg" align="start">
                    <div className="p-4">
                        {/* Header con navegación */}
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={handlePrevious}
                                disabled={!canGoPrevious}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium text-foreground">
                                {getRangeLabel()}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={handleNext}
                                disabled={!canGoNext}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Grilla de años */}
                        <div className="grid grid-cols-3 gap-2">
                            {years.map((year) => (
                                <Button
                                    key={year}
                                    variant={value === year.toString() ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        " text-xs font-medium",
                                        value === year.toString()
                                            ? "bg-foreground text-background hover:bg-foreground/90"
                                            : "text-foreground hover:bg-muted"
                                    )}
                                    onClick={() => handleYearSelect(year)}
                                >
                                    {year}
                                </Button>
                            ))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};