import { useState, useCallback } from "react";
import type { TransferDetailCreate, UITransferDetailCreate } from "../types/transferCreate.types";
import type { ProductGet } from "@/modules/products/types/ProductGet";

export const useTransferDetails = () => {
    const [details, setDetails] = useState<UITransferDetailCreate[]>([]);

    // Añadir un producto al detalle directamente desde ProductGet
    const addProduct = useCallback((product: ProductGet, tcTransfer: number = 0) => {
        setDetails((prev) => {
            // Verificar si el producto ya existe
            const exists = prev.find((d) => d.producto_id === product.id);
            if (exists) {
                // Si ya existe, incrementar cantidad
                return prev.map((d) =>
                    d.producto_id === product.id
                        ? { ...d, cantidad_entrada_salida: d.cantidad_entrada_salida + 1 }
                        : d
                );
            }

            // Crear nuevo detalle con valores por defecto
            // En una transferencia, usamos los precios de venta actuales del producto
            const newDetail: UITransferDetailCreate = {
                producto_id: product.id,
                cantidad_entrada_salida: 1,
                costo_entrada: product.costo_mas_antiguo || 0, // Usar costo más antiguo del producto
                precio_salida: product.precio_venta,
                precio_entrada_venta: product.precio_venta,
                precio_entrada_venta_alt: product.precio_venta_alt,
                incremento_p_entrada_venta: 0,
                incremento_p_entrada_venta_alt: 0,
                tc_transfer: tcTransfer,
                product: {
                    id: product.id,
                    descripcion: product.descripcion,
                    codigo_oem: product.codigo_oem,
                    codigo_upc: product.codigo_upc,
                    marca: product.marca || null,
                    costo: product.costo_mas_antiguo || 0,
                    precio_venta: product.precio_venta,
                    precio_venta_alt: product.precio_venta_alt,
                },
                purchase_id: 0, // Ya no se usa purchase_id, pero se mantiene por compatibilidad
            };

            return [...prev, newDetail];
        });
    }, []);

    // Eliminar un producto del detalle (ahora solo necesita producto_id)
    const removeProduct = useCallback((producto_id: number, _purchase_id?: number) => {
        setDetails((prev) => {
            return prev.filter((d) => d.producto_id !== producto_id);
        });
    }, []);

    // Modificar cantidad (ahora solo necesita producto_id)
    const updateCantidad = useCallback((producto_id: number, _purchase_id: number | undefined, cantidad: number) => {
        if (cantidad <= 0) return;
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id
                    ? { ...d, cantidad_entrada_salida: cantidad }
                    : d
            )
        );
    }, []);

    // Modificar costo de entrada (ahora solo necesita producto_id)
    const updateCostoEntrada = useCallback((producto_id: number, _purchase_id: number | undefined, costo: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id
                    ? { ...d, costo_entrada: costo }
                    : d
            )
        );
    }, []);

    // Modificar precio de salida (ahora solo necesita producto_id)
    const updatePrecioSalida = useCallback((producto_id: number, _purchase_id: number | undefined, precio: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id
                    ? { ...d, precio_salida: precio }
                    : d
            )
        );
    }, []);

    // Modificar precio de entrada venta (ahora solo necesita producto_id)
    const updatePrecioEntradaVenta = useCallback((producto_id: number, _purchase_id: number | undefined, precio: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id
                    ? { ...d, precio_entrada_venta: precio }
                    : d
            )
        );
    }, []);

    // Modificar precio de entrada venta alt (ahora solo necesita producto_id)
    const updatePrecioEntradaVentaAlt = useCallback((producto_id: number, _purchase_id: number | undefined, precio: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id
                    ? { ...d, precio_entrada_venta_alt: precio }
                    : d
            )
        );
    }, []);

    // Modificar incremento precio entrada venta (ahora solo necesita producto_id)
    const updateIncrementoPrecioEntradaVenta = useCallback((producto_id: number, _purchase_id: number | undefined, incremento: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id
                    ? { ...d, incremento_p_entrada_venta: incremento }
                    : d
            )
        );
    }, []);

    // Modificar incremento precio entrada venta alt (ahora solo necesita producto_id)
    const updateIncrementoPrecioEntradaVentaAlt = useCallback((producto_id: number, _purchase_id: number | undefined, incremento: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id
                    ? { ...d, incremento_p_entrada_venta_alt: incremento }
                    : d
            )
        );
    }, []);

    // Modificar tipo de cambio de transferencia
    const updateTcTransfer = useCallback((producto_id: number, tc_transfer: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id
                    ? { ...d, tc_transfer }
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
        updateTcTransfer,
        getTransferDetails,
        clearDetails,
        setTransferDetails,
        getTotal,
    };
};
