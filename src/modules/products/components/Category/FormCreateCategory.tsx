import { useState } from "react";
import { Save } from "lucide-react";
import { Label } from "@/components/atoms/label";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import { useToast } from "@/hooks/use-toast";
import { apiConstructor } from "../../services/api";

interface FormErrors {
  [key: string]: string;
}

interface FormTouched {
  [key: string]: boolean;
}

const FormCreateCategory: React.FC = () => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    categoria: "",
    subcategoria: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (field: string, value: string): string => {
    if (!value.trim()) return "Este campo es requerido";
    if (value.length < 3) return "Debe tener al menos 3 caracteres";
    return "";
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async () => {
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    setTouched({ categoria: true, subcategoria: true });

    if (Object.keys(newErrors).length > 0) {
      toast({
        title: "Error de validación",
        description: "Completa los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await apiConstructor({
        url: "/categories",
        method: "POST",
        data: formData,
      });
      toast({
        title: "Categoría creada",
        description: "La categoría y subcategoría fueron creadas exitosamente",
      });
      setFormData({ categoria: "", subcategoria: "" });
      setErrors({});
      setTouched({});
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo crear la categoría",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClassName = (field: string) =>
    errors[field]
      ? "h-8 text-sm border-red-500 focus:border-red-500 focus:ring-red-500"
      : "h-8 text-sm";

  return (
    <div className="max-w-3xl p-4 bg-white border border-gray-200 rounded-lg">
      <h2 className="mb-4 text-lg font-semibold">Crear Categoría y Subcategoría</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-gray-600">Categoría *</Label>
          <Input
            value={formData.categoria}
            onChange={(e) => handleChange("categoria", e.target.value)}
            onBlur={() => handleBlur("categoria")}
            placeholder="Ej: Filtros"
            className={getInputClassName("categoria")}
          />
          {errors.categoria && (
            <p className="mt-1 text-xs text-red-500">{errors.categoria}</p>
          )}
        </div>
        <div>
          <Label className="text-xs text-gray-600">Subcategoría *</Label>
          <Input
            value={formData.subcategoria}
            onChange={(e) => handleChange("subcategoria", e.target.value)}
            onBlur={() => handleBlur("subcategoria")}
            placeholder="Ej: Filtro de aceite"
            className={getInputClassName("subcategoria")}
          />
          {errors.subcategoria && (
            <p className="mt-1 text-xs text-red-500">{errors.subcategoria}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <span className="text-xs text-gray-500">* Campos requeridos</span>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="h-8 text-sm bg-gray-900 hover:bg-gray-800"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Guardando..." : "Guardar Categoría"}
        </Button>
      </div>
    </div>
  );
};

export default FormCreateCategory;
