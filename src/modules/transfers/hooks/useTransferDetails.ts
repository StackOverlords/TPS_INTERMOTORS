import { useState, useCallback } from "react";
import type { TransferDetailCreate, UITransferDetailCreate } from "../types/transferCreate.types";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import type { ProductStock } from "@/modules/products/types/productStock";

export const useTransferDetails = (
    options: { initialDetails?: UITransferDetailCreate[] } = {}
) => {
    const [details, setDetails] = useState<UITransferDetailCreate[]>(() => options.initialDetails ?? []);

    // Añadir un producto al detalle.
    // Si se proveen `lots` (FIFO, más antiguo primero), se crea UNA sola fila con el saldo
    // total disponible. El split por lote ocurre internamente en getTransferDetails al enviar.
    const addProduct = useCallback((product: ProductGet, tcTransfer: number = 0, lots?: ProductStock[]) => {
        setDetails((prev) => {
            if (lots && lots.length > 0) {
                // Si el producto ya está, no duplicar
                if (prev.some((d) => d.producto_id === product.id && d.lots !== undefined)) return prev;

                const totalSaldo = lots.reduce((sum, lot) => sum + lot.saldo, 0);
                const oldestLot = lots[0];

                const newRow: UITransferDetailCreate = {
                    producto_id: product.id,
                    cantidad_entrada_salida: totalSaldo,
                    costo_entrada: oldestLot.costo,
                    precio_salida: product.precio_venta,
                    // Default de display por-lote (más antiguo). El envío real
                    // re-parte por lote en getTransferDetails con lot.precio_venta.
                    precio_entrada_venta: oldestLot.precio_venta,
                    precio_entrada_venta_alt: oldestLot.precio_venta_alt,
                    incremento_p_entrada_venta: 0,
                    incremento_p_entrada_venta_alt: 0,
                    tc_transfer: oldestLot.tc_compra || tcTransfer,
                    purchase_id: oldestLot.id,
                    lots,
                    total_saldo: totalSaldo,
                    product: {
                        id: product.id,
                        descripcion: product.descripcion,
                        codigo_oem: product.codigo_oem,
                        codigo_upc: product.codigo_upc,
                        marca: product.marca || null,
                        costo: oldestLot.costo,
                        precio_venta: product.precio_venta,
                        precio_venta_alt: product.precio_venta_alt,
                    },
                };
                return [...prev, newRow];
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
            prev.map((d) => {
                if (!(d.producto_id === producto_id && d.purchase_id === purchase_id)) return d;
                const max = d.total_saldo ?? cantidad;
                return { ...d, cantidad_entrada_salida: Math.min(cantidad, max) };
            })
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

    // Obtener detalles para el backend. Filas con `lots` se expanden en múltiples
    // filas FIFO (una por lote consumido), cada una con su costo_entrada real.
    const getTransferDetails = useCallback((): TransferDetailCreate[] => {
        return details.flatMap(({ product, purchase_id, lots, total_saldo, ...base }) => {
            if (!lots || lots.length === 0) return [base];

            let remaining = base.cantidad_entrada_salida;
            const rows: TransferDetailCreate[] = [];
            for (const lot of lots) {
                if (remaining <= 0) break;
                const take = Math.min(remaining, lot.saldo);
                rows.push({
                    ...base,
                    cantidad_entrada_salida: take,
                    costo_entrada: lot.costo,
                    // Precio de venta POR LOTE (simétrico con el costo). Antes se
                    // heredaba de `base` (precio global del producto), lo que aplanaba
                    // el precio real de cada lote en el destino.
                    precio_entrada_venta: lot.precio_venta,
                    precio_entrada_venta_alt: lot.precio_venta_alt,
                    tc_transfer: lot.tc_compra || base.tc_transfer,
                    fecha_adquisicion: lot.fecha_adquisicion,
                });
                remaining -= take;
            }
            return rows;
        });
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
