import { showErrorToast, showSuccessToast } from '@/hooks/use-toast-enhanced';
import type { ProductGet } from '@/modules/products/types/ProductGet';
import type { QuotationUpdateDetail } from '@/modules/quotations/types/quotationUpdate.types';
import { useState, useCallback, useEffect } from 'react';

export type DiscountType = 'percentage' | 'amount';

export interface QuotationUpdateDetailUI extends QuotationUpdateDetail {
    codigo_oem?: string;
}

interface UseSaleProductDetailsReturn {
    // Estados
    discountType: DiscountType;
    globalDiscount: number;
    details: QuotationUpdateDetailUI[];

    // Funciones principales
    addProduct: (product: ProductGet | ProductGet[]) => void;
    addMultipleItemsWithQuantity: (products: Array<ProductGet & { quantity?: number }>) => void;
    removeProduct: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    updatePrice: (productId: number, price: number) => void;
    updateDescription: (productId: number, description: string) => void;
    updateBrand: (productId: number, brand: string) => void;
    applyGlobalDiscount: (discount: number, type: DiscountType) => void;
    clearGlobalDiscount: () => void;
    updateCustomSubtotal: (productId: number, customSubtotal: number) => void;

    // Funciones de cálculo
    calculateSubtotal: (detail: QuotationUpdateDetailUI) => number;
    calculateTotal: () => number;
    calculateTotalDiscount: () => number;
    getDiscountPercentage: () => number;
    calculateTotalBeforeDiscount: () => number;

    // Función para inicializar detalles
    initializeDetails: (details: QuotationUpdateDetailUI[]) => void;

    // Función para obtener datos limpios
    getCleanDetailsForSubmit: () => QuotationUpdateDetail[];

    // Setters
    setDiscountType: (type: DiscountType) => void;
    setGlobalDiscount: (discount: number) => void;
}

