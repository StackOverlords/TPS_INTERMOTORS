import { toast } from "@/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import { updatePurchase } from "../services/purchaseService";
import type { PurchaseDetail } from "../types/PurchaseDetail";
import type { FormData } from "./usePurchaseForm";

export function usePurchaseEdit(initialData?: PurchaseDetail) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fecha: "",
    nro_comprobante: "",
    nro_comprobante2: "",
    id_proveedor: null,
    tipo_compra: "",
    forma_compra: "",
    comentario: "",
    usuario: 1, // ID por defecto
    sucursal: 1, // ID por defecto
    detalles: [],
    id_responsable: null, // Cambiado a null para consistencia
  });

  // Poblar formulario con datos existentes
  useEffect(() => {
    if (initialData) {
      setFormData({
        fecha: initialData.fecha ? initialData.fecha.split('T')[0] : "",
        // Corregir mapeo: usar 'comprobante' no 'nro'
        nro_comprobante: (initialData as any).comprobante || "",
        // Usar 'comprobante2' del API
        nro_comprobante2: (initialData as any).comprobante2 || "",
        id_proveedor: initialData.proveedor?.id || null,
        tipo_compra: initialData.tipo_compra || "",
        forma_compra: initialData.forma_compra || "",
        // Usar 'comentarios' del API
        comentario: (initialData as any).comentarios || "",
        // El detalle de compra no incluye usuario ni sucursal, mantener por defecto
        usuario: 1, // Valor por defecto si no existe
        sucursal: 1, // Valor por defecto si no existe
        detalles: initialData.detalles || [],
        id_responsable: initialData.responsable?.id || null, // Cambiar a null si no existe
      });
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((field: keyof FormData, value: any): string => {
    if (["tipo_compra", "forma_compra", "id_proveedor", "id_responsable"].includes(field)) {
      if (!value || (Array.isArray(value) ? value.length === 0 : value === 0)) {
        return "Este campo es requerido.";
      }
    }
    if (field === "fecha" && !value) return "La fecha es requerida.";
    if (field === "nro_comprobante" && !value) return "El número de comprobante es requerido.";
    return "";
  }, []);

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
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

  const handleSubmit = useCallback(async (purchaseId: number) => {
    setTouched(Object.keys(formData).reduce((a, k) => ({ ...a, [k]: true }), {} as Record<string, boolean>));

    if (!validateAll()) {
      toast({
        title: "Error en el formulario",
        description: "Por favor, corrige los errores antes de continuar.",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);
    try {
      // Transformar los datos para el servidor
      const dataToSend = {
        ...formData,
        // Asegurar que los campos requeridos tengan valores
        usuario: formData.usuario || 1,
        sucursal: formData.sucursal || 1,
        id_responsable: formData.id_responsable || 1, // Fallback a 1 si es null
        // Transformar detalles para el servidor - usar estructura original
        detalles: formData.detalles.map((detalle, index) => {
          // Detectar si es un detalle existente por la presencia de id o id_detalle_compra
          const isExistingDetail = detalle.id || detalle.id_detalle_compra;
          
          if (isExistingDetail) {
            // Detalle existente - incluir id_detalle_compra y producto completo
            const transformedDetalle = {
              id_detalle_compra: detalle.id || detalle.id_detalle_compra,
              id_producto: detalle.id_producto || detalle.producto?.id?.toString() || '',
              producto: detalle.producto,
              cantidad: parseInt(String(detalle.cantidad), 10),
              costo: Number(detalle.costo),
              inc_p_venta: Number(detalle.inc_precio_venta || detalle.inc_p_venta || 0),
              precio_venta: Number(detalle.precio_venta),
              inc_p_venta_alt: Number(detalle.inc_precio_venta_alt || detalle.inc_p_venta_alt || 0),
              precio_venta_alt: Number(detalle.precio_venta_alt),
              moneda: detalle.moneda || 'BOB ',
              fecha_mod_precio: detalle.fecha_mod_precio || new Date().toISOString()
            };
            
            // Validar que los campos numéricos no sean NaN
            if (isNaN(transformedDetalle.inc_p_venta)) transformedDetalle.inc_p_venta = 0;
            if (isNaN(transformedDetalle.inc_p_venta_alt)) transformedDetalle.inc_p_venta_alt = 0;
            if (isNaN(transformedDetalle.cantidad)) transformedDetalle.cantidad = 1;
            if (isNaN(transformedDetalle.costo)) transformedDetalle.costo = 0;
            if (isNaN(transformedDetalle.precio_venta)) transformedDetalle.precio_venta = 0;
            if (isNaN(transformedDetalle.precio_venta_alt)) transformedDetalle.precio_venta_alt = 0;
            
            console.log(`🔍 Detalle existente ${index} (ID: ${transformedDetalle.id_detalle_compra}):`, transformedDetalle);
            return transformedDetalle;
          } else {
            // Detalle nuevo - usar el ID de referencia del primer detalle existente
            const cantidad = typeof detalle.cantidad === 'string' ? parseFloat(detalle.cantidad) : detalle.cantidad;
            const costo = typeof detalle.costo === 'string' ? parseFloat(detalle.costo) : detalle.costo;
            const incPVenta = Number(detalle.inc_p_venta || detalle.inc_precio_venta || 0);
            const precioVenta = typeof detalle.precio_venta === 'string' ? parseFloat(detalle.precio_venta) : detalle.precio_venta;
            const incPVentaAlt = Number(detalle.inc_p_venta_alt || detalle.inc_precio_venta_alt || 0);
            const precioVentaAlt = typeof detalle.precio_venta_alt === 'string' ? parseFloat(detalle.precio_venta_alt) : detalle.precio_venta_alt;

            const transformedDetalle = {
              // Usar null para productos nuevos (según indicación del desarrollador backend)
              id_detalle_compra: null,
              id_producto: detalle.producto?.id || parseInt(detalle.id_producto || '0'),
              cantidad: Number(cantidad),
              costo: Number(costo),
              inc_p_venta: incPVenta,
              precio_venta: Number(precioVenta),
              inc_p_venta_alt: incPVentaAlt,
              precio_venta_alt: Number(precioVentaAlt),
              moneda: detalle.moneda || 'BOB ',
            };
            // Usar null para productos nuevos
            
            // Validar que los campos numéricos no sean NaN
            if (isNaN(transformedDetalle.inc_p_venta)) transformedDetalle.inc_p_venta = 0;
            if (isNaN(transformedDetalle.inc_p_venta_alt)) transformedDetalle.inc_p_venta_alt = 0;
            if (isNaN(transformedDetalle.cantidad)) transformedDetalle.cantidad = 1;
            if (isNaN(transformedDetalle.costo)) transformedDetalle.costo = 0;
            if (isNaN(transformedDetalle.precio_venta)) transformedDetalle.precio_venta = 0;
            if (isNaN(transformedDetalle.precio_venta_alt)) transformedDetalle.precio_venta_alt = 0;
            
            console.log(`🆕 Detalle nuevo ${index} (ID: null, Producto ID: ${transformedDetalle.id_producto}):`, transformedDetalle);
            return transformedDetalle;
          }
        })
      };
      
      console.log('📤 Payload completo a enviar:', dataToSend);
      await updatePurchase(purchaseId, dataToSend);
      toast({
        title: "Compra actualizada",
        description: "La compra se ha actualizado correctamente.",
      });
      return true;
    } catch (error) {
      console.error('Error al actualizar:', error);
      toast({
        title: "Error al actualizar",
        description: "No se pudo actualizar la compra. Inténtalo de nuevo.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateAll]);

  return {
    formData,
    errors,
    isLoading,
    handleChange,
    handleBlur,
    handleSubmit,
    setFormData,
  };
}
