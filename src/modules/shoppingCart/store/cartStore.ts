import { createJSONStorage, devtools, persist } from "zustand/middleware";
import type { CartItem, CartMode, CartState, ConversionAdjustment, ConversionResult } from "../types/cart.types";
import { CART_CONSTANTS } from "../constants/cart.constants";
import { createStore } from "zustand";

// Tipo para el store con middleware
export type CartStore = ReturnType<typeof createCartStore>;

export const createCartStore = (user: string) => {
    return createStore<CartState>()(
        devtools(
            persist(
                (set, get) => ({
                    items: [],
                    mode: 'sale-strict',
                    discountAmount: 0,
                    discountPercent: 0,
                    discountMode: null,
                    lastConversion: null,

                    // ==================== GESTIÓN DE MODO ====================

                    setMode: (mode) => {
                        set({ mode });
                    },

                    convertToSaleStrict: () => {
                        const currentItems = get().items;
                        const removedItems: CartItem[] = [];
                        const adjustedItems: ConversionAdjustment[] = [];
                        const keptItems: CartItem[] = [];

                        currentItems.forEach(item => {
                            const hasStock = item.product.stock_actual && item.product.stock_actual > 0;

                            if (!hasStock) {
                                removedItems.push(item);
                            } else if (item.quantity > item.product.stock_actual) {
                                const adjustedItem = {
                                    ...item,
                                    quantity: item.product.stock_actual,
                                    customSubtotal: calculateSubtotalByItem(
                                        item.customPrice,
                                        item.product.stock_actual
                                    )
                                };
                                keptItems.push(adjustedItem);
                                adjustedItems.push({
                                    productId: item.product.id,
                                    productName: item.product.descripcion,
                                    originalQuantity: item.quantity,
                                    adjustedQuantity: item.product.stock_actual,
                                    reason: 'QUANTITY_ADJUSTED'
                                });
                            } else {
                                keptItems.push(item);
                            }
                        });

                        const result: ConversionResult = {
                            success: true,
                            removedItems,
                            adjustedItems,
                            keptItems,
                            message: generateConversionMessage(removedItems.length, adjustedItems.length)
                        };

                        set({
                            items: keptItems,
                            mode: 'sale-strict',
                            lastConversion: result
                        });

                        get().recalculateDiscount();
                        return result;
                    },

                    convertToSalePermissive: () => {
                        set({
                            mode: 'sale-permissive',
                            lastConversion: null
                        });
                    },

                    convertToQuote: () => {
                        set({
                            mode: 'quote',
                            lastConversion: null
                        });
                    },

                    clearLastConversion: () => {
                        set({ lastConversion: null });
                    },

                    previewConversion: (targetMode: CartMode) => {
                        const currentItems = get().items;
                        const currentMode = get().mode;

                        // Si ya está en el modo objetivo, no hay cambios
                        if (currentMode === targetMode) {
                            return {
                                willHaveChanges: false,
                                removedCount: 0,
                                adjustedCount: 0,
                                keptCount: currentItems.length,
                                itemsToRemove: [],
                                itemsToAdjust: [],
                                itemsToKeep: currentItems,
                                summary: 'Ya estás en este modo'
                            };
                        }

                        // Solo necesita validación si va a modo STRICT
                        if (targetMode === 'sale-strict') {
                            let removedCount = 0;
                            let adjustedCount = 0;
                            const itemsToRemove: CartItem[] = [];
                            const itemsToAdjust: ConversionAdjustment[] = [];
                            const itemsToKeep: CartItem[] = [];

                            currentItems.forEach(item => {
                                const hasStock = item.product.stock_actual && item.product.stock_actual > 0;

                                if (!hasStock) {
                                    removedCount++;
                                    itemsToRemove.push(item);
                                } else if (item.quantity > item.product.stock_actual) {
                                    adjustedCount++;
                                    itemsToAdjust.push({
                                        productId: item.product.id,
                                        productName: item.product.descripcion,
                                        originalQuantity: item.quantity,
                                        adjustedQuantity: item.product.stock_actual,
                                        reason: 'QUANTITY_ADJUSTED'
                                    });
                                    // Item ajustado también va a "kept"
                                    itemsToKeep.push({
                                        ...item,
                                        quantity: item.product.stock_actual,
                                        customSubtotal: calculateSubtotalByItem(
                                            item.customPrice,
                                            item.product.stock_actual
                                        )
                                    });
                                } else {
                                    itemsToKeep.push(item);
                                }
                            });

                            const keptCount = itemsToKeep.length;
                            const willHaveChanges = removedCount > 0 || adjustedCount > 0;

                            return {
                                willHaveChanges,
                                removedCount,
                                adjustedCount,
                                keptCount,
                                itemsToRemove,
                                itemsToAdjust,
                                itemsToKeep,
                                summary: willHaveChanges
                                    ? generateConversionSummary(removedCount, adjustedCount, keptCount)
                                    : 'Todos los productos son válidos para venta estricta'
                            };
                        }

                        // Para otros modos (permissive o quote), no hay cambios en items
                        return {
                            willHaveChanges: false,
                            removedCount: 0,
                            adjustedCount: 0,
                            keptCount: currentItems.length,
                            itemsToRemove: [],
                            itemsToAdjust: [],
                            itemsToKeep: currentItems,
                            summary: `Cambio simple a modo ${getModeLabel(targetMode)}`
                        };
                    },

                    // ==================== GESTIÓN DE ITEMS ====================

                    addItem: (product) => {
                        const mode = get().mode;
                        const existing = get().items.find((i) => i.product.id === product.id);
                        const basePrice = product.precio_venta;

                        // Validar stock SOLO en modo SALE-STRICT
                        if (mode === 'sale-strict') {
                            if (!product.stock_actual || product.stock_actual <= 0) {
                                return {
                                    success: false,
                                    error: 'NO_STOCK',
                                    message: `${product.descripcion} no tiene stock disponible`
                                };
                            }
                        }

                        if (existing) {
                            const newQuantity = existing.quantity + 1;

                            // Validar cantidad vs stock SOLO en modo SALE-STRICT
                            if (mode === 'sale-strict' && newQuantity > product.stock_actual) {
                                return {
                                    success: false,
                                    error: 'INSUFFICIENT_STOCK',
                                    message: `Solo hay ${product.stock_actual} unidades disponibles de ${product.descripcion}`
                                };
                            }

                            const updatedSubtotal = calculateSubtotalByItem(
                                existing.customPrice ?? basePrice,
                                newQuantity
                            );

                            set({
                                items: get().items.map((i) =>
                                    i.product.id === product.id
                                        ? {
                                            ...i,
                                            quantity: newQuantity,
                                            customSubtotal: updatedSubtotal,
                                        }
                                        : i
                                ),
                            });

                            // Warnings para modos permissive y quote
                            if ((mode === 'sale-permissive' || mode === 'quote') &&
                                (!product.stock_actual || product.stock_actual <= 0)) {
                                get().recalculateDiscount();
                                return {
                                    success: true,
                                    warning: 'NO_STOCK',
                                    message: `${product.descripcion} agregado sin stock disponible`
                                };
                            }

                            if ((mode === 'sale-permissive' || mode === 'quote') &&
                                newQuantity > product.stock_actual) {
                                get().recalculateDiscount();
                                return {
                                    success: true,
                                    warning: 'EXCEEDS_STOCK',
                                    message: `${product.descripcion} agregado (cantidad supera stock: ${product.stock_actual})`
                                };
                            }
                        } else {
                            const quantity = 1;
                            const subtotal = calculateSubtotalByItem(basePrice, quantity);
                            const newItem: CartItem = {
                                product,
                                quantity,
                                customPrice: basePrice,
                                customSubtotal: subtotal,
                                customDescription: product.descripcion,
                                customBrand: product.marca
                            };

                            set({ items: [...get().items, newItem] });

                            // Warning para modos permissive y quote
                            if ((mode === 'sale-permissive' || mode === 'quote') &&
                                (!product.stock_actual || product.stock_actual <= 0)) {
                                get().recalculateDiscount();
                                return {
                                    success: true,
                                    warning: 'NO_STOCK',
                                    message: `${product.descripcion} agregado sin stock disponible`
                                };
                            }
                        }

                        get().recalculateDiscount();
                        return {
                            success: true,
                            message: `${product.descripcion} agregado al carrito`
                        };
                    },

                    removeItem: (productId) => {
                        set({ items: get().items.filter(i => i.product.id !== productId) });
                        get().recalculateDiscount();
                    },

                    updateQuantity: (productId, quantity) => {
                        if (quantity < 1) {
                            return {
                                success: false,
                                message: 'La cantidad debe ser de 1 o más productos'
                            };
                        }

                        const mode = get().mode;
                        const item = get().items.find(i => i.product.id === productId);

                        if (!item) {
                            return {
                                success: false,
                                error: 'ITEM_NOT_FOUND',
                                message: 'Producto no encontrado en el carrito'
                            };
                        }

                        // Validar stock SOLO en modo SALE-STRICT
                        if (mode === 'sale-strict' && quantity > item.product.stock_actual) {
                            return {
                                success: false,
                                error: 'INSUFFICIENT_STOCK',
                                message: `Solo hay ${item.product.stock_actual} unidades disponibles de ${item.product.descripcion}`
                            };
                        }

                        set({
                            items: get().items.map((i) =>
                                i.product.id === productId
                                    ? {
                                        ...i,
                                        quantity,
                                        customSubtotal: calculateSubtotalByItem(
                                            i.customPrice ?? i.product.precio_venta,
                                            quantity
                                        ),
                                    }
                                    : i
                            ),
                        });

                        get().recalculateDiscount();

                        // Warning para modos permissive y quote que exceden stock
                        if ((mode === 'sale-permissive' || mode === 'quote') &&
                            quantity > item.product.stock_actual) {
                            return {
                                success: true,
                                warning: 'EXCEEDS_STOCK',
                                message: `Cantidad supera el stock disponible (${item.product.stock_actual} unidades)`
                            };
                        }

                        return {
                            success: true,
                            message: 'Cantidad actualizada correctamente'
                        };
                    },

                    updateCustomPrice: (productId, price) => {
                        set({
                            items: get().items.map((i) =>
                                i.product.id === productId
                                    ? {
                                        ...i,
                                        customPrice: price,
                                        customSubtotal: calculateSubtotalByItem(price, i.quantity),
                                    }
                                    : i
                            ),
                        });
                        get().recalculateDiscount();
                    },

                    updateCustomSubtotal: (productId, subtotal) => {
                        const item = get().items.find(i => i.product.id === productId);
                        if (!item || item.quantity < 1) return;

                        set({
                            items: get().items.map((i) =>
                                i.product.id === productId
                                    ? {
                                        ...i,
                                        customSubtotal: subtotal,
                                        customPrice: calculateSubtotalByItem(subtotal / i.quantity, 1),
                                    }
                                    : i
                            ),
                        });
                        get().recalculateDiscount();
                    },

                    updateCustomDescription: (productId, description) => {
                        set({
                            items: get().items.map((i) =>
                                i.product.id === productId
                                    ? {
                                        ...i,
                                        customDescription: description
                                    }
                                    : i
                            ),
                        });
                    },

                    updateCustomBrand: (productId, brand) => {
                        set({
                            items: get().items.map((i) =>
                                i.product.id === productId
                                    ? {
                                        ...i,
                                        customBrand: brand
                                    }
                                    : i
                            ),
                        });
                    },

                    clearCart: () => set({
                        items: [],
                        discountAmount: 0,
                        discountPercent: 0,
                        discountMode: null,
                        lastConversion: null
                    }),

                    // ==================== GESTIÓN DE DESCUENTOS ====================

                    setDiscountAmount: (amount) => {
                        const subtotal = get().getCartSubtotal();
                        const validAmount = Math.min(Math.max(0, amount), subtotal);
                        const percent = subtotal > 0 ? (validAmount / subtotal) * 100 : 0;

                        set({
                            discountAmount: validAmount,
                            discountPercent: percent,
                            discountMode: 'amount'
                        });
                    },

                    setDiscountPercent: (percent) => {
                        const subtotal = get().getCartSubtotal();
                        const validPercent = Math.min(Math.max(0, percent), 100);
                        const amount = (validPercent / 100) * subtotal;

                        set({
                            discountPercent: validPercent,
                            discountAmount: amount,
                            discountMode: 'percent'
                        });
                    },

                    recalculateDiscount: () => {
                        const state = get();
                        const { discountMode, discountAmount, discountPercent } = state;
                        const newSubtotal = calculateSubtotal(state.items);

                        if (discountMode === null || (discountAmount === 0 && discountPercent === 0)) {
                            return;
                        }

                        if (discountMode === 'percent') {
                            const newAmount = (discountPercent / 100) * newSubtotal;
                            set({ discountAmount: newAmount });
                        } else if (discountMode === 'amount') {
                            const validAmount = Math.min(discountAmount, newSubtotal);
                            const newPercent = newSubtotal > 0 ? (validAmount / newSubtotal) * 100 : 0;
                            set({
                                discountAmount: validAmount,
                                discountPercent: newPercent
                            });
                        }
                    },

                    // ==================== CONSULTAS ====================

                    getItemSubtotal: (productId) => {
                        const item = get().items.find((i) => i.product.id === productId);
                        return item ? item.customSubtotal : 0;
                    },

                    getCartSubtotal: () => {
                        return calculateSubtotal(get().items);
                    },

                    getCartTotal: () => {
                        const subtotal = get().getCartSubtotal();
                        const { discountAmount, discountPercent } = get();

                        if (discountAmount && discountAmount > 0) {
                            return Math.max(0, subtotal - discountAmount);
                        }
                        if (discountPercent && discountPercent > 0) {
                            return Math.max(0, subtotal * (1 - discountPercent / 100));
                        }

                        return subtotal;
                    },

                    getCartCount: () => {
                        return get().items.reduce((count, item) => count + item.quantity, 0);
                    },

                    getDiscountAmount: () => {
                        const { discountAmount, discountPercent } = get();
                        if (!discountAmount) return 0;

                        const subtotal = get().getCartSubtotal();
                        return calculateDiscountAmount(subtotal, { amount: discountAmount, percent: discountPercent });
                    },

                    isItemInCart: (productId: number) => {
                        return get().items.some(item => item.product.id === productId);
                    },

                    getItemQuantity: (productId: number) => {
                        const item = get().items.find(i => i.product.id === productId);
                        return item ? item.quantity : 0;
                    },

                    // ==================== VALIDACIONES ====================

                    validateCart: () => {
                        const mode = get().mode;

                        // En modos permissive y quote, el carrito siempre es válido
                        if (mode === 'sale-permissive' || mode === 'quote') {
                            return {
                                isValid: true,
                                issues: []
                            };
                        }

                        // En modo sale-strict, validar stock
                        const issues = get().items.filter(item => {
                            return !item.product.stock_actual ||
                                item.product.stock_actual <= 0 ||
                                item.quantity > item.product.stock_actual;
                        });

                        return {
                            isValid: issues.length === 0,
                            issues: issues.map(item => ({
                                productId: item.product.id,
                                productName: item.product.descripcion,
                                currentQuantity: item.quantity,
                                availableStock: item.product.stock_actual || 0,
                                issue: !item.product.stock_actual || item.product.stock_actual <= 0
                                    ? 'NO_STOCK'
                                    : 'QUANTITY_EXCEEDS_STOCK'
                            }))
                        };
                    },

                    canAddProduct: (productId: number, quantityToAdd: number = 1) => {
                        const mode = get().mode;

                        // En modos permissive y quote, siempre se puede agregar
                        if (mode === 'sale-permissive' || mode === 'quote') {
                            return { canAdd: true };
                        }

                        // En modo sale-strict, validar stock
                        const product = get().items.find(i => i.product.id === productId)?.product;
                        if (!product) return { canAdd: false, reason: 'PRODUCT_NOT_FOUND' };

                        const currentQuantity = get().getItemQuantity(productId);
                        const totalQuantity = currentQuantity + quantityToAdd;

                        if (!product.stock_actual || product.stock_actual <= 0) {
                            return { canAdd: false, reason: 'NO_STOCK' };
                        }

                        if (totalQuantity > product.stock_actual) {
                            return {
                                canAdd: false,
                                reason: 'INSUFFICIENT_STOCK',
                                available: product.stock_actual - currentQuantity
                            };
                        }

                        return { canAdd: true };
                    },
                }),
                {
                    name: `${CART_CONSTANTS.STORAGE_PREFIX}${user}`,
                    storage: createJSONStorage(() => sessionStorage),
                    partialize: (state) => ({
                        items: state.items,
                        mode: state.mode,
                        discountAmount: state.discountAmount,
                        discountPercent: state.discountPercent,
                        discountMode: state.discountMode
                        // lastConversion NO se persiste, es temporal
                    }),
                }
            ),
            {
                name: `cart-storage-${user}`
            }
        )
    );
};

