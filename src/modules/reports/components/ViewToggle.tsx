import { BarChart3, Table } from "lucide-react";
import type { ViewMode } from "../types/report.types";
import { Button } from "@/components/atoms/button";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex gap-1 border border-border rounded-lg p-1">
      <Button
        type="button"
        size="sm"
        variant={value === "table" ? "default" : "ghost"}
        onClick={() => onChange("table")}
        className="h-7 text-xs"
      >
        <Table className="size-4" />
        <span className="hidden sm:inline">Tabla</span>
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "chart" ? "default" : "ghost"}
        onClick={() => onChange("chart")}
        className="h-7 text-xs"
      >
        <BarChart3 className="size-4" />
        <span className="hidden sm:inline">Gráfico</span>
      </Button>
    </div>
  );
}
