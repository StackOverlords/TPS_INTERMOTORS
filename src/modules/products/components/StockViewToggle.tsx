import { BarChart3, Table } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/atoms/toggle-group";

export type StockViewMode = "table" | "chart";

interface StockViewToggleProps {
  value: StockViewMode;
  onChange: (value: StockViewMode) => void;
}

export function StockViewToggle({ value, onChange }: StockViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(newValue) => {
        if (newValue) onChange(newValue as StockViewMode);
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
    </ToggleGroup>
  );
}
