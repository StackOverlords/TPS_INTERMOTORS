import { toast } from "@/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import type { PurchaseDetail } from "../types/PurchaseDetail";
import type { FormData } from "./usePurchaseForm";
import { usePurchaseUpdate } from "./usePurchaseUpdate";

export function usePurchaseEdit(initialData?: PurchaseDetail) {
  const updateMutation = usePurchaseUpdate();
  const isLoading = updateMutation.isPending;
  const [formData, setFormData] = useState<FormData>({
    fecha: "",
    nro_comprobante: "",
    nro_comprobante2: "",
    id_proveedor: null,
    tipo_compra: "",
    forma_compra: "",
    comentario: "",
    usuario: 1,
    sucursal: 1,
    detalles: [],
    id_responsable: null,
    id_pedido: null,
  });

  // Poblar formulario con datos existentes
  useEffect(() => {
    if (initialData) {
      // Manejar ambos formatos de fecha: "2026-01-03T00:00:00" o "2026-01-03 00:00:00"
      const formattedFecha = initialData.fecha 
        ? initialData.fecha.split('T')[0].split(' ')[0] 
        : "";
      
      setFormData({
        fecha: formattedFecha,
        nro_comprobante: (initialData as any).comprobante || "",
        nro_comprobante2: (initialData as any).comprobante2 || "",
        id_proveedor: initialData.proveedor?.id || null,
        tipo_compra: initialData.tipo_compra || "",
        forma_compra: initialData.forma_compra || "",
        comentario: (initialData as any).comentarios || "",
        usuario: 1,
        sucursal: 1,
        detalles: initialData.detalles || [],
        id_responsable: initialData.responsable?.id || null,
        id_pedido: (initialData as any).id_pedido || null,
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

    try {
      const dataToSend = {
        ...formData,
        usuario: formData.usuario || 1,
        sucursal: formData.sucursal || 1,
        id_responsable: formData.id_responsable || 1,
        detalles: formData.detalles.map((detalle) => {
          const isExistingDetail = detalle.id || detalle.id_detalle_compra;

          if (isExistingDetail) {
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
              fecha_mod_precio: detalle.fecha_mod_precio || new Date().toISOString(),
              tc_compra: Number(detalle.tc_compra || 6.96)
            };

            if (isNaN(transformedDetalle.inc_p_venta)) transformedDetalle.inc_p_venta = 0;
            if (isNaN(transformedDetalle.inc_p_venta_alt)) transformedDetalle.inc_p_venta_alt = 0;
            if (isNaN(transformedDetalle.cantidad)) transformedDetalle.cantidad = 1;
            if (isNaN(transformedDetalle.costo)) transformedDetalle.costo = 0;
            if (isNaN(transformedDetalle.precio_venta)) transformedDetalle.precio_venta = 0;
            if (isNaN(transformedDetalle.precio_venta_alt)) transformedDetalle.precio_venta_alt = 0;
            if (isNaN(transformedDetalle.tc_compra)) transformedDetalle.tc_compra = 6.96;

            return transformedDetalle;
          } else {
            const cantidad = typeof detalle.cantidad === 'string' ? parseFloat(detalle.cantidad) : detalle.cantidad;
            const costo = typeof detalle.costo === 'string' ? parseFloat(detalle.costo) : detalle.costo;
            const incPVenta = Number(detalle.inc_p_venta || detalle.inc_precio_venta || 0);
            const precioVenta = typeof detalle.precio_venta === 'string' ? parseFloat(detalle.precio_venta) : detalle.precio_venta;
            const incPVentaAlt = Number(detalle.inc_p_venta_alt || detalle.inc_precio_venta_alt || 0);
            const precioVentaAlt = typeof detalle.precio_venta_alt === 'string' ? parseFloat(detalle.precio_venta_alt) : detalle.precio_venta_alt;

            const transformedDetalle = {
              id_detalle_compra: null,
              id_producto: detalle.producto?.id || parseInt(detalle.id_producto || '0'),
              cantidad: Number(cantidad),
              costo: Number(costo),
              inc_p_venta: incPVenta,
              precio_venta: Number(precioVenta),
              inc_p_venta_alt: incPVentaAlt,
              precio_venta_alt: Number(precioVentaAlt),
              moneda: detalle.moneda || 'BOB ',
              tc_compra: Number(detalle.tc_compra || 6.96)
            };

            if (isNaN(transformedDetalle.inc_p_venta)) transformedDetalle.inc_p_venta = 0;
            if (isNaN(transformedDetalle.inc_p_venta_alt)) transformedDetalle.inc_p_venta_alt = 0;
            if (isNaN(transformedDetalle.cantidad)) transformedDetalle.cantidad = 1;
            if (isNaN(transformedDetalle.costo)) transformedDetalle.costo = 0;
            if (isNaN(transformedDetalle.precio_venta)) transformedDetalle.precio_venta = 0;
            if (isNaN(transformedDetalle.precio_venta_alt)) transformedDetalle.precio_venta_alt = 0;
            if (isNaN(transformedDetalle.tc_compra)) transformedDetalle.tc_compra = 6.96;

            return transformedDetalle;
          }
        })
      };

      await updateMutation.mutateAsync({ id: purchaseId, data: dataToSend });

      toast({
        title: "Compra actualizada",
        description: "La compra se ha actualizado correctamente.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error al actualizar",
        description: "No se pudo actualizar la compra. Inténtalo de nuevo.",
        variant: "destructive"
      });
      return false;
    }
  }, [formData, validateAll, updateMutation]);

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