const useQuotationProductDetails = (): UseSaleProductDetailsReturn => {
    const [discountType, setDiscountType] = useState<DiscountType>('percentage');
    const [globalDiscount, setGlobalDiscount] = useState<number>(0);
    const [hasDiscount, setHasDiscount] = useState<boolean>(false);
    const [details, setDetails] = useState<QuotationUpdateDetailUI[]>([]);

    // Detectar si hay descuentos en los detalles
    useEffect(() => {
        if (details.length <= 0) return;

        const existingDiscount = details.find((p) => p.descuento > 0);
        if (existingDiscount) {
            setHasDiscount(true);
        }
    }, [details]);

    // Función para inicializar detalles (modo edición)
    const initializeDetails = useCallback((initialDetails: QuotationUpdateDetailUI[]) => {
        setDetails(initialDetails);
    }, []);

    // Función para obtener datos limpios sin codigo_oem
    const getCleanDetailsForSubmit = useCallback((): QuotationUpdateDetail[] => {
        return details.map(detail => {
            const { codigo_oem, ...cleanDetail } = detail;
            return cleanDetail;
        });
    }, [details]);

    // Agregar producto(s) sin cantidad específica
    const addProduct = useCallback((input: ProductGet | ProductGet[]) => {
        setDetails(prevDetails => {
            const productsToAdd = Array.isArray(input) ? input : [input];
            const updated = [...prevDetails];
            let addedCount = 0;

            // Buscar si ya existe algún producto con descuento
            const productWithDiscount = prevDetails.find(p => p.descuento > 0 && p.porcentaje_descuento > 0);
            const existingDiscountPercentage = productWithDiscount?.porcentaje_descuento ?? 0;

            productsToAdd.forEach((product) => {
                const existingIndex = updated.findIndex(d => d.id_producto === product.id);

                if (existingIndex !== -1) {
                    // Ya existe, aumentar cantidad en 1
                    const item = updated[existingIndex];
                    const newQuantity = item.cantidad + 1;
                    const newDiscount = (newQuantity * item.precio) * (item.porcentaje_descuento / 100);

                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        cantidad: newQuantity,
                        descuento: newDiscount
                    };
                    addedCount++;
                } else {
                    // Calcular descuento si hay descuento existente
                    let porcentaje_descuento = 0;
                    let descuento = 0;

                    if (hasDiscount && existingDiscountPercentage > 0) {
                        porcentaje_descuento = existingDiscountPercentage;
                        const subtotal = 1 * product.precio_venta;
                        descuento = subtotal * (existingDiscountPercentage / 100);
                    }

                    const composedDescription = [product.categoria, product.medida]
                        .filter((v): v is string => Boolean(v && v.trim()))
                        .join(" ");

                    const newDetail: QuotationUpdateDetailUI = {
                        id_producto: product.id,
                        cantidad: 1,
                        descuento: descuento,
                        porcentaje_descuento: porcentaje_descuento,
                        id_detalle_cotizacion: null,
                        precio: product.precio_venta,
                        descripcion: composedDescription || product.descripcion,
                        nueva_marca: product.marca,
                        orden: updated.length + 1,
                        codigo_oem: product.codigo_oem ?? '',
                    };

                    updated.push(newDetail);
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                const message = Array.isArray(input)
                    ? `${addedCount} producto(s) agregados correctamente`
                    : `${productsToAdd[0].descripcion} agregado correctamente`;

                showSuccessToast({
                    title: Array.isArray(input) ? "Productos agregados" : "Producto agregado",
                    description: message,
                    duration: 3000
                });
            }

            // Reordenar y devolver
            return updated.map((product, index) => ({
                ...product,
                orden: index + 1
            }));
        });
    }, [hasDiscount]);

    // Agregar múltiples productos con cantidad específica
    const addMultipleItemsWithQuantity = useCallback((
        productsToAdd: Array<ProductGet & { quantity?: number }>
    ) => {
        setDetails(prevDetails => {
            const updated = [...prevDetails];
            let addedCount = 0;

            // Buscar si ya existe algún producto con descuento
            const productWithDiscount = prevDetails.find(p => p.descuento > 0 && p.porcentaje_descuento > 0);
            const existingDiscountPercentage = productWithDiscount?.porcentaje_descuento ?? 0;

            productsToAdd.forEach((product) => {
                const quantity = product.quantity || 1;
                const existingIndex = updated.findIndex(d => d.id_producto === product.id);

                if (existingIndex !== -1) {
                    // Ya existe, sumar la cantidad
                    const item = updated[existingIndex];
                    const newQuantity = item.cantidad + quantity;
                    const newDiscount = (newQuantity * item.precio) * (item.porcentaje_descuento / 100);

                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        cantidad: newQuantity,
                        descuento: newDiscount
                    };
                    addedCount++;
                } else {
                    // Producto nuevo
                    let porcentaje_descuento = 0;
                    let descuento = 0;

                    if (hasDiscount && existingDiscountPercentage > 0) {
                        porcentaje_descuento = existingDiscountPercentage;
                        const subtotal = quantity * product.precio_venta;
                        descuento = subtotal * (existingDiscountPercentage / 100);
                    }

                    const composedDescription = [product.categoria, product.medida]
                        .filter((v): v is string => Boolean(v && v.trim()))
                        .join(" ");

                    const newDetail: QuotationUpdateDetailUI = {
                        id_producto: product.id,
                        cantidad: quantity,
                        descuento: descuento,
                        porcentaje_descuento: porcentaje_descuento,
                        id_detalle_cotizacion: null,
                        precio: product.precio_venta,
                        descripcion: composedDescription || product.descripcion,
                        nueva_marca: product.marca,
                        orden: updated.length + 1,
                        codigo_oem: product.codigo_oem ?? '',
                    };

                    updated.push(newDetail);
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                showSuccessToast({
                    title: "Productos agregados",
                    description: `${addedCount} producto(s) agregados correctamente`,
                    duration: 3000
                });
            }

            // Reordenar y devolver
            return updated.map((product, index) => ({
                ...product,
                orden: index + 1
            }));
        });
    }, [hasDiscount]);

    // Quitar producto
    const removeProduct = useCallback((productId: number) => {
        setDetails(prevDetails => {
            if (prevDetails.length <= 1) {
                showErrorToast({
                    title: "No se puede eliminar",
                    description: "Debe haber al menos un producto en la cotización",
                    duration: 3000
                });
                return prevDetails;
            }

            const updated = prevDetails.filter(detail => detail.id_producto !== productId);

            // Reordenar después de eliminar
            return updated.map((product, index) => ({
                ...product,
                orden: index + 1
            }));
        });
    }, []);

    // Actualizar cantidad
    const updateQuantity = useCallback((productId: number, quantity: number) => {
        if (quantity < 1) {
            showErrorToast({
                title: "Cantidad inválida",
                description: "La cantidad debe ser mayor a 0",
                duration: 3000
            });
            return;
        }

        setDetails(prevDetails =>
            prevDetails.map(detail => {
                if (detail.id_producto === productId) {
                    let newDiscount = detail.descuento;
                    if (detail.porcentaje_descuento > 0) {
                        const subtotal = quantity * detail.precio;
                        newDiscount = subtotal * (detail.porcentaje_descuento / 100);
                    }

                    return {
                        ...detail,
                        cantidad: quantity,
                        descuento: newDiscount
                    };
                }
                return detail;
            })
        );
    }, []);

    // Actualizar subtotal personalizado
    const updateCustomSubtotal = useCallback((productId: number, customSubtotal: number) => {
        if (customSubtotal < 1) {
            showErrorToast({
                title: "Monto inválido",
                description: "El monto debe ser mayor a 0",
                duration: 3000
            });
            return;
        }

        setDetails(prevDetails =>
            prevDetails.map(detail => {
                if (detail.id_producto === productId) {
                    const newPrice = customSubtotal / detail.cantidad;
                    let newDiscount = 0;
                    if (detail.porcentaje_descuento > 0) {
                        newDiscount = customSubtotal * (detail.porcentaje_descuento / 100);
                    }

                    return {
                        ...detail,
                        precio: newPrice,
                        descuento: newDiscount
                    };
                }
                return detail;
            })
        );
    }, []);

    // Actualizar precio
    const updatePrice = useCallback((productId: number, price: number) => {
        if (price < 0) {
            showErrorToast({
                title: "Precio inválido",
                description: "El precio no puede ser negativo",
                duration: 3000
            });
            return;
        }

        setDetails(prevDetails =>
            prevDetails.map(detail => {
                if (detail.id_producto === productId) {
                    let newDiscount = detail.descuento;
                    if (detail.porcentaje_descuento > 0) {
                        const subtotal = detail.cantidad * price;
                        newDiscount = subtotal * (detail.porcentaje_descuento / 100);
                    }

                    return {
                        ...detail,
                        precio: price,
                        descuento: newDiscount
                    };
                }
                return detail;
            })
        );
    }, []);

    const updateDescription = useCallback((productId: number, description: string) => {
        setDetails(prevDetails =>
            prevDetails.map(d => {
                if (d.id_producto === productId) {
                    return { ...d, descripcion: description };
                }
                return d;
            })
        );
    }, []);

    const updateBrand = useCallback((productId: number, brand: string) => {
        setDetails(prevDetails =>
            prevDetails.map(d => {
                if (d.id_producto === productId) {
                    return { ...d, nueva_marca: brand };
                }
                return d;
            })
        );
    }, []);

    // Aplicar descuento global
    const applyGlobalDiscount = useCallback((discount: number, type: DiscountType) => {
        if (discount < 0) {
            showErrorToast({
                title: "Descuento inválido",
                description: "El descuento no puede ser negativo",
                duration: 3000
            });
            return;
        }

        setDetails(prevDetails => {
            if (prevDetails.length === 0) {
                showErrorToast({
                    title: "Sin productos",
                    description: "No hay productos para aplicar descuento",
                    duration: 3000
                });
                return prevDetails;
            }

            let updated: QuotationUpdateDetailUI[];

            if (type === 'percentage') {
                if (discount > 100) {
                    showErrorToast({
                        title: "Descuento inválido",
                        description: "El descuento porcentual no puede ser mayor a 100%",
                        duration: 3000
                    });
                    return prevDetails;
                }

                updated = prevDetails.map(detail => {
                    const subtotal = detail.cantidad * detail.precio;
                    const discountAmount = subtotal * (discount / 100);

                    return {
                        ...detail,
                        porcentaje_descuento: discount,
                        descuento: discountAmount
                    };
                });
            } else {
                // type === 'amount'
                const totalWithoutDiscount = prevDetails.reduce((acc, detail) => {
                    return acc + (detail.cantidad * detail.precio);
                }, 0);

                if (discount > totalWithoutDiscount) {
                    showErrorToast({
                        title: "Descuento inválido",
                        description: "El descuento no puede ser mayor al total de la cotización",
                        duration: 3000
                    });
                    return prevDetails;
                }

                const discountPercentage = (discount / totalWithoutDiscount) * 100;

                updated = prevDetails.map(detail => {
                    const subtotal = detail.cantidad * detail.precio;
                    const discountAmount = subtotal * (discountPercentage / 100);

                    return {
                        ...detail,
                        porcentaje_descuento: discountPercentage,
                        descuento: discountAmount
                    };
                });
            }

            setDiscountType(type);
            setGlobalDiscount(discount);
            return updated;
        });
    }, []);

    // Limpiar descuento global
    const clearGlobalDiscount = useCallback(() => {
        setDetails(prevDetails =>
            prevDetails.map(detail => ({
                ...detail,
                porcentaje_descuento: 0,
                descuento: 0
            }))
        );
        setGlobalDiscount(0);
    }, []);

    // Calcular subtotal de un producto
    const calculateSubtotal = useCallback((detail: QuotationUpdateDetailUI): number => {
        const subtotal = detail.cantidad * detail.precio;
        return subtotal - detail.descuento;
    }, []);

    // Calcular total de la cotización
    const calculateTotal = useCallback((): number => {
        return details.reduce((acc, detail) => {
            const subtotal = detail.cantidad * detail.precio;
            return acc + (subtotal - detail.descuento);
        }, 0);
    }, [details]);

    // Calcular total de descuentos
    const calculateTotalDiscount = useCallback((): number => {
        return details.reduce((acc, detail) => {
            return acc + detail.descuento;
        }, 0);
    }, [details]);

    const getDiscountPercentage = useCallback((): number => {
        return details.find((p) => p.porcentaje_descuento > 0)?.porcentaje_descuento ?? 0;
    }, [details]);

    const calculateTotalBeforeDiscount = useCallback((): number => {
        return details.reduce((total, detail) => {
            return total + (detail.cantidad * detail.precio);
        }, 0);
    }, [details]);

    return {
        // Estados
        discountType,
        globalDiscount,
        details,

        // Funciones principales
        addProduct,
        addMultipleItemsWithQuantity,
        removeProduct,
        updateQuantity,
        updatePrice,
        updateDescription,
        updateBrand,
        applyGlobalDiscount,
        clearGlobalDiscount,
        updateCustomSubtotal,

        // Funciones de cálculo
        calculateSubtotal,
        calculateTotal,
        calculateTotalDiscount,
        getDiscountPercentage,
        calculateTotalBeforeDiscount,

        // Función para inicializar
        initializeDetails,

        // Función para obtener datos limpios
        getCleanDetailsForSubmit,

        // Setters
        setDiscountType,
        setGlobalDiscount,
    };
};

export default useQuotationProductDetails;