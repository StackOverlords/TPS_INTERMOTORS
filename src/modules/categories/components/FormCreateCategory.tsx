import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Save } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const FormCreateCategory = ({ value, onChange, onSubmit, isLoading }: Props) => {
  return (
    <div className="p-4 bg-white rounded-lg">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-0">
          <Label htmlFor="new-category" className="text-sm font-medium text-gray-700">
            Nueva categoría
          </Label>
          <Input
            id="new-category"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ej: Amortiguadores"
            className="mt-1 h-9 w-full"
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            disabled={isLoading}
          />
        </div>
        <Button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          className="px-4 h-9 w-full sm:w-auto"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Creando..." : "Crear"}
        </Button>
      </div>
    </div>
  );
};

export default FormCreateCategory;