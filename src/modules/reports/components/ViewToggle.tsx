import { BarChart3, Table, LayoutGrid } from "lucide-react";
import type { ViewMode } from "../types/report.types";
import { ToggleGroup, ToggleGroupItem } from "@/components/atoms/toggle-group";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(newValue) => {
        if (newValue) onChange(newValue as ViewMode);
      }}
      className="border border-border rounded-lg"
    >
      <ToggleGroupItem
        value="table"
        aria-label="Vista de tabla"
        className="gap-2"
      >
        <Table className="h-4 w-4" />
        <span className="hidden sm:inline">Tabla</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="chart"
        aria-label="Vista de gráfico"
        className="gap-2"
      >
        <BarChart3 className="h-4 w-4" />
        <span className="hidden sm:inline">Gráfico</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="both"
        aria-label="Vista combinada"
        className="gap-2"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Ambos</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
