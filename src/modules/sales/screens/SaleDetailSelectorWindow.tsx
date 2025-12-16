import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/atoms/resizable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { showSuccessToast, showErrorToast } from '@/hooks/use-toast-enhanced';
import { emitToWindow } from '@/utils/tauriWindows';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Check, Package, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SaleGetAll } from '@/modules/sales/types/salesGetResponse';
import SaleReturnList from '@/modules/returns/components/SalesReturnList';
import SelectSalesReturnModal from '@/modules/returns/components/SelectSalesReturnModal';
import ReturnDetailTable, { type ReturnDetailTableRef } from '@/modules/returns/components/returnDetailTable';
import type { UIReturnDetailCreate } from '@/modules/returns/types/returnCreate.types';
import type { ProductChange } from '@/modules/returns/hooks/useReturnDetails';
import type { UIReturnDetailUpdate } from '@/modules/returns/types/returnUpdate.types';

interface WindowConfig {
    windowId: string;
    context: string;
    mode: 'create' | 'edit';
    selectedItems: (UIReturnDetailCreate | UIReturnDetailUpdate)[];
}

interface SelectedItemWithSale {
    almacen_out_det_id: number;
    cantidad: number;
    precio: number;
    comentario: string;
    orden: number;
    almacen_out_id: number; 
    sale_id: number;
    product: {
        id: number;
        descripcion: string;
        codigo_oem: string | null;
        codigo_upc: string | null;
        precio_venta: number;
    };
    maxQuantity: number;
    almacen_out_dev_det_id?: number | null; // Para modo edición
}

