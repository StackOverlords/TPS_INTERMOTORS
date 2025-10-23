import { useState, useCallback } from "react";
import type { TransferDetailCreate, UITransferDetailCreate } from "../types/transferCreate.types";
import type { DetalleCompra } from "@/modules/purchases/schemas/purchase.schema";

export const useTransferDetails = () => {
    const [details, setDetails] = useState<UITransferDetailCreate[]>([]);

    // Añadir un producto al detalle
    const addProduct = useCallback((detail: DetalleCompra, purchaseId: number) => {
        setDetails((prev) => {
            // Verificar si el producto ya existe
            const exists = prev.find((d) => d.producto_id === detail.producto.id && d.purchase_id === purchaseId);
            if (exists) {
                // Si ya existe, incrementar cantidad
                return prev.map((d) =>
                    d.producto_id === detail.producto.id && d.purchase_id === purchaseId
                        ? { ...d, cantidad_entrada_salida: d.cantidad_entrada_salida + 1 }
                        : d
                );
            }

            // Convertir strings a números
            const costo = Number.parseFloat(detail.costo);
            const precioVenta = Number.parseFloat(detail.precio_venta);
            const precioVentaAlt = Number.parseFloat(detail.precio_venta_alt);
            const incPrecioVenta = Number.parseFloat(detail.inc_precio_venta);
            const incPrecioVentaAlt = Number.parseFloat(detail.inc_precio_venta_alt);

            // Crear nuevo detalle
            const newDetail: UITransferDetailCreate = {
                producto_id: detail.producto.id,
                cantidad_entrada_salida: 1,
                costo_entrada: costo,
                precio_salida: precioVenta,
                precio_entrada_venta: precioVenta,
                precio_entrada_venta_alt: precioVentaAlt,
                incremento_p_entrada_venta: incPrecioVenta,
                incremento_p_entrada_venta_alt: incPrecioVentaAlt,
                product: {
                    id: detail.producto.id,
                    descripcion: detail.producto.descripcion,
                    codigo_oem: detail.producto.codigo_oem,
                    codigo_upc: detail.producto.codigo_upc,
                    costo: costo,
                    precio_venta: precioVenta,
                    precio_venta_alt: precioVentaAlt,
                },
                purchase_id: purchaseId,
            };

            return [...prev, newDetail];
        });
    }, []);

    // Eliminar un producto del detalle
    const removeProduct = useCallback((producto_id: number, purchase_id: number) => {
        setDetails((prev) => {
            return prev.filter((d) => !(d.producto_id === producto_id && d.purchase_id === purchase_id));
        });
    }, []);

    // Modificar cantidad
    const updateCantidad = useCallback((producto_id: number, purchase_id: number, cantidad: number) => {
        if (cantidad <= 0) return;
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id && d.purchase_id === purchase_id
                    ? { ...d, cantidad_entrada_salida: cantidad }
                    : d
            )
        );
    }, []);

    // Modificar costo de entrada
    const updateCostoEntrada = useCallback((producto_id: number, purchase_id: number, costo: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id && d.purchase_id === purchase_id
                    ? { ...d, costo_entrada: costo }
                    : d
            )
        );
    }, []);

    // Modificar precio de salida
    const updatePrecioSalida = useCallback((producto_id: number, purchase_id: number, precio: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id && d.purchase_id === purchase_id
                    ? { ...d, precio_salida: precio }
                    : d
            )
        );
    }, []);

    // Modificar precio de entrada venta
    const updatePrecioEntradaVenta = useCallback((producto_id: number, purchase_id: number, precio: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id && d.purchase_id === purchase_id
                    ? { ...d, precio_entrada_venta: precio }
                    : d
            )
        );
    }, []);

    // Modificar precio de entrada venta alt
    const updatePrecioEntradaVentaAlt = useCallback((producto_id: number, purchase_id: number, precio: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id && d.purchase_id === purchase_id
                    ? { ...d, precio_entrada_venta_alt: precio }
                    : d
            )
        );
    }, []);

    // Modificar incremento precio entrada venta
    const updateIncrementoPrecioEntradaVenta = useCallback((producto_id: number, purchase_id: number, incremento: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id && d.purchase_id === purchase_id
                    ? { ...d, incremento_p_entrada_venta: incremento }
                    : d
            )
        );
    }, []);

    // Modificar incremento precio entrada venta alt
    const updateIncrementoPrecioEntradaVentaAlt = useCallback((producto_id: number, purchase_id: number, incremento: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id && d.purchase_id === purchase_id
                    ? { ...d, incremento_p_entrada_venta_alt: incremento }
                    : d
            )
        );
    }, []);

    /**
     * Obtiene el total de la transferencia sumando los costos de entrada
     */
    const getTotal = useCallback((): number => {
        return details.reduce((sum, detail) => {
            return sum + detail.cantidad_entrada_salida * detail.costo_entrada;
        }, 0);
    }, [details]);

    // Obtener detalles en formato sin product y purchase_id
    const getTransferDetails = useCallback((): TransferDetailCreate[] => {
        return details.map(({ product, purchase_id, ...detail }) => detail);
    }, [details]);

    // Limpiar todos los detalles
    const clearDetails = useCallback(() => {
        setDetails([]);
    }, []);

    // Establecer detalles completos (útil para edición)
    const setTransferDetails = useCallback((newDetails: UITransferDetailCreate[]) => {
        setDetails(newDetails);
    }, []);

    return {
        // Estado
        details,

        // Métodos
        addProduct,
        removeProduct,
        updateCantidad,
        updateCostoEntrada,
        updatePrecioSalida,
        updatePrecioEntradaVenta,
        updatePrecioEntradaVentaAlt,
        updateIncrementoPrecioEntradaVenta,
        updateIncrementoPrecioEntradaVentaAlt,
        getTransferDetails,
        clearDetails,
        setTransferDetails,
        getTotal,
    };
};
