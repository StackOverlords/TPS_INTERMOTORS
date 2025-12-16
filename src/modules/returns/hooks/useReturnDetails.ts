import { useState, useCallback } from "react";
import type { ReturnDetailCreate, UIReturnDetailCreate } from "../types/returnCreate.types";
import type { ReturnDetailUpdate, UIReturnDetailUpdate } from "../types/returnUpdate.types";
import type { SaleItemGetById } from "@/modules/sales/types/salesGetResponse";
import { showErrorToast, showWarningToast, showSuccessToast } from "@/hooks/use-toast-enhanced";

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

export interface ProductChange {
    almacen_out_det_id: number;
    cantidad: number;
    precio: number;
    comentario: string;
    sale_id: number;
    product: ProductMinimal;
    isNew: boolean;
    maxQuantity: number;
}

export const useReturnDetails = <T extends ReturnDetailUnion = UIReturnDetailCreate>(isEditMode: boolean = false) => {
    const [details, setDetails] = useState<T[]>([]);

    /**
     * Reordenar los detalles secuencialmente a partir de 1
     */
    const reorderDetails = useCallback((items: T[]): T[] => {
        return items.map((item, index) => ({
            ...item,
            orden: index + 1
        }));
    }, []);

    /**
     * Agregar un solo producto al detalle
     * Retorna el ID del detalle agregado para enfocar el input
     */
    const addProduct = useCallback((detail: SaleItemForUse, saleId: number): number => {
        let addedId = detail.id;

        setDetails((prev) => {
            const exists = prev.find((d) => d.almacen_out_det_id === detail.id);

            if (exists) {
                // Validar cantidad máxima
                if (exists.cantidad >= exists.maxQuantity) {
                    showWarningToast({
                        title: 'Cantidad máxima alcanzada',
                        description: `${detail.producto.descripcion} ya tiene la cantidad máxima (${exists.maxQuantity})`,
                        duration: 3000
                    });
                    return prev;
                }

                showWarningToast({
                    title: 'Producto ya agregado',
                    description: `${detail.producto.descripcion} ya está en la lista. Se incrementó la cantidad.`,
                    duration: 3000
                });

                return prev.map((d) =>
                    d.almacen_out_det_id === detail.id
                        ? { ...d, cantidad: Math.min(d.cantidad + 1, d.maxQuantity) }
                        : d
                );
            }

            const newDetail: any = {
                almacen_out_det_id: detail.id,
                cantidad: 1,
                precio: detail.precio - detail.descuento,
                comentario: "",
                orden: prev.length + 1,
                almacen_out_id: saleId,
                product: {
                    id: detail.producto.id,
                    descripcion: detail.producto.descripcion,
                    codigo_oem: detail.producto.codigo_oem,
                    codigo_upc: detail.producto.codigo_upc,
                    precio_venta: detail.producto.precio_venta,
                },
                sale_id: saleId,
                maxQuantity: detail.cantidad,
            };

            if (isEditMode) {
                newDetail.almacen_out_dev_det_id = null;
            }

            return [...prev, newDetail as T];
        });

        return addedId;
    }, [isEditMode]);

    /**
     * Procesar cambios del modal
     * Solo aplica los cambios reales sin reemplazar todo
     */
    const applyModalChanges = useCallback((changes: ProductChange[]) => {
        if (changes.length === 0) return [];

        const addedIds: number[] = [];
        let addedCount = 0;
        let updatedCount = 0;
        let removedCount = 0;

        setDetails(prev => {
            let newDetails = [...prev];

            changes.forEach(change => {
                const existingIndex = newDetails.findIndex(
                    d => d.almacen_out_det_id === change.almacen_out_det_id
                );

                // Cantidad 0 significa eliminar
                if (change.cantidad === 0) {
                    if (existingIndex >= 0) {
                        newDetails.splice(existingIndex, 1);
                        removedCount++;
                    }
                    return;
                }

                // Actualizar existente o agregar nuevo
                if (existingIndex >= 0) {
                    // Solo actualizar si es un cambio real
                    if (change.isNew || newDetails[existingIndex].cantidad !== change.cantidad) {
                        newDetails[existingIndex] = {
                            ...newDetails[existingIndex],
                            cantidad: change.cantidad,
                            precio: change.precio,
                            comentario: change.comentario || newDetails[existingIndex].comentario,
                            maxQuantity: change.maxQuantity,
                        };
                        updatedCount++;
                    }
                } else {
                    // Agregar nuevo item
                    const newDetail: any = {
                        almacen_out_det_id: change.almacen_out_det_id,
                        cantidad: change.cantidad,
                        precio: change.precio,
                        comentario: change.comentario || '',
                        orden: newDetails.length + 1,
                        almacen_out_id: change.sale_id,
                        product: change.product,
                        sale_id: change.sale_id,
                        maxQuantity: change.maxQuantity,
                    };

                    if (isEditMode) {
                        newDetail.almacen_out_dev_det_id = null;
                    }

                    newDetails.push(newDetail as T);
                    addedIds.push(change.almacen_out_det_id);
                    addedCount++;
                }
            });

            // Reordenar después de todos los cambios
            return reorderDetails(newDetails);
        });

        // Mostrar resumen de cambios
        const messages: string[] = [];
        if (addedCount > 0) messages.push(`${addedCount} agregado${addedCount !== 1 ? 's' : ''}`);
        if (updatedCount > 0) messages.push(`${updatedCount} actualizado${updatedCount !== 1 ? 's' : ''}`);
        if (removedCount > 0) messages.push(`${removedCount} eliminado${removedCount !== 1 ? 's' : ''}`);

        if (messages.length > 0) {
            showSuccessToast({
                title: 'Cambios aplicados',
                description: messages.join(', '),
                duration: 3000
            });
        }

        return addedIds;
    }, [isEditMode, reorderDetails]);

    /**
     * Agregar múltiples productos (MANTENER para compatibilidad con ventana)
     */
    const addMultipleProducts = useCallback((
        items: Array<{
            almacen_out_det_id: number;
            cantidad: number;
            precio: number;
            comentario?: string;
            sale_id: number;
            product: {
                id: number;
                descripcion: string;
                codigo_oem: string;
                codigo_upc: string;
                precio_venta?: number;
            };
            maxQuantity: number;
        }>
    ): number[] => {
        const addedIds: number[] = [];

        setDetails(prev => {
            let newDetails = [...prev];

            items.forEach(item => {
                const existingIndex = newDetails.findIndex(d => d.almacen_out_det_id === item.almacen_out_det_id);

                if (existingIndex >= 0) {
                    // ACTUALIZAR (solo si la cantidad es diferente)
                    if (newDetails[existingIndex].cantidad !== item.cantidad) {
                        newDetails[existingIndex] = {
                            ...newDetails[existingIndex],
                            cantidad: item.cantidad,
                            precio: item.precio,
                            comentario: item.comentario || newDetails[existingIndex].comentario,
                            maxQuantity: item.maxQuantity,
                        };
                    }
                } else {
                    // Agregar nuevo item
                    const newDetail: any = {
                        almacen_out_det_id: item.almacen_out_det_id,
                        cantidad: item.cantidad,
                        precio: item.precio,
                        comentario: item.comentario || '',
                        orden: newDetails.length + 1,
                        almacen_out_id: item.sale_id,
                        product: {
                            id: item.product.id,
                            descripcion: item.product.descripcion,
                            codigo_oem: item.product.codigo_oem,
                            codigo_upc: item.product.codigo_upc,
                            precio_venta: item.product.precio_venta || 0,
                        },
                        sale_id: item.sale_id,
                        maxQuantity: item.maxQuantity,
                    };

                    if (isEditMode) {
                        newDetail.almacen_out_dev_det_id = null;
                    }

                    newDetails.push(newDetail as T);
                    addedIds.push(item.almacen_out_det_id);
                }
            });

            // Reordenar después de agregar
            return reorderDetails(newDetails);
        });

        return addedIds;
    }, [isEditMode, reorderDetails]);

    /**
     * Eliminar un producto del detalle
     */
    const removeProduct = useCallback((id_detalle: number) => {
        setDetails((prev) => {
            const filtered = prev.filter((d) => d.almacen_out_det_id !== id_detalle);
            // Reordenar después de eliminar
            return reorderDetails(filtered);
        });
    }, [reorderDetails]);

    /**
     * Modificar cantidad con validación de máximo
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

        setDetails((prev) => {
            return prev.map((d) => {
                if (d.almacen_out_det_id !== id_detalle) return d;

                // Validar contra maxQuantity
                if (cantidad > d.maxQuantity) {
                    showErrorToast({
                        title: 'Cantidad excedida',
                        description: `La cantidad máxima disponible es ${d.maxQuantity}`,
                        duration: 3000
                    });
                    return d; // Mantener valor anterior
                }

                return { ...d, cantidad };
            });
        });
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
                return { ...d, precio };
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
                return { ...d, comentario };
            })
        );
    }, []);

    /**
     * Obtiene el total de la devolución
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
        return details.map(({ product, sale_id, maxQuantity, ...detail }) => detail) as any;
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
        // Asegurar que tengan orden correcto al establecer
        setDetails(reorderDetails(newDetails));
    }, [reorderDetails]);

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
     * Obtener cantidad total de items
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
        applyModalChanges,
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