const SaleDetailSelectorWindow = () => {
    const currentWindow = getCurrentWebviewWindow();
    const tableRef = useRef<ReturnDetailTableRef>(null);

    const config: WindowConfig = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const selectedItemsParam = params.get('selectedItems');
        let selectedItems: (UIReturnDetailCreate | UIReturnDetailUpdate)[] = [];

        if (selectedItemsParam) {
            try {
                selectedItems = JSON.parse(selectedItemsParam);
            } catch (e) {
                console.error('Error parsing selectedItems:', e);
            }
        }

        return {
            windowId: params.get('windowId') || 'sale-detail-selector-default',
            context: params.get('context') || 'default',
            mode: (params.get('mode') as 'create' | 'edit') || 'create',
            selectedItems,
        };
    }, []);

    const [selectedSale, setSelectedSale] = useState<SaleGetAll | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [selectedItems, setSelectedItems] = useState<SelectedItemWithSale[]>([]);

    // Estado inicial para detectar cambios
    const [initialItems, setInitialItems] = useState<SelectedItemWithSale[]>([]);

    /**
     * Reordenar items secuencialmente desde 1
     */
    const reorderItems = useCallback((items: SelectedItemWithSale[]): SelectedItemWithSale[] => {
        return items.map((item, index) => ({
            ...item,
            orden: index + 1
        }));
    }, []);

    // Inicializar items desde config
    useEffect(() => {
        if (config.selectedItems.length > 0) {
            const itemsWithSaleId: SelectedItemWithSale[] = config.selectedItems.map(item => {
                const almacenOutId = item.almacen_out_id ?? 0;
                const saleId = ('sale_id' in item ? (item as any).sale_id : null) ?? almacenOutId;

                return {
                    almacen_out_det_id: item.almacen_out_det_id,
                    cantidad: item.cantidad,
                    precio: item.precio,
                    comentario: item.comentario ?? '',
                    orden: item.orden,
                    almacen_out_id: almacenOutId || saleId,
                    sale_id: saleId || almacenOutId,
                    product: item.product,
                    maxQuantity: item.maxQuantity,
                    // Solo incluir almacen_out_dev_det_id si existe (modo edición)
                    ...('almacen_out_dev_det_id' in item && {
                        almacen_out_dev_det_id: (item as any).almacen_out_dev_det_id
                    })
                };
            });

            const orderedItems = reorderItems(itemsWithSaleId);
            setSelectedItems(orderedItems);
            setInitialItems(orderedItems);
        }
    }, [config.selectedItems, reorderItems]);

    const handleSelectSale = useCallback((sale: SaleGetAll) => {
        setSelectedSale(sale);
        setIsDialogOpen(true);
    }, []);

    const handleCloseSelectDialog = useCallback(() => {
        setIsDialogOpen(false);
        setSelectedSale(null);
    }, []);

    // Manejar confirmación del modal con cambios
    const handleConfirmModal = useCallback((changes: ProductChange[]) => {
        if (changes.length === 0) {
            setIsDialogOpen(false);
            setSelectedSale(null);
            return;
        }

        setSelectedItems(prev => {
            let newItems = [...prev];

            changes.forEach(change => {
                const existingIndex = newItems.findIndex(
                    item => item.almacen_out_det_id === change.almacen_out_det_id
                );

                // Cantidad 0 significa eliminar
                if (change.cantidad === 0) {
                    if (existingIndex >= 0) {
                        newItems.splice(existingIndex, 1);
                    }
                    return;
                }

                // Actualizar o agregar
                if (existingIndex >= 0) {
                    newItems[existingIndex] = {
                        ...newItems[existingIndex],
                        cantidad: change.cantidad,
                        precio: change.precio,
                        comentario: change.comentario || newItems[existingIndex].comentario,
                        maxQuantity: change.maxQuantity,
                    };
                } else {
                    // 🔥 Nuevo item con tipos correctos
                    const newItem: SelectedItemWithSale = {
                        almacen_out_det_id: change.almacen_out_det_id,
                        cantidad: change.cantidad,
                        precio: change.precio,
                        comentario: change.comentario || '',
                        orden: newItems.length + 1,
                        almacen_out_id: change.sale_id,
                        sale_id: change.sale_id,
                        product: change.product,
                        maxQuantity: change.maxQuantity,
                        almacen_out_dev_det_id: null, // Para modo edición
                    };
                    newItems.push(newItem);
                }
            });

            // Reordenar después de aplicar cambios
            return reorderItems(newItems);
        });

        setIsDialogOpen(false);
        setSelectedSale(null);

        // Enfocar el primer input después del cambio
        setTimeout(() => {
            tableRef.current?.focusQuantityInputByProductId(changes[0].almacen_out_det_id);
        }, 100);
    }, [reorderItems]);

    const handleUpdateCantidad = useCallback((id_detalle: number, cantidad: number) => {
        setSelectedItems(prev =>
            prev.map(item => {
                if (item.almacen_out_det_id !== id_detalle) return item;

                // Validar contra maxQuantity
                if (cantidad > item.maxQuantity) {
                    showErrorToast({
                        title: 'Cantidad excedida',
                        description: `La cantidad máxima disponible es ${item.maxQuantity}`,
                        duration: 3000
                    });
                    return item; // Mantener valor anterior
                }

                return { ...item, cantidad };
            })
        );
    }, []);

    const handleUpdatePrecio = useCallback((id_detalle: number, precio: number) => {
        setSelectedItems(prev =>
            prev.map(item =>
                item.almacen_out_det_id === id_detalle
                    ? { ...item, precio }
                    : item
            )
        );
    }, []);

    const handleUpdateComentario = useCallback((id_detalle: number, comentario: string) => {
        setSelectedItems(prev =>
            prev.map(item =>
                item.almacen_out_det_id === id_detalle
                    ? { ...item, comentario }
                    : item
            )
        );
    }, []);

    const handleRemoveProduct = useCallback((id_detalle: number) => {
        setSelectedItems(prev => {
            const filtered = prev.filter(item => item.almacen_out_det_id !== id_detalle);
            // Reordenar después de eliminar
            return reorderItems(filtered);
        });
    }, [reorderItems]);

    const handleConfirmSelection = useCallback(async () => {
        // Detectar solo los cambios reales
        const changes: ProductChange[] = [];

        selectedItems.forEach(item => {
            const initialItem = initialItems.find(i => i.almacen_out_det_id === item.almacen_out_det_id);

            // Es nuevo si no existía antes
            const isNew = !initialItem;

            // Hay cambio si es nuevo O si algo cambió
            const hasChanged = isNew ||
                initialItem.cantidad !== item.cantidad ||
                initialItem.precio !== item.precio ||
                initialItem.comentario !== item.comentario;

            if (hasChanged) {
                changes.push({
                    almacen_out_det_id: item.almacen_out_det_id,
                    cantidad: item.cantidad,
                    precio: item.precio,
                    comentario: item.comentario || '',
                    sale_id: item.sale_id, // Usar sale_id directamente
                    product: item.product,
                    isNew,
                    maxQuantity: item.maxQuantity
                });
            }
        });

        // Detectar eliminados
        initialItems.forEach(initialItem => {
            const stillExists = selectedItems.some(i => i.almacen_out_det_id === initialItem.almacen_out_det_id);
            if (!stillExists) {
                changes.push({
                    almacen_out_det_id: initialItem.almacen_out_det_id,
                    cantidad: 0, // Indica eliminación
                    precio: initialItem.precio,
                    comentario: '',
                    sale_id: initialItem.sale_id, // Usar sale_id directamente
                    product: initialItem.product,
                    isNew: false,
                    maxQuantity: initialItem.maxQuantity
                });
            }
        });

        if (changes.length === 0) {
            showErrorToast({
                title: 'Sin cambios',
                description: 'No has realizado ningún cambio',
                duration: 3000
            });
            return;
        }

        showSuccessToast({
            title: 'Cambios confirmados',
            description: `${changes.length} cambio${changes.length !== 1 ? 's' : ''} aplicado${changes.length !== 1 ? 's' : ''}`,
            duration: 2000
        });

        // Enviar solo los cambios
        await emitToWindow(
            config.windowId,
            'sale-details-changes-applied',
            changes
        );

        await currentWindow.close();
    }, [selectedItems, initialItems, config.windowId, currentWindow]);

    const handleClose = useCallback(async () => {
        await emitToWindow(config.windowId, 'window-closed', { canceled: true });
        await currentWindow.close();
    }, [config.windowId, currentWindow]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleClose]);

    const contextTitle = useMemo(() => {
        const titles: Record<string, string> = {
            return: 'Seleccionar Productos de Venta',
            devolution: 'Agregar Productos para Devolución',
        };
        return titles[config.context] || 'Seleccionar Productos';
    }, [config.context]);

    // Calcular cambios pendientes
    const pendingChanges = useMemo(() => {
        let changes = 0;

        selectedItems.forEach(item => {
            const initialItem = initialItems.find(i => i.almacen_out_det_id === item.almacen_out_det_id);
            if (!initialItem ||
                initialItem.cantidad !== item.cantidad ||
                initialItem.precio !== item.precio ||
                initialItem.comentario !== item.comentario) {
                changes++;
            }
        });

        initialItems.forEach(initialItem => {
            const stillExists = selectedItems.some(i => i.almacen_out_det_id === initialItem.almacen_out_det_id);
            if (!stillExists) changes++;
        });

        return changes;
    }, [selectedItems, initialItems]);

    return (
        <main className="h-full p-2 flex flex-col bg-gray-50 gap-2">
            {/* Header */}
            <header className="bg-background rounded-lg p-2 border border-border flex-shrink-0">
                <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
                    <div className="flex items-center gap-2 md:gap-4 grow">
                        <Package className="h-5 w-5 text-primary" />
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-lg font-bold text-primary">
                                {contextTitle}
                            </h1>
                            <Badge variant={config.mode === 'edit' ? 'default' : 'secondary'}>
                                {config.mode === 'edit' ? 'Editando' : 'Nuevo'}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {selectedItems.length > 0 && (
                            <Badge variant="accent">
                                {selectedItems.length} seleccionados
                            </Badge>
                        )}

                        {pendingChanges > 0 && (
                            <Badge variant="default">
                                {pendingChanges} cambios
                            </Badge>
                        )}

                        <Button
                            onClick={handleClose}
                            variant="ghost"
                        >
                            <X className="h-4 w-4" />
                            Cancelar
                        </Button>

                        <Button
                            onClick={handleConfirmSelection}
                            className="gap-2"
                            disabled={pendingChanges === 0}
                        >
                            <Check className="h-4 w-4" />
                            Confirmar {pendingChanges > 0 && `(${pendingChanges})`}
                        </Button>
                    </div>
                </section>
            </header>

            {/* Resizable Panels */}
            <ResizablePanelGroup
                direction="vertical"
                className="flex-1 min-h-0 overflow-hidden gap-2"
            >
                {/* Panel Superior - Selector de Ventas */}
                <ResizablePanel defaultSize={60} minSize={15}>
                    <SaleReturnList
                        selectedSales={selectedItems}
                        onSaleSelect={handleSelectSale}
                        defaultSearchMode="manual"
                        onlySelectWithStock={false}
                    />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Panel Inferior - Productos Seleccionados */}
                <ResizablePanel defaultSize={40}>
                    <Card className="h-full flex flex-col shadow-none">
                        <CardHeader className="flex-shrink-0 p-2">
                            <CardTitle className="text-base flex items-center justify-between">
                                <span>Productos Seleccionados</span>
                                {selectedItems.length > 0 && (
                                    <Badge variant="secondary">
                                        {selectedItems.length} items
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 overflow-auto p-2">
                            {selectedItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-8 text-gray-500">
                                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium">No hay productos seleccionados</p>
                                    <p className="text-sm">Selecciona una venta y agrega productos</p>
                                </div>
                            ) : (
                                <ReturnDetailTable
                                    ref={tableRef}
                                    details={selectedItems}
                                    onUpdateCantidad={handleUpdateCantidad}
                                    onUpdatePrecio={handleUpdatePrecio}
                                    onUpdateComentario={handleUpdateComentario}
                                    onRemoveProduct={handleRemoveProduct}
                                />
                            )}
                        </CardContent>
                    </Card>
                </ResizablePanel>
            </ResizablePanelGroup>

            {/* Modal de Selección de Productos */}
            <SelectSalesReturnModal
                isDialogOpen={isDialogOpen}
                onCloseDialog={handleCloseSelectDialog}
                saleId={selectedSale?.id ?? null}
                selectedProducts={selectedItems.map(item => ({
                    almacen_out_det_id: item.almacen_out_det_id,
                    cantidad: item.cantidad,
                    comentario: item.comentario
                }))}
                onConfirm={handleConfirmModal}
            />
        </main>
    );
};

export default SaleDetailSelectorWindow;