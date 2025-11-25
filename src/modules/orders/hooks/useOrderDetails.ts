import { useState, useCallback } from "react";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import type { OrderDetailCreate, UIOrderDetailCreate } from "../types/orderCreate.types";
import type { OrderDetailUpdate, UIOrderDetailUpdate } from "../types/orderUpdate.types";

const DEFAULT_INC_P_VENTA = 30; // 30%
const DEFAULT_INC_P_VENTA_ALT = 15; // 15%

type OrderDetailUnion = UIOrderDetailCreate | UIOrderDetailUpdate;

export const useOrderDetails = <T extends OrderDetailUnion = UIOrderDetailCreate>(isEditMode: boolean = false) => {
    const [details, setDetails] = useState<T[]>([]);

    // Función auxiliar para calcular precio basado en costo e incremento
    const calcularPrecioDesdeIncremento = (costo: number, incremento: number): number => {
        return costo * (1 + incremento / 100);
    };

    // Función auxiliar para calcular incremento basado en costo y precio
    const calcularIncrementoDesdePrecios = (base: number, precio: number): number => {
        if (base === 0) return 0;
        return ((precio - base) / base) * 100;
    };

    // Añadir un producto al detalle
    const addProduct = useCallback((product: ProductGet) => {
        setDetails((prev) => {
            // Verificar si el producto ya existe
            const exists = prev.find((d) => d.id_producto === product.id);
            if (exists) {
                // Si ya existe, incrementar cantidad
                return prev.map((d) =>
                    d.id_producto === product.id
                        ? { ...d, cantidad: d.cantidad + 1 }
                        : d
                );
            }

            // Calcular precios iniciales con incrementos por defecto
            const costo = product.precio_venta || 0;
            const precio_venta = calcularPrecioDesdeIncremento(costo, DEFAULT_INC_P_VENTA);
            const precio_venta_alt = calcularPrecioDesdeIncremento(precio_venta, DEFAULT_INC_P_VENTA_ALT);

            // Crear nuevo detalle
            const newDetail: any = {
                id_producto: product.id,
                cantidad: 1,
                costo,
                inc_p_venta: DEFAULT_INC_P_VENTA,
                precio_venta,
                inc_p_venta_alt: DEFAULT_INC_P_VENTA_ALT,
                precio_venta_alt,
                orden: prev.length,
                product: {
                    id: product.id,
                    descripcion: product.descripcion,
                    codigo_oem: product.codigo_oem,
                    codigo_upc: product.codigo_upc,
                    precio_venta: product.precio_venta,
                },
            };

            // Si es modo edición, añadir id_detalle_pedido como null (nuevo producto)
            if (isEditMode) {
                newDetail.id_detalle_pedido = null;
            }

            return [...prev, newDetail as T];
        });
    }, [isEditMode]);

    // Añadir múltiples productos al detalle
    const addMultipleProducts = useCallback((products: Array<ProductGet & { quantity?: number }>): number[] => {
        const addedProductIds: number[] = [];

        setDetails((prev) => {
            let newDetails = [...prev];

            products.forEach((product) => {
                // Verificar si el producto ya existe
                const existingIndex = newDetails.findIndex((d) => d.id_producto === product.id);

                if (existingIndex !== -1) {
                    // Si ya existe, incrementar cantidad
                    newDetails = newDetails.map((d, idx) =>
                        idx === existingIndex
                            ? { ...d, cantidad: d.cantidad + (product.quantity ?? 1) }
                            : d
                    );
                } else {
                    // Si no existe, crear nuevo detalle
                    const costo = product.precio_venta || 0;
                    const precio_venta = calcularPrecioDesdeIncremento(costo, DEFAULT_INC_P_VENTA);
                    const precio_venta_alt = calcularPrecioDesdeIncremento(precio_venta, DEFAULT_INC_P_VENTA_ALT);

                    const newDetail: any = {
                        id_producto: product.id,
                        cantidad: product.quantity,
                        costo,
                        inc_p_venta: DEFAULT_INC_P_VENTA,
                        precio_venta,
                        inc_p_venta_alt: DEFAULT_INC_P_VENTA_ALT,
                        precio_venta_alt,
                        orden: newDetails.length,
                        product: {
                            id: product.id,
                            descripcion: product.descripcion,
                            codigo_oem: product.codigo_oem,
                            codigo_upc: product.codigo_upc,
                            precio_venta: product.precio_venta,
                        },
                    };

                    // Si es modo edición, añadir id_detalle_pedido como null (nuevo producto)
                    if (isEditMode) {
                        newDetail.id_detalle_pedido = null;
                    }

                    newDetails.push(newDetail as T);
                    addedProductIds.push(product.id);
                }
            });

            // Reordenar los índices
            return newDetails.map((d, index) => ({ ...d, orden: index }));
        });

        return addedProductIds;
    }, [isEditMode]);

    // Eliminar un producto del detalle
    const removeProduct = useCallback((id_producto: number) => {
        setDetails((prev) => {
            const filtered = prev.filter((d) => d.id_producto !== id_producto);
            // Reordenar los índices
            return filtered.map((d, index) => ({ ...d, orden: index }));
        });
    }, []);

    // Modificar cantidad
    const updateCantidad = useCallback((id_producto: number, cantidad: number) => {
        const cantidadNum = Number(cantidad);
        if (cantidadNum <= 0 || isNaN(cantidadNum)) return;
        setDetails((prev) =>
            prev.map((d) =>
                d.id_producto === id_producto ? { ...d, cantidad: cantidadNum } : d
            )
        );
    }, []);

    // Modificar costo (recalcula todo en cascada)
    const updateCosto = useCallback((id_producto: number, costo: number) => {
        const costoNum = Number(costo);
        if (isNaN(costoNum)) return;

        setDetails((prev) =>
            prev.map((d) => {
                if (d.id_producto !== id_producto) return d;

                // Recalcular precio_venta manteniendo el incremento actual
                const precio_venta = calcularPrecioDesdeIncremento(costoNum, d.inc_p_venta);

                // Recalcular precio_venta_alt manteniendo el incremento alternativo actual
                const precio_venta_alt = calcularPrecioDesdeIncremento(precio_venta, d.inc_p_venta_alt);

                return {
                    ...d,
                    costo: costoNum,
                    precio_venta,
                    precio_venta_alt,
                };
            })
        );
    }, []);

    // Modificar incremento de precio venta (recalcula precio_venta y cascada)
    const updateIncPVenta = useCallback((id_producto: number, inc_p_venta: number) => {
        const incNum = Number(inc_p_venta);
        if (isNaN(incNum)) return;

        setDetails((prev) =>
            prev.map((d) => {
                if (d.id_producto !== id_producto) return d;

                // Recalcular precio_venta basado en el nuevo incremento
                const precio_venta = calcularPrecioDesdeIncremento(d.costo, incNum);

                // Recalcular precio_venta_alt manteniendo el incremento alternativo
                const precio_venta_alt = calcularPrecioDesdeIncremento(precio_venta, d.inc_p_venta_alt);

                return {
                    ...d,
                    inc_p_venta: incNum,
                    precio_venta,
                    precio_venta_alt,
                };
            })
        );
    }, []);

    // Modificar precio venta (recalcula incremento y cascada)
    const updatePrecioVenta = useCallback((id_producto: number, precio_venta: number) => {
        const precioNum = Number(precio_venta);
        if (isNaN(precioNum)) return;

        setDetails((prev) =>
            prev.map((d) => {
                if (d.id_producto !== id_producto) return d;

                // Recalcular incremento basado en el nuevo precio
                const inc_p_venta = calcularIncrementoDesdePrecios(d.costo, precioNum);

                // Recalcular precio_venta_alt manteniendo el incremento alternativo
                const precio_venta_alt = calcularPrecioDesdeIncremento(precioNum, d.inc_p_venta_alt);

                return {
                    ...d,
                    inc_p_venta,
                    precio_venta: precioNum,
                    precio_venta_alt,
                };
            })
        );
    }, []);

    // Modificar incremento alternativo (recalcula precio_venta_alt)
    const updateIncPVentaAlt = useCallback((id_producto: number, inc_p_venta_alt: number) => {
        const incAltNum = Number(inc_p_venta_alt);
        if (isNaN(incAltNum)) return;

        setDetails((prev) =>
            prev.map((d) => {
                if (d.id_producto !== id_producto) return d;

                // Recalcular precio_venta_alt basado en precio_venta y el nuevo incremento
                const precio_venta_alt = calcularPrecioDesdeIncremento(d.precio_venta, incAltNum);

                return {
                    ...d,
                    inc_p_venta_alt: incAltNum,
                    precio_venta_alt,
                };
            })
        );
    }, []);

    // Modificar precio venta alternativo (recalcula incremento alternativo)
    const updatePrecioVentaAlt = useCallback((id_producto: number, precio_venta_alt: number) => {
        const precioAltNum = Number(precio_venta_alt);
        if (isNaN(precioAltNum)) return;

        setDetails((prev) =>
            prev.map((d) => {
                if (d.id_producto !== id_producto) return d;

                // Recalcular incremento alternativo basado en el nuevo precio
                const inc_p_venta_alt = calcularIncrementoDesdePrecios(d.precio_venta, precioAltNum);

                return {
                    ...d,
                    inc_p_venta_alt,
                    precio_venta_alt: precioAltNum,
                };
            })
        );
    }, []);

    /**
     * Obtiene el total del pedido sumando los totales de cada detalle
     */
    const getTotalCosto = useCallback((): number => {
        return details.reduce((sum, detail) => {
            return sum + detail.cantidad * detail.costo;
        }, 0);
    }, [details]);

    /**
     * Obtiene el total alternativo del pedido sumando los totales alternativos de cada detalle
     */
    const getTotalAlt = useCallback((): number => {
        return details.reduce((sum, detail) => {
            return sum + detail.cantidad * detail.precio_venta_alt;
        }, 0);
    }, [details]);

    // Obtener detalles en formato OrderDetailCreate o OrderDetailUpdate (sin product)
    const getOrderDetails = useCallback((): T extends UIOrderDetailUpdate ? OrderDetailUpdate[] : OrderDetailCreate[] => {
        return details.map(({ product, ...detail }) => ({
            ...detail,
            // Asegurar que todos los campos numéricos sean números
            id_producto: Number(detail.id_producto),
            cantidad: Number(detail.cantidad),
            costo: Number(detail.costo),
            inc_p_venta: Number(detail.inc_p_venta),
            precio_venta: Number(detail.precio_venta),
            inc_p_venta_alt: Number(detail.inc_p_venta_alt),
            precio_venta_alt: Number(detail.precio_venta_alt),
            orden: Number(detail.orden),
        })) as any;
    }, [details]);

    // Limpiar todos los detalles
    const clearDetails = useCallback(() => {
        setDetails([]);
    }, []);

    // Establecer detalles completos (útil para edición)
    const setOrderDetails = useCallback((newDetails: T[]) => {
        setDetails(newDetails);
    }, []);

    return {
        // Estado
        details,

        // Métodos
        addProduct,
        addMultipleProducts,
        removeProduct,
        updateCantidad,
        updateCosto,
        updateIncPVenta,
        updatePrecioVenta,
        updateIncPVentaAlt,
        updatePrecioVentaAlt,
        getOrderDetails,
        clearDetails,
        setOrderDetails,
        getTotalCosto,
        getTotalAlt,
    };
};