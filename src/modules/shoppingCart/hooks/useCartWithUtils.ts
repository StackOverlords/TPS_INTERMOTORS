import { useCartStore } from "./useCartStore";
import type { CartProduct, CartSummary } from "../types/cart.types";
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
    if (!user) user = "guest"
    const cartStore = useCartStore(`${user}-${branch}`);
    const state = useStore(cartStore, (state) => state)

    const incrementQuantity = useCallback((productId: number) => {
        const currentQuantity = state.getItemQuantity(productId);
        state.updateQuantity(productId, currentQuantity + 1);
    }, [state.getItemQuantity, state.updateQuantity]);

    const decrementQuantity = useCallback((productId: number) => {
        const currentQuantity = state.getItemQuantity(productId);
        if (currentQuantity > 1) {
            state.updateQuantity(productId, currentQuantity - 1);
        } else {
            state.removeItem(productId);
        }
    }, [state.getItemQuantity, state.updateQuantity, state.removeItem]);

    const addItemToCart = useCallback((product: ProductGet): CartOperationResult => {
        const productForCart = CartProductSchema.parse(product)
        const result = state.addItem(productForCart);

        if (result.success) {
            showSuccessToast({
                title: "Producto agregado",
                description: result.message,
                duration: 5000,
            })
        } else {
            showErrorToast({
                title: "No se pudo agregar producto",
                description: result.message,
                duration: 5000,
            });
        }

        return result;
    }, [state.addItem]);

    const updateQuantity = useCallback((productId: number, quantity: number): CartOperationResult => {
        const result = state.updateQuantity(productId, quantity);

        if (!result.success) {
            showErrorToast({
                title: "Error al actualizar cantidad",
                description: result.message,
                duration: 5000
            });
        }

        return result;
    }, [state.updateQuantity]);

    const updateCustomDescription = useCallback((productId: number, description: string) => {
        state.updateCustomDescription(productId, description);
    }, [state.updateCustomDescription]);

    const updateCustomBrand = useCallback((productId: number, brand: string) => {
        state.updateCustomBrand(productId, brand)
    }, [state.updateCustomBrand])

    const addMultipleItems = useCallback((products: ProductGet[]): BulkAddResult => {
        let totalAdded = 0;
        let totalFailed = 0;
        const failedProducts: BulkAddResult['failedProducts'] = [];

        products.forEach(product => {
            const productForCart = CartProductSchema.parse(product)
            const result = state.addItem(productForCart);

            if (result.success) {
                totalAdded++;
            } else {
                totalFailed++;
                failedProducts.push({
                    product,
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
            showSuccessToast({
                title: "Productos agregados",
                description: bulkResult.message,
                duration: 5000,
            });
        }

        // Toast con errores específicos si los hay
        if (totalFailed > 0) {
            const errorMessage = failedProducts.length === 1
                ? failedProducts[0].message
                : `${totalFailed} productos no se pudieron agregar por problemas de stock`;

            showErrorToast({
                title: "Algunos productos no se agregaron",
                description: errorMessage,
                duration: 5000,
            });
        }

        return bulkResult;
    }, [state.addItem]);

    const addItemWithQuantity = useCallback((product: ProductGet, quantity: number): CartOperationResult => {
        const productForCart = CartProductSchema.parse(product)
        const existingQuantity = state.getItemQuantity(product.id);
        const totalQuantity = existingQuantity + quantity;

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

        let addedCount = 0;
        for (let i = 0; i < quantity; i++) {
            const result = state.addItem(productForCart);
            if (result.success) {
                addedCount++;
            } else {
                break; // Si falla uno, parar
            }
        }

        const result = {
            success: addedCount === quantity,
            message: `Se agregaron ${addedCount} de ${quantity} unidades de ${product.descripcion}`
        };

        if (addedCount === quantity) {
            showSuccessToast({
                title: "Productos agregados",
                description: result.message,
                duration: 5000
            });
        } else {
            showWarningToast({
                title: "Agregado parcial",
                description: result.message,
                duration: 5000
            });
        }

        return result;
    }, [state.addItem, state.getItemQuantity]);

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
        }

        return validation;
    }, [state.validateCart]);

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

    const getCartSummary = useCallback((): CartSummary => {
        return {
            itemCount: state.getCartCount(),
            subtotal: state.getCartSubtotal(),
            discount: state.getDiscountAmount(),
            total: state.getCartTotal(),
            itemsLength: state.items.length
        };
    }, [state.getCartCount, state.getCartSubtotal, state.getDiscountAmount, state.getCartTotal, state.items.length]);

    return {
        // Estado original
        ...state,

        // Métodos con utilidades
        incrementQuantity,
        decrementQuantity,
        addItemToCart,
        addMultipleItems,
        addItemWithQuantity,
        validateCartWithToast,
        removeOutOfStockItems,
        adjustQuantitiesToStock,
        getCartSummary,
        updateQuantity,
        updateCustomDescription,
        updateCustomBrand,

        // Store reference
        useCartStore: cartStore
    };
};
