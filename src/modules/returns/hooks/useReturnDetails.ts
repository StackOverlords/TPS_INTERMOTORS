import { useState, useCallback } from "react";
import type { ReturnDetailCreate, UIReturnDetailCreate } from "../types/returnCreate.types";
import type { ReturnDetailUpdate, UIReturnDetailUpdate } from "../types/returnUpdate.types";
import type { SaleItemGetById } from "@/modules/sales/types/salesGetResponse";
import { showErrorToast, showWarningToast } from "@/hooks/use-toast-enhanced";

type ReturnDetailUnion = UIReturnDetailCreate | UIReturnDetailUpdate;

export interface ProductMinimal {
    id: number;
    descripcion: string;
    codigo_oem: string | null;
    codigo_upc: string | null;
    precio_venta: number;
}

export interface SaleItemForUse extends Omit<SaleItemGetById, 'producto'> {
    producto: ProductMinimal;
}

export const useReturnDetails = <T extends ReturnDetailUnion = UIReturnDetailCreate>(isEditMode: boolean = false) => {
    const [details, setDetails] = useState<T[]>([]);

    /**
     * Agregar un solo producto al detalle
     * Retorna el ID del detalle agregado para enfocar el input
     */
    const addProduct = useCallback((detail: SaleItemForUse, saleId: number): number => {
        let addedId = detail.id;

        setDetails((prev) => {
            // Verificar si el producto ya existe
            const exists = prev.find((d) => d.almacen_out_det_id === detail.id);
            
            if (exists) {
                showWarningToast({
                    title: 'Producto ya agregado',
                    description: `${detail.producto.descripcion} ya está en la lista. Se incrementó la cantidad.`,
                    duration: 3000
                });
                
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

        return addedId;
    }, [isEditMode]);

    /**
     * Agregar múltiples productos al detalle
     * Retorna array de IDs de los detalles agregados para enfocar el input
     */
    const addMultipleProducts = useCallback((
        items: UIReturnDetailCreate[]
    ): number[] => {
        const addedIds: number[] = [];

        setDetails(prev => {
            const newDetails = [...prev];
            
            items.forEach(item => {
                const exists = newDetails.find(d => d.almacen_out_det_id === item.almacen_out_det_id);
                
                if (!exists) {
                    const newDetail: any = {
                        almacen_out_det_id: item.almacen_out_det_id,
                        cantidad: item.cantidad || 1,
                        precio: item.precio,
                        comentario: item.comentario || '',
                        product: {
                            id: item.product.id,
                            descripcion: item.product.descripcion,
                            codigo_oem: item.product.codigo_oem,
                            codigo_upc: item.product.codigo_upc,
                            precio_venta: item.product.precio_venta || 0,
                        },
                        sale_id: item.sale_id,
                    };

                    // Si es modo edición, añadir almacen_out_dev_det_id como null
                    if (isEditMode) {
                        newDetail.almacen_out_dev_det_id = null;
                    }

                    newDetails.push(newDetail as T);
                    addedIds.push(item.almacen_out_det_id);
                } else {
                    // Si ya existe, incrementar cantidad
                    const index = newDetails.findIndex(d => d.almacen_out_det_id === item.almacen_out_det_id);
                    if (index !== -1) {
                        newDetails[index] = {
                            ...newDetails[index],
                            cantidad: newDetails[index].cantidad + (item.cantidad || 1)
                        };
                    }
                }
            });

            return newDetails;
        });

        return addedIds;
    }, [isEditMode]);

    /**
     * Eliminar un producto del detalle
     */
    const removeProduct = useCallback((id_detalle: number) => {
        setDetails((prev) => {
            const filtered = prev.filter((d) => d.almacen_out_det_id !== id_detalle);
            return filtered;
        });
    }, []);

    /**
     * Modificar cantidad
     */
    const updateCantidad = useCallback((id_detalle: number, cantidad: number) => {
        if (cantidad <= 0) {
            showErrorToast({
                title: 'Cantidad inválida',
                description: 'La cantidad debe ser mayor a 0',
                duration: 3000
            });
            return;
        }

        setDetails((prev) =>
            prev.map((d) =>
                d.almacen_out_det_id === id_detalle ? { ...d, cantidad } : d
            )
        );
    }, []);

    /**
     * Modificar precio
     */
    const updatePrecio = useCallback((id_detalle: number, precio: number) => {
        if (precio < 0) {
            showErrorToast({
                title: 'Precio inválido',
                description: 'El precio no puede ser negativo',
                duration: 3000
            });
            return;
        }

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

    /**
     * Modificar comentario
     */
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
     * Obtiene el total de la devolución sumando los totales de cada detalle
     */
    const getTotal = useCallback((): number => {
        return details.reduce((sum, detail) => {
            return sum + detail.cantidad * detail.precio;
        }, 0);
    }, [details]);

    /**
     * Obtener detalles en formato sin product (para enviar al backend)
     */
    const getReturnDetails = useCallback((): T extends UIReturnDetailUpdate ? ReturnDetailUpdate[] : ReturnDetailCreate[] => {
        return details.map(({ product, sale_id, ...detail }) => detail) as any;
    }, [details]);

    /**
     * Limpiar todos los detalles
     */
    const clearDetails = useCallback(() => {
        setDetails([]);
    }, []);

    /**
     * Establecer detalles completos (útil para edición)
     */
    const setReturnDetails = useCallback((newDetails: T[]) => {
        setDetails(newDetails);
    }, []);

    /**
     * Verificar si un detalle específico existe
     */
    const hasDetail = useCallback((almacenOutDetId: number): boolean => {
        return details.some(d => d.almacen_out_det_id === almacenOutDetId);
    }, [details]);

    /**
     * Obtener cantidad de productos únicos
     */
    const getProductCount = useCallback((): number => {
        return details.length;
    }, [details]);

    /**
     * Obtener cantidad total de items (suma de todas las cantidades)
     */
    const getTotalItems = useCallback((): number => {
        return details.reduce((sum, detail) => sum + detail.cantidad, 0);
    }, [details]);

    return {
        // Estado
        details,

        // Métodos CRUD
        addProduct,
        addMultipleProducts,
        removeProduct,
        updateCantidad,
        updatePrecio,
        updateComentario,

        // Métodos de consulta
        getReturnDetails,
        getTotal,
        hasDetail,
        getProductCount,
        getTotalItems,

        // Métodos de gestión
        clearDetails,
        setReturnDetails,
    };
};