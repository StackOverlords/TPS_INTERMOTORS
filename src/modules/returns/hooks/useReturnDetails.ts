import { useState, useCallback } from "react";
import type { ReturnDetailCreate, UIReturnDetailCreate } from "../types/returnCreate.types";
import type { ReturnDetailUpdate, UIReturnDetailUpdate } from "../types/returnUpdate.types";
import type { SaleItemGetById } from "@/modules/sales/types/salesGetResponse";

type ReturnDetailUnion = UIReturnDetailCreate | UIReturnDetailUpdate;

export const useReturnDetails = <T extends ReturnDetailUnion = UIReturnDetailCreate>(isEditMode: boolean = false) => {
    const [details, setDetails] = useState<T[]>([]);
    // const [selectedSales, setSelectedSales] = useState<number[]>([])

    // Añadir un producto al detalle
    const addProduct = useCallback((detail: SaleItemGetById, saleId: number) => {
        setDetails((prev) => {
            // Verificar si el producto ya existe
            const exists = prev.find((d) => d.almacen_out_det_id === detail.id);
            if (exists) {
                // Si ya existe, incrementar cantidad
                return prev.map((d) =>
                    d.almacen_out_det_id === detail.id
                        ? { ...d, cantidad: d.cantidad + 1 }
                        : d
                );
            }

            // Crear nuevo detalle
            const newDetail: any = {
                almacen_out_det_id: detail.id,
                cantidad: 1,
                precio: detail.precio - detail.descuento,
                comentario: "",
                // orden: prev.length,
                product: {
                    id: detail.producto.id,
                    descripcion: detail.producto.descripcion,
                    codigo_oem: detail.producto.codigo_oem,
                    codigo_upc: detail.producto.codigo_upc,
                    precio_venta: detail.producto.precio_venta,
                },
                sale_id: saleId,
            };

            // Si es modo edición, añadir almacen_out_dev_det_id como null (nuevo producto)
            if (isEditMode) {
                newDetail.almacen_out_dev_det_id = null;
            }

            return [...prev, newDetail as T];
        });

        // setSelectedSales(
        //     (prev) => {
        //         const exists = prev.includes(saleId);
        //         if (!exists) {
        //             return [...prev, saleId];
        //         }
        //         return prev;
        //     }
        // )
    }, [isEditMode]);

    // Eliminar un producto del detalle
    const removeProduct = useCallback((id_detalle: number) => {
        setDetails((prev) => {
            const filtered = prev.filter((d) => d.almacen_out_det_id !== id_detalle);
            // Reordenar los índices
            return filtered.map((d, index) => ({ ...d, orden: index }));
        });

    }, []);

    // Modificar cantidad
    const updateCantidad = useCallback((id_detalle: number, cantidad: number) => {
        if (cantidad <= 0) return;
        setDetails((prev) =>
            prev.map((d) =>
                d.almacen_out_det_id === id_detalle ? { ...d, cantidad } : d
            )
        );
    }, []);

    // Modificar costo
    const updatePrecio = useCallback((id_detalle: number, precio: number) => {
        setDetails((prev) =>
            prev.map((d) => {
                if (d.almacen_out_det_id !== id_detalle) return d;

                return {
                    ...d,
                    precio,
                };
            })
        );
    }, []);

    // Modificar comentario
    const updateComentario = useCallback((id_detalle: number, comentario: string) => {
        setDetails((prev) =>
            prev.map((d) => {
                if (d.almacen_out_det_id !== id_detalle) return d;

                return {
                    ...d,
                    comentario,
                };
            })
        );
    }, []);

    /**
     * Obtiene el total de la devolucion sumando los totales de cada detalle
     */
    const getTotal = useCallback((): number => {
        return details.reduce((sum, detail) => {
            return sum + detail.cantidad * detail.precio;
        }, 0);
    }, [details]);


    // Obtener detalles en formato sin product
    const getReturnDetails = useCallback((): T extends UIReturnDetailUpdate ? ReturnDetailUpdate[] : ReturnDetailCreate[] => {
        return details.map(({ product, sale_id, ...detail }) => detail) as any;
    }, [details]);

    // Limpiar todos los detalles
    const clearDetails = useCallback(() => {
        setDetails([]);
    }, []);

    // Establecer detalles completos (útil para edición)
    const setReturnDetails = useCallback((newDetails: T[]) => {
        setDetails(newDetails);
    }, []);

    return {
        // Estado
        details,

        // Métodos
        addProduct,
        removeProduct,
        updateCantidad,
        updatePrecio,
        updateComentario,
        getReturnDetails,
        clearDetails,
        setReturnDetails,
        getTotal,
    };
};