// ==================== FUNCIONES AUXILIARES ====================

export const calculateSubtotal = (items: CartItem[]) => {
    return items.reduce((sum, item) => {
        const subtotal = calculateSubtotalByItem(item.customPrice, item.quantity);
        return sum + subtotal;
    }, 0);
};

export const calculateSubtotalByItem = (price: number, qty: number) =>
    Number((price * qty).toFixed(2));

export const calculateDiscountAmount = (
    subtotal: number,
    discount: { amount?: number; percent?: number }
): number => {
    if (discount.amount) {
        return Math.min(discount.amount, subtotal);
    }

    if (discount.percent) {
        return (discount.percent / 100) * subtotal;
    }

    return 0;
};

const generateConversionMessage = (removedCount: number, adjustedCount: number): string => {
    if (removedCount === 0 && adjustedCount === 0) {
        return 'Todos los productos fueron convertidos exitosamente a venta';
    }

    const parts: string[] = [];

    if (removedCount > 0) {
        parts.push(`${removedCount} producto${removedCount > 1 ? 's' : ''} sin stock ${removedCount > 1 ? 'fueron removidos' : 'fue removido'}`);
    }

    if (adjustedCount > 0) {
        parts.push(`${adjustedCount} producto${adjustedCount > 1 ? 's' : ''} ${adjustedCount > 1 ? 'tuvieron' : 'tuvo'} su cantidad ajustada`);
    }

    return parts.join(' y ');
};

const generateConversionSummary = (
    removedCount: number,
    adjustedCount: number,
    keptCount: number
): string => {
    const parts: string[] = [];

    if (removedCount > 0) {
        parts.push(`${removedCount} producto${removedCount > 1 ? 's serán removidos' : ' será removido'}`);
    }

    if (adjustedCount > 0) {
        parts.push(`${adjustedCount} producto${adjustedCount > 1 ? 's tendrán' : ' tendrá'} cantidad ajustada`);
    }

    if (keptCount > 0) {
        parts.push(`${keptCount} producto${keptCount > 1 ? 's se mantendrán' : ' se mantendrá'}`);
    }

    return parts.join(', ');
};

export const getModeLabel = (mode: CartMode): string => {
    switch (mode) {
        case 'sale-strict': return 'Venta Estricta';
        case 'sale-permissive': return 'Venta Permisiva';
        case 'quote': return 'Cotización';
        default: return mode;
    }
};