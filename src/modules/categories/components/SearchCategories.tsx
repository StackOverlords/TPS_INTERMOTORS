import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { RefreshCw, Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const SearchCategories = ({ value, onChange, onRefresh, isLoading }: Props) => {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-white border border-gray-200 rounded-lg sm:flex-nowrap sm:items-center sm:justify-between">
      <div className="flex gap-6 text-sm text-gray-600">
        {/* Estos contadores los mantendremos fuera por ahora */}
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
          <Input
            placeholder="Buscar categorías..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-10 h-9"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 h-9 w-full sm:w-auto flex items-center justify-center"
        >
          <RefreshCw
            className={`w-4 h-4 transition-transform ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
    </div>
  );
};

export default SearchCategories;
