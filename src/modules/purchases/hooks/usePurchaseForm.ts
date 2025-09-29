import { toast } from "@/hooks/use-toast";
import { apiConstructor } from "@/modules/products/services/api";
import { useCallback, useState } from "react";


export interface FormData {
  fecha: string;
  nro_comprobante: string;
  nro_comprobante2: string;
  id_proveedor: number | null;
  tipo_compra: string;
  forma_compra: string;
  comentario: string;
  usuario: number | null;
  sucursal: number | null;
  detalles: any[];
  id_responsable: number | null;
}

interface FormErrors { [key: string]: string; }
interface FormTouched { [key: string]: boolean; }

export function usePurchaseForm(initialBranch: number) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fecha: new Date().toISOString().split("T")[0],
    nro_comprobante: "",
    nro_comprobante2: "",
    id_proveedor: null,
    tipo_compra: "",
    forma_compra: "",
    comentario: "",
    usuario: 1, // ID por defecto
    sucursal: initialBranch || 1, // Usar branch inicial o 1 por defecto
    detalles: [],
    id_responsable: null // Se seleccionará desde el dropdown
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});

  const validateField = useCallback((field: keyof FormData, value: any): string => {
    if (["tipo_compra", "forma_compra", "detalles", "id_proveedor", "id_responsable"].includes(field)) {
      if (!value || (Array.isArray(value) ? value.length === 0 : value === 0)) return "Este campo es requerido.";
    }
    if (field === "fecha" && !value) return "La fecha de pedido es requerida.";
    return "";
  }, []);

  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    (Object.keys(formData) as (keyof FormData)[]).forEach(f => {
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors(e => ({ ...e, [field]: validateField(field, value) }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((field: keyof FormData) => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(e => ({ ...e, [field]: validateField(field, formData[field]) }));
  }, [formData, validateField]);

  const reset = useCallback(() => {
    setFormData({
      fecha: new Date().toISOString().split("T")[0],
      nro_comprobante: "",
      nro_comprobante2: "",
      id_proveedor: null,
      tipo_compra: "",
      forma_compra: "",
      comentario: "",
      usuario: 1, // ID por defecto
      sucursal: initialBranch || 1, // Usar branch inicial o 1 por defecto
      detalles: [],
      id_responsable: null, // Se seleccionará desde el dropdown
    });
    setErrors({});
    setTouched({});
  }, [initialBranch]);

  const handleSubmit = useCallback(async () => {
    setTouched(Object.keys(formData).reduce((a, k) => ({ ...a, [k]: true }), {} as FormTouched));
    if (!validateAll()) return;
    setIsLoading(true);
    console.log(formData)
    try {
      await apiConstructor({ url: "/purchases", method: "POST", data: formData });
      reset();
      toast({ title: "Compra creada exitosamente", description: "La compra se ha guardado correctamente." });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateAll, reset]);

  return {
    formData,
    errors,
    isLoading,
    handleChange,
    handleBlur,
    handleSubmit,
    setFormData,
    reset,
  };
}
