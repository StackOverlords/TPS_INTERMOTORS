import { useState, useCallback } from "react";
import type { TransferDetailCreate, UITransferDetailCreate } from "../types/transferCreate.types";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import type { ProductStock } from "@/modules/products/types/productStock";

export const useTransferDetails = () => {
    const [details, setDetails] = useState<UITransferDetailCreate[]>([]);

    // Añadir un producto al detalle directamente desde ProductGet.
    // Si se proveen `lots` (lotes FIFO ordenados de más antiguo a más reciente),
    // se crea una fila por lote con su costo real. Si no, fila única con costo_mas_antiguo.
    const addProduct = useCallback((product: ProductGet, tcTransfer: number = 0, lots?: ProductStock[]) => {
        setDetails((prev) => {
            if (lots && lots.length > 0) {
                // FIFO: una fila por lote disponible (saldo > 0 ya filtrado por el API)
                const newRows: UITransferDetailCreate[] = lots.map((lot) => ({
                    producto_id: product.id,
                    cantidad_entrada_salida: lot.saldo,
                    costo_entrada: lot.costo,
                    precio_salida: product.precio_venta,
                    precio_entrada_venta: product.precio_venta,
                    precio_entrada_venta_alt: product.precio_venta_alt,
                    incremento_p_entrada_venta: 0,
                    incremento_p_entrada_venta_alt: 0,
                    tc_transfer: lot.tc_compra || tcTransfer,
                    purchase_id: lot.id,
                    lot_fecha: lot.fecha_adquisicion,
                    lot_saldo: lot.saldo,
                    product: {
                        id: product.id,
                        descripcion: product.descripcion,
                        codigo_oem: product.codigo_oem,
                        codigo_upc: product.codigo_upc,
                        marca: product.marca || null,
                        costo: lot.costo,
                        precio_venta: product.precio_venta,
                        precio_venta_alt: product.precio_venta_alt,
                    },
                }));
                return [...prev, ...newRows];
            }

            // Sin lotes: fila única (fallback o producto sin stock)
            const exists = prev.find((d) => d.producto_id === product.id && d.purchase_id === 0);
            if (exists) {
                return prev.map((d) =>
                    d.producto_id === product.id && d.purchase_id === 0
                        ? { ...d, cantidad_entrada_salida: d.cantidad_entrada_salida + 1 }
                        : d
                );
            }
            const newDetail: UITransferDetailCreate = {
                producto_id: product.id,
                cantidad_entrada_salida: 1,
                costo_entrada: product.costo_mas_antiguo || 0,
                precio_salida: product.precio_venta,
                precio_entrada_venta: product.precio_venta,
                precio_entrada_venta_alt: product.precio_venta_alt,
                incremento_p_entrada_venta: 0,
                incremento_p_entrada_venta_alt: 0,
                tc_transfer: tcTransfer,
                purchase_id: 0,
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
            };
            return [...prev, newDetail];
        });
    }, []);

    const removeProduct = useCallback((producto_id: number, purchase_id?: number) => {
        setDetails((prev) =>
            prev.filter((d) => !(d.producto_id === producto_id && d.purchase_id === purchase_id))
        );
    }, []);

    const updateCantidad = useCallback((producto_id: number, purchase_id: number | undefined, cantidad: number) => {
        if (cantidad <= 0) return;
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id && d.purchase_id === purchase_id
                    ? { ...d, cantidad_entrada_salida: cantidad }
                    : d
            )
        );
    }, []);

    const updateCostoEntrada = useCallback((producto_id: number, purchase_id: number | undefined, costo: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id && d.purchase_id === purchase_id
                    ? { ...d, costo_entrada: costo }
                    : d
            )
        );
    }, []);

    const updatePrecioSalida = useCallback((producto_id: number, purchase_id: number | undefined, precio: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id && d.purchase_id === purchase_id
                    ? { ...d, precio_salida: precio }
                    : d
            )
        );
    }, []);

    const updatePrecioEntradaVenta = useCallback((producto_id: number, purchase_id: number | undefined, precio: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id && d.purchase_id === purchase_id
                    ? { ...d, precio_entrada_venta: precio }
                    : d
            )
        );
    }, []);

    const updatePrecioEntradaVentaAlt = useCallback((producto_id: number, purchase_id: number | undefined, precio: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id && d.purchase_id === purchase_id
                    ? { ...d, precio_entrada_venta_alt: precio }
                    : d
            )
        );
    }, []);

    const updateIncrementoPrecioEntradaVenta = useCallback((producto_id: number, purchase_id: number | undefined, incremento: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id && d.purchase_id === purchase_id
                    ? { ...d, incremento_p_entrada_venta: incremento }
                    : d
            )
        );
    }, []);

    const updateIncrementoPrecioEntradaVentaAlt = useCallback((producto_id: number, purchase_id: number | undefined, incremento: number) => {
        setDetails((prev) =>
            prev.map((d) =>
                d.producto_id === producto_id && d.purchase_id === purchase_id
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
