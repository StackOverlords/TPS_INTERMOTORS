import { useCartStore } from "./useCartStore";
import type { CartProduct, CartSummary, ConversionResult } from "../types/cart.types";
import { useStore } from "zustand";
import { showErrorToast, showInfoToast, showSuccessToast, showWarningToast } from "@/hooks/use-toast-enhanced";
import { CartProductSchema } from "../schemas/cartProduct.schema";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import { useCallback } from "react";

export interface CartOperationResult {
    success: boolean;
    error?: string;
    message: string;
    data?: unknown;
}

export interface BulkAddResult {
    success: boolean;
    totalAdded: number;
    totalFailed: number;
    failedProducts: Array<{
        product: CartProduct;
        reason: string;
        message: string;
    }>;
    message: string;
}

export const useCartWithUtils = (user: string, branch: string) => {
    if (!user) user = "guest";
    const cartStore = useCartStore(`${user}-${branch}`);
    const state = useStore(cartStore, (state) => state);

    // ==================== GESTIÓN DE MODO ====================

    const setCartMode = useCallback((mode: 'sale' | 'quote') => {
        state.setMode(mode);
        showInfoToast({
            title: "Modo cambiado",
            description: mode === 'sale' ? "Modo: Venta" : "Modo: Cotización",
            duration: 3000
        });
    }, [state.setMode]);

    const convertToSaleWithToast = useCallback((): ConversionResult => {
        const result = state.convertToSale();

        if (result.removedItems.length === 0 && result.adjustedItems.length === 0) {
            showSuccessToast({
                title: "Convertido a Venta",
                description: result.message,
                duration: 5000
            });
        } else {
            // Construir mensaje detallado
            const details: string[] = [];

            if (result.removedItems.length > 0) {
                details.push(
                    `${result.removedItems.length} producto${result.removedItems.length > 1 ? 's removido' : ' removido'} sin stock`
                );
            }

            if (result.adjustedItems.length > 0) {
                details.push(
                    `${result.adjustedItems.length} producto${result.adjustedItems.length > 1 ? 's con cantidad ajustada' : ' con cantidad ajustada'}`
                );
            }

            showWarningToast({
                title: "Carrito convertido a Venta",
                description: details.join('\n'),
                duration: 7000
            });
        }

        return result;
    }, [state.convertToSale]);

    const convertToQuoteWithToast = useCallback(() => {
        state.convertToQuote();
        showInfoToast({
            title: "Convertido a Cotización",
            description: "Ahora puedes agregar productos sin restricción de stock",
            duration: 5000
        });
    }, [state.convertToQuote]);

    // ==================== GESTIÓN DE ITEMS ====================

    const incrementQuantity = useCallback((productId: number) => {
        const currentQuantity = state.getItemQuantity(productId);
        const result = state.updateQuantity(productId, currentQuantity + 1);

        if (result.warning) {
            showWarningToast({
                title: "Advertencia de stock",
                description: result.message,
                duration: 5000,
            });
        } else if (!result.success) {
            showErrorToast({
                title: "Error al incrementar",
                description: result.message,
                duration: 5000,
            });
        }

        return result;
    }, [state.getItemQuantity, state.updateQuantity, state.mode]);

    const decrementQuantity = useCallback((productId: number) => {
        const currentQuantity = state.getItemQuantity(productId);
        if (currentQuantity > 1) {
            state.updateQuantity(productId, currentQuantity - 1);
        } else {
            state.removeItem(productId);
        }
    }, [state.getItemQuantity, state.updateQuantity, state.removeItem]);

    const addItemToCart = useCallback((product: ProductGet): CartOperationResult => {
        const productForCart = CartProductSchema.parse(product);
        const result = state.addItem(productForCart);

        if (result.success) {
            if (result.warning) {
                // Es cotización con warning de stock
                showWarningToast({
                    title: "Producto agregado con advertencia",
                    description: result.message,
                    duration: 5000,
                });
            } else {
                showSuccessToast({
                    title: "Producto agregado",
                    description: result.message,
                    duration: 5000,
                });
            }
        } else {
            showErrorToast({
                title: "No se pudo agregar producto",
                description: result.message,
                duration: 5000,
            });
        }

        return result;
    }, [state.addItem, state.mode]);

    const updateQuantity = useCallback((productId: number, quantity: number): CartOperationResult => {
        const result = state.updateQuantity(productId, quantity);

        if (result.warning) {
            showWarningToast({
                title: "Advertencia de stock",
                description: result.message,
                duration: 5000
            });
        } else if (!result.success) {
            showErrorToast({
                title: "Error al actualizar cantidad",
                description: result.message,
                duration: 5000
            });
        }

        return result;
    }, [state.updateQuantity, state.mode]);

    const updateCustomDescription = useCallback((productId: number, description: string) => {
        state.updateCustomDescription(productId, description);
    }, [state.updateCustomDescription]);

    const updateCustomBrand = useCallback((productId: number, brand: string) => {
        state.updateCustomBrand(productId, brand);
    }, [state.updateCustomBrand]);

    // ==================== OPERACIONES MÚLTIPLES ====================

    const addMultipleItems = useCallback((products: ProductGet[]): BulkAddResult => {
        let totalAdded = 0;
        let totalFailed = 0;
        const failedProducts: BulkAddResult['failedProducts'] = [];
        let hasWarnings = false;

        products.forEach(product => {
            const productForCart = CartProductSchema.parse(product);
            const result = state.addItem(productForCart);

            if (result.success) {
                totalAdded++;
                if (result.warning) {
                    hasWarnings = true;
                }
            } else {
                totalFailed++;
                failedProducts.push({
                    product: productForCart,
                    reason: result.error || 'UNKNOWN_ERROR',
                    message: result.message
                });
            }
        });

        const bulkResult: BulkAddResult = {
            success: totalAdded > 0,
            totalAdded,
            totalFailed,
            failedProducts,
            message: `Se agregaron ${totalAdded} productos. ${totalFailed > 0 ? `${totalFailed} fallaron.` : ''}`
        };

        // Toast con resumen
        if (totalAdded > 0) {
            if (hasWarnings && state.mode === 'quote') {
                showWarningToast({
                    title: "Productos agregados con advertencias",
                    description: `${bulkResult.message} Algunos productos no tienen stock disponible.`,
                    duration: 5000,
                });
            } else {
                showSuccessToast({
                    title: "Productos agregados",
                    description: bulkResult.message,
                    duration: 5000,
                });
            }
        }

        // Toast con errores específicos si los hay
        if (totalFailed > 0) {
            const errorMessage = failedProducts.length === 1
                ? failedProducts[0].message
                : `${totalFailed} productos no se pudieron agregar`;

            showErrorToast({
                title: "Algunos productos no se agregaron",
                description: errorMessage,
                duration: 5000,
            });
        }

        return bulkResult;
    }, [state.addItem, state.mode]);

    const addItemWithQuantity = useCallback((product: ProductGet, quantity: number): CartOperationResult => {
        const productForCart = CartProductSchema.parse(product);
        const existingQuantity = state.getItemQuantity(product.id);
        const totalQuantity = existingQuantity + quantity;

        // En modo venta, validar stock
        if (state.mode === 'sale') {
            if (!product.stock_actual || product.stock_actual <= 0) {
                const result = {
                    success: false,
                    error: 'NO_STOCK',
                    message: `${product.descripcion} no tiene stock disponible`
                };

                showErrorToast({
                    title: "Sin stock",
                    description: result.message,
                    duration: 5000,
                });

                return result;
            }

            if (totalQuantity > product.stock_actual) {
                const available = product.stock_actual - existingQuantity;
                const result = {
                    success: false,
                    error: 'INSUFFICIENT_STOCK',
                    message: `Solo hay ${available} unidades adicionales disponibles de ${product.descripcion}`
                };

                showErrorToast({
                    title: "Stock insuficiente",
                    description: result.message,
                    duration: 5000,
                });

                return result;
            }
        }

        let addedCount = 0;
        let hasWarning = false;

        for (let i = 0; i < quantity; i++) {
            const result = state.addItem(productForCart);
            if (result.success) {
                addedCount++;
                if (result.warning) {
                    hasWarning = true;
                }
            } else {
                break;
            }
        }

        const result = {
            success: addedCount === quantity,
            message: `Se agregaron ${addedCount} de ${quantity} unidades de ${product.descripcion}`
        };

        if (addedCount === quantity) {
            if (hasWarning && state.mode === 'quote') {
                showWarningToast({
                    title: "Productos agregados con advertencia",
                    description: `${result.message} (sin stock disponible)`,
                    duration: 5000
                });
            } else {
                showSuccessToast({
                    title: "Productos agregados",
                    description: result.message,
                    duration: 5000
                });
            }
        } else {
            showWarningToast({
                title: "Agregado parcial",
                description: result.message,
                duration: 5000
            });
        }

        return result;
    }, [state.addItem, state.getItemQuantity, state.mode]);

    /**
 * Agrega múltiples productos al carrito, cada uno con su cantidad específica
 * @param products Array de productos con cantidad opcional (default: 1)
 * @returns Resultado detallado de la operación bulk
 */
    const addMultipleItemsWithQuantity = useCallback((
        products: Array<ProductGet & { quantity?: number }>
    ): BulkAddResult => {
        let totalAdded = 0;
        let totalFailed = 0;
        const failedProducts: BulkAddResult['failedProducts'] = [];
        let hasWarnings = false;
        let totalUnitsRequested = 0;
        let totalUnitsAdded = 0;

        products.forEach(product => {
            const requestedQuantity = product.quantity || 1;
            totalUnitsRequested += requestedQuantity;

            const productForCart = CartProductSchema.parse(product);
            const existingQuantity = state.getItemQuantity(product.id);
            const totalQuantity = existingQuantity + requestedQuantity;

            // En modo venta, validar stock antes de agregar
            if (state.mode === 'sale') {
                // Validar que tenga stock
                if (!product.stock_actual || product.stock_actual <= 0) {
                    totalFailed++;
                    failedProducts.push({
                        product: productForCart,
                        reason: 'NO_STOCK',
                        message: `${product.descripcion} no tiene stock disponible`
                    });
                    return; // Saltar este producto
                }

                // Validar que no exceda el stock
                if (totalQuantity > product.stock_actual) {
                    const available = product.stock_actual - existingQuantity;
                    totalFailed++;
                    failedProducts.push({
                        product: productForCart,
                        reason: 'INSUFFICIENT_STOCK',
                        message: available > 0
                            ? `${product.descripcion}: solo ${available} unidades adicionales disponibles (intentó agregar ${requestedQuantity})`
                            : `${product.descripcion}: ya alcanzó el stock máximo`
                    });
                    return; // Saltar este producto
                }
            }

            // Agregar el producto la cantidad de veces solicitada
            let addedCount = 0;
            for (let i = 0; i < requestedQuantity; i++) {
                const result = state.addItem(productForCart);
                if (result.success) {
                    addedCount++;
                    totalUnitsAdded++;
                    if (result.warning) {
                        hasWarnings = true;
                    }
                } else {
                    // Si falla en el medio, registrar como fallo parcial
                    if (i === 0) {
                        totalFailed++;
                        failedProducts.push({
                            product: productForCart,
                            reason: result.error || 'UNKNOWN_ERROR',
                            message: result.message
                        });
                    }
                    break;
                }
            }

            if (addedCount === requestedQuantity) {
                totalAdded++;
            } else if (addedCount > 0) {
                // Agregado parcial - contar como warning
                hasWarnings = true;
            }
        });

        // Construir mensaje detallado
        let message = '';
        if (totalUnitsAdded > 0) {
            message = `Se agregaron ${totalUnitsAdded} unidades de ${totalAdded} producto${totalAdded !== 1 ? 's' : ''}`;
            if (totalFailed > 0) {
                message += `. ${totalFailed} producto${totalFailed !== 1 ? 's fallaron' : ' falló'}`;
            }
        } else {
            message = `No se pudo agregar ningún producto`;
        }

        const bulkResult: BulkAddResult = {
            success: totalAdded > 0,
            totalAdded,
            totalFailed,
            failedProducts,
            message
        };

        // Mostrar toasts según el resultado
        if (totalAdded > 0) {
            if (hasWarnings && state.mode === 'quote') {
                showWarningToast({
                    title: "Productos agregados con advertencias",
                    description: `${message}. Algunos productos no tienen stock suficiente.`,
                    duration: 6000,
                });
            } else if (totalFailed > 0) {
                showWarningToast({
                    title: "Productos agregados parcialmente",
                    description: message,
                    duration: 6000,
                });
            } else {
                showSuccessToast({
                    title: "Productos agregados",
                    description: message,
                    duration: 5000,
                });
            }
        }

        // Toast con errores específicos si todos fallaron
        if (totalFailed > 0 && totalAdded === 0) {
            const errorMessages = failedProducts.slice(0, 3).map(fp => fp.message);
            const moreCount = failedProducts.length - 3;

            showErrorToast({
                title: "No se pudieron agregar productos",
                description: errorMessages.join('\n') + (moreCount > 0 ? `\n... y ${moreCount} más` : ''),
                duration: 7000,
            });
        } else if (totalFailed > 0) {
            // Mostrar resumen de fallos cuando algunos sí se agregaron
            showInfoToast({
                title: "Algunos productos no se agregaron",
                description: `${totalFailed} producto${totalFailed !== 1 ? 's no pudieron' : ' no pudo'} agregarse. Revisa el stock disponible.`,
                duration: 5000,
            });
        }

        return bulkResult;
    }, [state.addItem, state.getItemQuantity, state.mode]);

    // ==================== VALIDACIONES ====================

    const validateCartWithToast = useCallback(() => {
        const validation = state.validateCart();

        if (!validation.isValid) {
            const issueMessages = validation.issues.map(issue =>
                `${issue.productName}: ${issue.issue === 'NO_STOCK' ? 'Sin stock' : `Cantidad ${issue.currentQuantity} > Stock ${issue.availableStock}`}`
            );

            showErrorToast({
                title: "Problemas en el carrito",
                description: issueMessages.join(', '),
                duration: 5000
            });
        } else if (state.mode === 'sale') {
            showSuccessToast({
                title: "Carrito válido",
                description: "Todos los productos tienen stock disponible",
                duration: 3000
            });
        }

        return validation;
    }, [state.validateCart, state.mode]);

    const removeOutOfStockItems = useCallback((): CartOperationResult => {
        const validation = state.validateCart();
        const outOfStockItems = validation.issues.filter(issue => issue.issue === 'NO_STOCK');

        outOfStockItems.forEach(issue => {
            state.removeItem(issue.productId);
        });

        if (outOfStockItems.length > 0) {
            showInfoToast({
                title: "Productos removidos",
                description: `Se removieron ${outOfStockItems.length} productos sin stock`,
                duration: 5000
            });
        }

        return {
            success: true,
            message: `Se removieron ${outOfStockItems.length} productos sin stock`
        };
    }, [state.validateCart, state.removeItem]);

    const adjustQuantitiesToStock = useCallback((): CartOperationResult => {
        const validation = state.validateCart();
        const quantityIssues = validation.issues.filter(issue => issue.issue === 'QUANTITY_EXCEEDS_STOCK');

        let adjustedCount = 0;
        quantityIssues.forEach(issue => {
            const result = state.updateQuantity(issue.productId, issue.availableStock);
            if (result.success) {
                adjustedCount++;
            }
        });

        if (adjustedCount > 0) {
            showInfoToast({
                title: "Cantidades ajustadas",
                description: `Se ajustaron las cantidades de ${adjustedCount} productos según el stock disponible`,
                duration: 5000
            });
        }

        return {
            success: true,
            message: `Se ajustaron ${adjustedCount} productos`
        };
    }, [state.validateCart, state.updateQuantity]);

    // ==================== UTILIDADES ====================

    const getCartSummary = useCallback((): CartSummary => {
        return {
            itemCount: state.getCartCount(),
            subtotal: state.getCartSubtotal(),
            discount: state.getDiscountAmount(),
            total: state.getCartTotal(),
            itemsLength: state.items.length
        };
    }, [state.getCartCount, state.getCartSubtotal, state.getDiscountAmount, state.getCartTotal, state.items.length]);

    const getStockWarnings = useCallback(() => {
        if (state.mode !== 'quote') return [];

        return state.items
            .filter(item => {
                return !item.product.stock_actual ||
                    item.product.stock_actual <= 0 ||
                    item.quantity > item.product.stock_actual;
            })
            .map(item => ({
                productId: item.product.id,
                productName: item.product.descripcion,
                currentQuantity: item.quantity,
                availableStock: item.product.stock_actual || 0,
                warning: !item.product.stock_actual || item.product.stock_actual <= 0
                    ? 'NO_STOCK'
                    : 'EXCEEDS_STOCK'
            }));
    }, [state.items, state.mode]);

    return {
        // Estado original
        ...state,

        // Nuevos métodos de modo
        setCartMode,
        convertToSaleWithToast,
        convertToQuoteWithToast,
        getStockWarnings,

        // Métodos actualizados con soporte de modo
        incrementQuantity,
        decrementQuantity,
        addItemToCart,
        addMultipleItems,
        addItemWithQuantity,
        addMultipleItemsWithQuantity,
        updateQuantity,

        // Métodos sin cambios
        updateCustomDescription,
        updateCustomBrand,
        validateCartWithToast,
        removeOutOfStockItems,
        adjustQuantitiesToStock,
        getCartSummary,

        // Store reference
        useCartStore: cartStore
    };
};