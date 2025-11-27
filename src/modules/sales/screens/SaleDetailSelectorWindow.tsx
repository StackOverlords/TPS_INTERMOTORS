import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/atoms/resizable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { showSuccessToast, showErrorToast } from '@/hooks/use-toast-enhanced';
import { emitToWindow } from '@/utils/tauriWindows';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Check, Package, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SaleGetAll, SaleItemGetById } from '@/modules/sales/types/salesGetResponse';
import SaleReturnList from '@/modules/returns/components/SalesReturnList';
import SelectSalesReturnModal from '@/modules/returns/components/SelectSalesReturnModal';
import ReturnDetailTable, { type ReturnDetailTableRef } from '@/modules/returns/components/returnDetailTable';
import type { UIReturnDetailCreate } from '@/modules/returns/types/returnCreate.types';

interface WindowConfig {
    windowId: string;
    context: string;
    mode: 'create' | 'edit';
    selectedItems: UIReturnDetailCreate[];
}

interface SelectedItemWithSale extends UIReturnDetailCreate {
    sale_id: number;
}

const SaleDetailSelectorWindow = () => {
    const currentWindow = getCurrentWebviewWindow();
    const tableRef = useRef<ReturnDetailTableRef>(null);

    const config: WindowConfig = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const selectedItemsParam = params.get('selectedItems');
        let selectedItems: UIReturnDetailCreate[] = [];

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

    // Inicializar items seleccionados desde config
    useEffect(() => {
        if (config.selectedItems.length > 0) {
            const itemsWithSaleId = config.selectedItems.map(item => ({
                ...item,
                sale_id: 0 // Se actualizará cuando se seleccione una venta
            }));
            setSelectedItems(itemsWithSaleId);
        }
    }, [config.selectedItems]);

    const handleSelectSale = useCallback((sale: SaleGetAll) => {
        setSelectedSale(sale);
        setIsDialogOpen(true);
    }, []);

    const handleCloseSelectDialog = useCallback(() => {
        setIsDialogOpen(false);
        setSelectedSale(null);
    }, []);

    const handleAddProductItem = useCallback((product: SaleItemGetById, saleId: number) => {
        const newItem: SelectedItemWithSale = {
            almacen_out_det_id: product.id,
            cantidad: 1,
            precio: product.precio,
            comentario: '',
            sale_id: saleId,
            product: {
                id: product.producto.id,
                descripcion: product.producto.descripcion,
                codigo_oem: product.producto.codigo_oem || '',
                codigo_upc: product.producto.codigo_upc || '',
                precio_venta: product.precio,
            }
        };

        setSelectedItems(prev => {
            const exists = prev.find(item => item.almacen_out_det_id === newItem.almacen_out_det_id);
            if (exists) {
                return prev;
            }
            return [...prev, newItem];
        });

        showSuccessToast({
            title: 'Producto agregado',
            description: product.producto.descripcion,
            duration: 2000
        });

        // Enfocar el primer input de cantidad después de agregar
        setTimeout(() => {
            tableRef.current?.focusFirstQuantityInput();
        }, 100);
    }, []);

    const handleUpdateCantidad = useCallback((id_detalle: number, cantidad: number) => {
        setSelectedItems(prev =>
            prev.map(item =>
                item.almacen_out_det_id === id_detalle
                    ? { ...item, cantidad }
                    : item
            )
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
        setSelectedItems(prev => prev.filter(item => item.almacen_out_det_id !== id_detalle));
    }, []);

    const handleConfirmSelection = useCallback(async () => {
        if (selectedItems.length === 0) {
            showErrorToast({
                title: 'Sin productos',
                description: 'No has seleccionado ningún producto',
                duration: 3000
            });
            return;
        }

        showSuccessToast({
            title: 'Productos confirmados',
            description: `${selectedItems.length} producto${selectedItems.length !== 1 ? 's' : ''} seleccionado${selectedItems.length !== 1 ? 's' : ''}`,
            duration: 2000
        });

        await emitToWindow(
            config.windowId,
            'sale-details-multi-selected',
            selectedItems
        );

        await currentWindow.close();
    }, [selectedItems, config.windowId, currentWindow]);

    const handleClose = useCallback(async () => {
        await emitToWindow(config.windowId, 'window-closed', { canceled: true });
        await currentWindow.close();
    }, [config.windowId, currentWindow]);

    const handleConfirmModal = useCallback(() => {
        setIsDialogOpen(false);
        setSelectedSale(null);
    }, []);

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

                        <Button
                            onClick={handleClose}
                            variant="ghost"
                        >
                            <X className="h-4 w-4" />
                            Cancelar
                        </Button>

                        {selectedItems.length > 0 && (
                            <Button
                                onClick={handleConfirmSelection}
                                className="gap-2"
                            >
                                <Check className="h-4 w-4" />
                                Confirmar Selección
                            </Button>
                        )}
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
                onProductSelect={handleAddProductItem}
                selectedProducts={selectedItems}
                onConfirm={handleConfirmModal}
            />
        </main>
    );
};

export default SaleDetailSelectorWindow;