import { Badge } from "@/components/atoms/badge"
import { Button } from "@/components/atoms/button"
import { Checkbox } from "@/components/atoms/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/atoms/dropdown-menu"
import { Label } from "@/components/atoms/label"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/atoms/resizable"
import { Switch } from "@/components/atoms/switch"
import { ColumnVisibilityDropdown } from "@/components/common/ColumnVisibilityDropdown"
import ConfirmationModal from "@/components/common/confirmationModal"
import CustomizableTable from "@/components/common/CustomizableTable"
import { ImageViewer } from "@/components/common/ImageViewer"
import Pagination from "@/components/common/pagination"
import ShortcutKey from "@/components/common/ShortcutKey"
import TooltipButton from "@/components/common/TooltipButton"
import { TooltipWrapper } from "@/components/common/TooltipWrapper"
import { useKeyboardNavigation } from "@/hooks/keyBindings/useKeyboardNavigation"
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced"
import useConfirmMutation from "@/hooks/useConfirmMutation"
import { useErrorHandler } from "@/hooks/useErrorHandler"
import { useViewConfig } from "@/hooks/useViewConfig"
import { COMMANDS, useCommands, useKeybindingKeys } from "@/keybindings"
import BottomShoppingCartBar from "@/modules/shoppingCart/components/BottomShoppingCartBar"
import { useCartWithUtils } from "@/modules/shoppingCart/hooks/useCartWithUtils"
import authSDK from "@/services/sdk-simple-auth"
import { useBranchStore } from "@/states/branchStore"
import { formatCell } from "@/utils/formatCell"
import { formatCurrency } from "@/utils/formaters"
import { type ColumnDef } from "@tanstack/react-table"
import {
    Edit,
    Eye,
    HelpCircle,
    Image,
    Loader2,
    MoreVertical,
    PackageSearch,
    RefreshCcw,
    Settings,
    X,
    Zap
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import InfiniteScroll from 'react-infinite-scroll-component'
import { useNavigate } from "react-router"
import { ProductDetailModal } from "../components/productDetail/ProductDetailModal"
import ProductFilters from "../components/productList/productFilters"
import { useDeleteProduct } from "../hooks/mutations/useDeleteProduct"
import { useProductsPaginated } from "../hooks/queries/useProductsPaginated"
import { useProductFilters } from "../hooks/useProductFilters"
import { useProductSelection } from "../hooks/useProductSelection"
import type { ProductGet } from "../types/ProductGet"
import { useCustomTable } from "@/hooks/useCustomTable"
import type { TableShoppingCartRef } from "@/modules/shoppingCart/components/tableShoppingCart"
import { useUpdateProductImage } from "../hooks/mutations/useUpdateProductImage"
import { base64ToFile } from "@/utils/base64Utils"

const ProductListScreen = () => {
    const tableRef = useRef<HTMLTableElement>(null)
    const tableShoppingCartRef = useRef<TableShoppingCartRef>(null);
    const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
    const navigate = useNavigate()
    const user = authSDK.getCurrentUser()

    const {
        config,
        isFeatureEnabled,
        getTableBehaviorValue,
        getBehaviorValue,
    } = useViewConfig('products-list');

    // Estados
    const [isInfiniteScroll, setIsInfiniteScroll] = useState(false)
    const [showFilters, setShowFilters] = useState<boolean>(
        getBehaviorValue<boolean>('showFiltersOnMount') ?? true
    )
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [imageModalOpen, setImageModalOpen] = useState(false)
    const [selectedProductForImage, setSelectedProductForImage] = useState<ProductGet | null>(null)
    const [isDraggingColumn, setIsDraggingColumn] = useState(false);
    const [searchMode, setSearchMode] = useState<'realtime' | 'manual'>(
        getBehaviorValue<'realtime' | 'manual'>('defaultSearchMode') ?? 'manual'
    );

    // Teclas de atajos
    const filter1Keys = useKeybindingKeys('tableAndFilters.filter1');
    const filter2Keys = useKeybindingKeys('tableAndFilters.filter2');
    const filter3Keys = useKeybindingKeys('tableAndFilters.filter3');
    const filter4Keys = useKeybindingKeys('tableAndFilters.filter4');
    const nextFilterKeys = useKeybindingKeys('tableAndFilters.nextFilter');

    const {
        filters,
        debouncedFilters,
        appliedFilters,
        updateFilter,
        setPage,
        resetFilters,
        applyFilters,
        setPageSize
    } = useProductFilters(Number(selectedBranchId) || 1);

    const activeFilters = searchMode === 'realtime' ? debouncedFilters : appliedFilters;

    const {
        data: productData,
        isLoading,
        error,
        isFetching,
        isError,
        refetch: refetchProducts,
        isRefetching: isRefetchingProducts,
    } = useProductsPaginated(activeFilters);

    const {
        mutate: updateProductImage,
        isPending: isUpdatingImage
    } = useUpdateProductImage({
        onSuccess: () => {
            showSuccessToast({
                title: "Imagen actualizada",
                description: "La imagen del producto se actualizó exitosamente",
            });
            // setImageModalOpen(false);
            // setSelectedProductForImage(null);
        },
        onError: (error) => {
            handleError({
                error,
                customTitle: "Error al actualizar la imagen del producto"
            });
        }
    });

    const handleSaveImage = useCallback(async (imageData: string) => {
        if (!selectedProductForImage) return;

        try {
            // Convertir base64 a File
            const file = base64ToFile(
                imageData,
                `producto-${selectedProductForImage.id}.webp`
            );

            // Llamar a la mutación
            updateProductImage({
                productId: selectedProductForImage.id,
                imageFile: file
            });
        } catch (error) {
            showErrorToast({
                title: "Error",
                description: "No se pudo procesar la imagen",
            });
        }
    }, [selectedProductForImage, updateProductImage]);

    const {
        isProductSelected,
        toggleProductSelection,
        toggleAllProductsSelection,
        getAllSelectedProducts,
        getSelectedCount,
        clearAllSelections,
        areAllProductsSelected,
    } = useProductSelection();

    const { addItemToCart, addMultipleItems, decrementQuantity } = useCartWithUtils(
        user?.name ?? '',
        selectedBranchId ?? ''
    )

    const [products, setProducts] = useState<ProductGet[]>([]);
    const { handleError } = useErrorHandler()

    // Sincronizar searchMode con configuración
    useEffect(() => {
        const defaultMode = getBehaviorValue<'realtime' | 'manual'>('defaultSearchMode');
        if (defaultMode) {
            setSearchMode(defaultMode);
        }
    }, [getBehaviorValue]);

    useEffect(() => {
        if (!productData?.data || error || isFetching) return;

        if (isInfiniteScroll && filters.pagina && filters.pagina > 1) {
            setProducts((prev) => {
                const newProducts = productData.data.filter(
                    newProduct => !prev.some(existingProduct => existingProduct.id === newProduct.id)
                );
                return [...prev, ...newProducts];
            });
        } else {
            setProducts(productData.data);
        }
    }, [productData?.data, isInfiniteScroll, filters.pagina, error, isFetching]);

    const handleResetFilters = () => {
        resetFilters()
    }

    const handleDeleteSuccess = (_data: unknown, productId: number) => {
        showSuccessToast({
            title: "Producto eliminado",
            description: `El producto #${productId} se eliminó exitosamente`,
            duration: 5000
        })
    };

    const handleDeleteError = (error: unknown, productId: number) => {
        handleError({ error, customTitle: `Error al eliminar el producto #${productId}` });
    };

    const {
        mutate: deleteProduct,
        isPending: isDeletingProduct
    } = useDeleteProduct()

    const {
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        variables: productToDelete
    } = useConfirmMutation(deleteProduct, handleDeleteSuccess, handleDeleteError)

    const getStockColor = (stock: number, stock_min: number) => {
        const lowThreshold = getBehaviorValue<number>('stockLowThreshold') ?? 10;
        const criticalThreshold = getBehaviorValue<number>('stockCriticalThreshold') ?? 5;

        const stockMin = stock_min || criticalThreshold;

        if (stock <= stockMin) return "danger"
        if (stock <= (stockMin + lowThreshold)) return "warning"
        return "success"
    }

    const handleProductDetail = useCallback(
        (productId: number) => {
            const openIn = getBehaviorValue<string>('openDetailsIn') ?? 'same-page';

            if (openIn === 'new-tab') {
                window.open(`/dashboard/productos/${productId}`, '_blank');
            } else if (openIn === 'modal') {
                setSelectedProductId(productId);
                setModalOpen(true);
            } else {
                navigate(`/dashboard/productos/${productId}`);
            }
        },
        [navigate, getBehaviorValue]
    );

    const handleUpdateProduct = useCallback((productId: number) => {
        navigate(`/dashboard/productos/${productId}/update`)
    }, [navigate])

    const handleAddItemCart = useCallback(
        (product: ProductGet) => {
            addItemToCart(product);

            const autoClose = getBehaviorValue<boolean>('autoCloseModalOnAddToCart');

            if (autoClose && modalOpen) {
                setModalOpen(false);
                setSelectedProductId(null);
            }

            setTimeout(() => {
                // Enfocar el input del producto agregado
                tableShoppingCartRef.current?.focusQuantityInputByProductId(product.id);
            }, 100);
        },
        [addItemToCart, modalOpen, getBehaviorValue]
    );

    const handleViewImage = useCallback((product: ProductGet) => {
        setSelectedProductForImage(product)
        setImageModalOpen(true)
    }, [])

    const handleAddSelectedToCart = useCallback(() => {
        const selectedProducts = getAllSelectedProducts();

        if (selectedProducts.length === 0) {
            showErrorToast({
                title: "Error al agregar los productos",
                description: `No hay productos seleccionados para agregar al carrito.`,
            })
            return;
        }

        try {
            addMultipleItems(selectedProducts);

            setTimeout(() => {
                // Enfocar el primer producto nuevo que se agregó
                if (selectedProducts.length > 0) {
                    tableShoppingCartRef.current?.focusQuantityInputByProductId(selectedProducts[0].id);
                }
            }, 100);

            clearAllSelections();
        } catch (error) {
            showErrorToast({
                title: "Error al agregar los productos",
                description: `Error al procesar productos para el carrito`,
            })
        }
    }, [getAllSelectedProducts, addMultipleItems, clearAllSelections, getBehaviorValue]);

    const columns = useMemo<ColumnDef<ProductGet>[]>(() => [
        {
            id: "Select",
            header: () => (
                <Checkbox
                    className="border border-gray-400"
                    checked={areAllProductsSelected(products)}
                    onCheckedChange={() => toggleAllProductsSelection(products)}
                    aria-label="Seleccionar todo"
                />
            ),
            cell: ({ row }) => (
                <div className="px-1">
                    <Checkbox
                        className="border border-gray-400"
                        checked={isProductSelected(row.original.id)}
                        onCheckedChange={() => toggleProductSelection(row.original)}
                        aria-label="Seleccionar fila"
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: true,
            size: 40,
            minSize: 30,
        },
        {
            accessorKey: 'id',
            header: "Cod.",
            enableSorting: true,
            enableHiding: true,
            size: 60,
            minSize: 30,
            cell: ({ getValue }) => {
                const id = getValue<number>()
                return (
                    <div className="text-center font-medium">
                        {id}
                    </div>
                )
            }
        },
        {
            accessorKey: "descripcion",
            header: "Producto",
            size: 300,
            minSize: 30,
            enableHiding: true,
            cell: ({ row, getValue }) => (
                <div
                    className="flex items-center gap-1">

                    <div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="size-6 px-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                    onKeyDown={(e) => {
                                        if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
                                            e.stopPropagation();
                                        }
                                    }}
                                >
                                    <MoreVertical className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                {isFeatureEnabled('viewDetails') && (
                                    <DropdownMenuItem onClick={() => handleProductDetail(row.original.id)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Ver detalles
                                    </DropdownMenuItem>
                                )}
                                {isFeatureEnabled('viewImage') && (
                                    <DropdownMenuItem onClick={() => handleViewImage(row.original)}>
                                        <Image className="mr-2 h-4 w-4" />
                                        Ver imagen
                                    </DropdownMenuItem>
                                )}
                                {isFeatureEnabled('editButton') && (
                                    <DropdownMenuItem onClick={() => handleUpdateProduct(row.original.id)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar producto
                                    </DropdownMenuItem>
                                )}
                                {/* <DropdownMenuItem
                                    onKeyDown={(e) => e.stopPropagation()}
                                    onClick={() => handleViewDetails(row.original.id)}>
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Ver estadisticas
                                </DropdownMenuItem> */}
                                {/* <DropdownMenuItem
                                    onKeyDown={(e) => e.stopPropagation()}
                                    onClick={() => handleAddItemCart(row.original)}>
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Agregar al carrito
                                </DropdownMenuItem> */}

                                {/* <DropdownMenuItem
                                    onKeyDown={e => e.stopPropagation()}
                                    onClick={() => handleOpenDeleteAlert(row.original.id)}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    <Trash2 className="size-4 mr-2" />
                                    Eliminar producto
                                </DropdownMenuItem> */}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div title='Presiona enter para ver los detalles'
                        className="flex flex-col">
                        <h3 className="font-medium text-primary">{getValue<string>()}</h3>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "codigo_oem",
            header: "Cód. OEM",
            size: 135,
            minSize: 30,
            cell: ({ getValue }) => (
                <div className="flex items-center justify-center">
                    <span>{formatCell(getValue<string>())}</span>
                </div>
            ),
        },
        {
            accessorKey: "codigo_upc",
            header: "Cód. UPC",
            size: 115,
            minSize: 30,
            cell: ({ getValue }) => (
                <div className="flex items-center justify-center">
                    <span>{formatCell(getValue<string>())}</span>
                </div>
            ),
        },
        {
            accessorKey: "precio_venta",
            header: "Precio Venta",
            size: 120,
            minSize: 30,
            cell: ({ row, getValue }) => {
                const showAlt = isFeatureEnabled('priceAlternative');
                const precioAlt = row.original.precio_venta_alt;

                return (
                    <div className="space-y-1 flex items-end flex-col">
                        <div className="font-bold text-green-600">{formatCurrency(getValue<number>())}</div>
                        {showAlt && (
                            <div className="flex items-center gap-1">
                                <span>Alt: {formatCurrency(precioAlt)}</span>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "stock_actual",
            header: "Stock Actual",
            size: 110,
            minSize: 30,
            cell: ({ row, getValue }) => {
                const stock = typeof getValue() === "string"
                    ? parseFloat(getValue() as string)
                    : getValue<number>();
                const stockDisplay = isFinite(stock) ? stock.toFixed(0) : "0";
                const stockMin = row.original.stock_minimo || 1;
                return (
                    <Badge
                        variant={getStockColor(stock, stockMin)}
                        className={`flex flex-col justify-center rounded`}
                    >
                        <span className="font-bold">{stockDisplay}</span>
                        <span className="text-[10px] uppercase">{row.original.unidad_medida}</span>
                    </Badge>
                );
            },
        },
        {
            accessorKey: "stock_resto",
            header: "Stock Sucursales",
            size: 100,
            minSize: 30,
            cell: ({ getValue }) => {
                const stockResto = typeof getValue() === "string"
                    ? parseFloat(getValue() as string)
                    : getValue<number>();
                const stockRestoDisplay = isFinite(stockResto) ? stockResto.toFixed(0) : "0";
                return (
                    <div className="text-center">
                        <div className="text-sm font-medium">{stockRestoDisplay}</div>
                        <span>Disponible</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "marca",
            header: "Marca",
            size: 100,
            minSize: 30,
        },
        {
            accessorKey: "categoria",
            header: "Categoría",
            size: 150,
            minSize: 30,
            cell: ({ row, getValue }) => (
                <div className="space-y-1">
                    <span className="text-blue-600 font-medium">{getValue<string>()}</span>
                    <div>{row.original.subcategoria}</div>
                </div>
            ),
        },
        {
            accessorKey: "nro_motor",
            header: "Motor/Modelo",
            size: 150,
            minSize: 30,
            cell: ({ row, getValue }) => (
                <div className="space-y-1">
                    <span className="font-medium">{formatCell(getValue<string>())}</span>
                    <div>Modelo: {formatCell(row.original.modelo)}</div>
                </div>
            ),
        },
        {
            accessorKey: "pedido_transito",
            header: "En Tránsito",
            size: 100,
            minSize: 30,
            cell: ({ getValue }) => {
                const value = typeof getValue() === "string"
                    ? parseFloat(getValue() as string)
                    : getValue<number>();
                const valueDisplay = isFinite(value) ? value.toFixed(0) : "0";
                return (
                    <div className="text-center">
                        <div className={`text-sm font-medium ${value > 0 ? "text-blue-600" : ""}`}>
                            {valueDisplay}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "pedido_almacen",
            header: "En Almacén",
            size: 100,
            minSize: 30,
            cell: ({ getValue }) => (
                <div className="text-center">
                    <div className="text-sm font-medium text-green-600">{getValue<number>()}</div>
                </div>
            ),
        },
        {
            accessorKey: "procedencia",
            header: "Origen",
            size: 100,
            minSize: 30,
        },
        {
            accessorKey: "medida",
            header: "Medida",
            size: 100,
            minSize: 30,
            cell: ({ getValue }) => {
                const value = getValue<string>()
                const formatValue = formatCell(value)
                return (
                    <div className={`${!value ? 'italic text-gray-400' : ''}`}>
                        {formatValue}
                    </div>
                )
            },

        },
        {
            accessorKey: "sucursal",
            header: "Sucursal",
            size: 100,
            minSize: 30,
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Badge className="rounded" variant="secondary">{getValue<string>()}</Badge>
                </div>
            ),
        },
    ], [
        areAllProductsSelected,
        toggleAllProductsSelection,
        isProductSelected,
        toggleProductSelection,
        handleProductDetail,
        handleViewImage,
        handleUpdateProduct
    ]);

    // const {
    //     table,
    //     resetAll,
    //     // resetColumnOrder,
    //     // resetColumnVisibility,
    //     // resetColumnSizes,
    //     // clearPersistedData,
    //     isLoadingConfig,
    // } = useCustomTable({
    //     data: products,
    //     columns,
    //     viewId: 'products-list',

    //     // Características habilitadas según config
    //     enableSorting: true,
    //     enableColumnResizing: getTableBehaviorValue('enableColumnResizing') ?? true,
    //     enableRowSelection: isFeatureEnabled('multiSelect'),
    //     enableColumnVisibility: isFeatureEnabled('columnSelector'),
    //     enableColumnOrdering: getTableBehaviorValue('enableColumnReordering') ?? true,
    //     enablePagination: isFeatureEnabled('pagination'),

    //     // Configuración desde table.behaviors
    //     columnResizeMode: getTableBehaviorValue('columnResizeMode') ?? 'onChange',
    //     initialPageSize: getTableBehaviorValue('defaultPageSize') ?? 20,

    //     // Estado inicial por defecto
    //     initialColumnVisibility: getTableBehaviorValue('columnVisibility'),
    //     defaultSortBy: [
    //         {
    //             id: getTableBehaviorValue('defaultSortField') ?? 'id',
    //             desc: getTableBehaviorValue('defaultSortOrder') === 'desc'
    //         }
    //     ],
    // });

    const {
        table,
        resetAll,
    } = useCustomTable({
        data: products,
        columns,

        // Configuración de características
        enableSorting: true,
        enableColumnResizing: getTableBehaviorValue('enableColumnResizing') ?? true,
        enableRowSelection: isFeatureEnabled('multiSelect'),
        enableColumnVisibility: isFeatureEnabled('columnSelector'),
        enableColumnOrdering: getTableBehaviorValue('enableColumnReordering') ?? true,
        enablePagination: isFeatureEnabled('pagination'),

        // Columnas ocultas por defecto
        hiddenColumns: ['Select'],

        // Configuración de resize
        columnResizeMode: "onChange",

        // Persistencia con key única por usuario
        persistenceKey: `products-table-${user?.name}`,
        persistColumnVisibility: true,
        persistColumnOrder: true,
    });

    const {
        selectedIndex,
        setSelectedIndex,
        isFocused,
        setIsFocused: setIsFocusedTable,
        hotkeys
    } = useKeyboardNavigation<ProductGet, HTMLTableElement>({
        items: products,
        containerRef: tableRef,
        isDragging: isDraggingColumn,
        // enabled: isFeatureEnabled('keyboardNavigation'),
        onPrimaryAction: (product) => {
            if (!modalOpen && isFeatureEnabled('quickView')) {
                setSelectedProductId(product.id);
                setModalOpen(true);
            }
        },
        onSecondaryAction: (product) => {
            if (isFeatureEnabled('addToCart')) {
                handleProductDetail(product.id);
            }
        },
        onDeleteAction: (product) => {
            decrementQuantity(product.id)
        },
        getItemId: (product) => product.id
    });

    const handleRowClick = (index: number) => {
        setSelectedIndex(index);
    };

    const handleRowDoubleClick = (product: ProductGet) => {
        if (isFeatureEnabled('addToCart')) {
            addItemToCart(product);
            setTimeout(() => {
                tableShoppingCartRef.current?.focusQuantityInputByProductId(product.id);
            }, 100);
        }
    };

    const onPageChange = (page: number) => {
        setPage(page);
    };

    const onShowRowsChange = (rows: number) => {
        setPageSize(rows)
    };

    const handleRefetchProducts = () => {
        refetchProducts();
    }

    const toggleShowFilters = () => {
        setShowFilters(!showFilters)
    }

    const handleResetTableConfig = () => {
        resetAll();
    }

    const handleInfiniteScrollChange = useCallback((checked: boolean) => {
        setIsInfiniteScroll(checked);
        setPage(1);
    }, [setPage]);

    const handleManualSearch = () => {
        if (searchMode === 'manual') {
            applyFilters();
        }
    };

    const toggleSearchMode = () => {
        setSearchMode(prev => prev === 'realtime' ? 'manual' : 'realtime');
    };

    const handleDragStart = useCallback(() => {
        setIsDraggingColumn(true);
    }, []);

    const handleDragEnd = useCallback(() => {
        setIsDraggingColumn(false);
    }, []);

    useHotkeys(
        'enter',
        (e) => {
            e.preventDefault();
            if (modalOpen && selectedProductId) {
                const product = products.find(p => p.id === Number(selectedProductId));
                if (product) {
                    handleAddItemCart(product);
                    setModalOpen(false);
                    setSelectedProductId(null);
                }
            }
        },
        {
            enableOnFormTags: false,
            preventDefault: true,
            enabled: modalOpen,
        },
        [modalOpen, selectedProductId, handleAddItemCart, isFeatureEnabled]
    );

    // Mostrar loading mientras carga la configuración
    // if (isLoadingConfig) {
    //     return (
    //         <main className="h-full flex items-center justify-center">
    //             <Loader2 className="size-8 animate-spin text-gray-400" />
    //         </main>
    //     );
    // }

    useCommands({
    'searchFilters.focusSearch':handleManualSearch,
    'forms.reset':handleResetFilters
    })
    return (
        <main className="h-full p-2 gap-2 flex flex-col">
            {/* Header */}
            <header className="bg-background rounded-lg p-2 space-y-2 border border-border flex-shrink-0">
                <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
                    <div className="flex items-center gap-2 md:gap-4 grow">
                        <h1 className="text-lg font-bold text-primary">Productos</h1>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Toggle de modo de búsqueda */}
                        {isFeatureEnabled('searchModeToggle') && (
                            <Button
                                variant="ghost"
                                onClick={toggleSearchMode}
                                className="text-xs h-7"
                                title={searchMode === 'realtime' ? 'Cambiar a búsqueda manual' : 'Cambiar a búsqueda en tiempo real'}
                            >
                                <Zap className={`h-3 w-3 ${searchMode === 'realtime' ? 'text-yellow-500' : 'text-gray-500'}`} />
                                {searchMode === 'realtime' ? 'Tiempo real' : 'Manual'}
                            </Button>
                        )}

                        {/* Scroll Infinito */}
                        {isFeatureEnabled('infiniteScroll') && (
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="infinite-scroll"
                                    checked={isInfiniteScroll}
                                    onCheckedChange={handleInfiniteScrollChange}
                                />
                                <Label htmlFor="infinite-scroll">
                                    {config?.features?.infiniteScroll?.label || 'Scroll Infinito'}
                                </Label>
                            </div>
                        )}

                        {/* Botón Refresh */}
                        {isFeatureEnabled('refreshButton') && (
                            <TooltipButton
                                onClick={handleRefetchProducts}
                                buttonProps={{
                                    className: 'w-8',
                                    disabled: isRefetchingProducts || isFetching,
                                }}
                                tooltip={config?.features?.refreshButton?.description || "Recargar productos"}
                            >
                                <RefreshCcw className={`size-4 ${isRefetchingProducts || isFetching ? 'animate-spin' : ''}`} />
                            </TooltipButton>
                        )}

                        {/* Resetear Tabla */}
                        {isFeatureEnabled('resetTableButton') && (
                            <TooltipButton
                                onClick={handleResetTableConfig}
                                buttonProps={{
                                    variant: 'outline',
                                    size: 'sm',
                                }}
                                tooltip={config?.features?.resetTableButton?.description || "Resetear tabla"}
                            >
                                <Settings className="h-4 w-4" />
                                {config?.features?.resetTableButton?.label || 'Resetear Tabla'}
                            </TooltipButton>
                        )}

                        {/* Toggle Filtros */}
                        {isFeatureEnabled('hideFiltersButton') && (
                            <Button variant={'outline'} onClick={toggleShowFilters}>
                                {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                            </Button>
                        )}

                        {/* Limpiar Filtros */}
                        {isFeatureEnabled('newSearchButton') && (
                            <Button onClick={handleResetFilters}>
                                <PackageSearch className="h-4 w-4" />
                                Nueva búsqueda
                            </Button>
                        )}

                        {/* Ayuda de Filtros */}
                        {isFeatureEnabled('filterShortcutsHelp') && (
                            <TooltipWrapper
                                tooltipContentProps={{
                                    align: 'end',
                                    className: 'max-w-xs'
                                }}
                                tooltip={
                                    <div className="flex flex-col space-y-3">
                                        <div className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                            Atajos de teclado
                                        </div>
                                        <div className="space-y-1.5">
                                            <h4 className="text-xs font-medium text-gray-700 tracking-wide">Navegación filtros</h4>
                                            <div className="space-y-1 text-gray-600 text-xs">
                                                <p><ShortcutKey combo={filter1Keys} />{COMMANDS['tableAndFilters.filter1'].description}: Categoria</p>
                                                <p><ShortcutKey combo={filter2Keys} />{COMMANDS['tableAndFilters.filter2'].description}: Descripción</p>
                                                <p><ShortcutKey combo={filter3Keys} />{COMMANDS['tableAndFilters.filter3'].description}: Cod. OEM</p>
                                                <p><ShortcutKey combo={filter4Keys} />{COMMANDS['tableAndFilters.filter4'].description}: Cod. Upc</p>
                                                <p><ShortcutKey combo={nextFilterKeys} />{COMMANDS['tableAndFilters.nextFilter'].description}</p>
                                            </div>
                                        </div>
                                    </div>
                                }
                            >
                                <span className="border-border border h-8 w-8 px-1 rounded-md flex items-center justify-center cursor-help hover:bg-accent">
                                    <HelpCircle />
                                </span>
                            </TooltipWrapper>
                        )}
                    </div>
                </section>

                {/* Filtros */}
                {isFeatureEnabled('searchBar') && showFilters && (
                    <ProductFilters
                        filters={filters}
                        updateFilter={updateFilter}
                        showSubcategories={isFeatureEnabled('advancedFilters')}
                        handleManualSearch={handleManualSearch}
                        searchMode={searchMode}
                    />
                )}
            </header>

            <ResizablePanelGroup
                direction="vertical"
                className="flex-1 min-h-screen md:min-h-0 overflow-hidden gap-1"
            >
                <ResizablePanel
                    className="bg-background rounded-lg border border-border"
                    defaultSize={50}
                >
                    <div className="h-full flex flex-col">
                        {/* Results Info */}
                        <div className="p-2 text-sm text-gray-600 border-b border-border flex-shrink-0 flex items-center justify-between">
                            {products.length > 0 ? (
                                isInfiniteScroll ? (
                                    `Mostrando ${products.length} de ${productData?.meta.total} productos`
                                ) : (
                                    (() => {
                                        const pagina = filters.pagina ?? 1;
                                        const porPagina = filters.pagina_registros ?? 1;
                                        const inicio = (pagina - 1) * porPagina + 1;
                                        const fin = pagina * porPagina;
                                        return `Mostrando ${inicio} - ${fin} de ${productData?.meta.total} productos`;
                                    })()
                                )
                            ) : (
                                <span>Cargando...</span>
                            )}

                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Selector de Columnas */}
                                {isFeatureEnabled('columnSelector') && (
                                    <ColumnVisibilityDropdown table={table} />
                                )}

                                {/* Acciones de Selección Múltiple */}
                                {isFeatureEnabled('bulkAddToCart') && getSelectedCount() > 0 && (
                                    <>
                                        <Button variant="outline" onClick={clearAllSelections}>
                                            <X className="size-4" />
                                            Limpiar ({getSelectedCount()})
                                        </Button>
                                        <Button className="relative" onClick={handleAddSelectedToCart}>
                                            Agregar al carrito
                                            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                                                {getSelectedCount()}
                                            </Badge>
                                        </Button>
                                    </>
                                )}

                                {/* Ayuda de Atajos de Teclado */}
                                {isFeatureEnabled('keyboardShortcutsHelp') && (
                                    <TooltipWrapper
                                        tooltipContentProps={{
                                            align: 'end',
                                            className: 'max-w-xs'
                                        }}
                                        tooltip={
                                            <div className="flex flex-col space-y-3">
                                                <div className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                                    Atajos de teclado
                                                </div>
                                                <div className="space-y-1.5">
                                                    <h4 className="text-xs font-medium text-gray-700 tracking-wide">Navegación</h4>
                                                    <div className="space-y-1 text-gray-600 text-xs">
                                                        <p><ShortcutKey combo={hotkeys.activate ?? ''} /> Activar tabla </p>
                                                        <p><ShortcutKey combo={hotkeys.deactivate ?? ''} /> Salir de tabla </p>
                                                        <p><ShortcutKey combo={hotkeys.moveUp ?? ''} /> / <ShortcutKey combo={hotkeys.moveDown ?? ''} /> Navegar filas </p>
                                                        <p><ShortcutKey combo={hotkeys.navigate ?? ''} /> Cambiar columna</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <h4 className="text-xs font-medium text-blue-600 tracking-wide">Acciones</h4>
                                                    <div className="space-y-1 text-gray-600 text-xs">
                                                        <p><ShortcutKey combo={hotkeys.primaryAction ?? ''} /> Detalle de producto </p>
                                                        <p><ShortcutKey combo={hotkeys.secondaryAction ?? ''} /> Agregar al carrito </p>
                                                        <p><ShortcutKey combo={'ctrl+d'} /> Abrir modal de producto </p>
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                    >
                                        <span className="border-border border h-8 w-8 px-1 rounded-md flex items-center justify-center cursor-help hover:bg-accent">
                                            <HelpCircle />
                                        </span>
                                    </TooltipWrapper>
                                )}
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="flex-1 min-h-0">
                            {isInfiniteScroll ? (
                                <div className="h-full overflow-auto relative" id="product-list-scroll-container">
                                    <InfiniteScroll
                                        dataLength={products.length}
                                        next={() => setPage((filters.pagina || 1) + 1)}
                                        hasMore={products.length < (productData?.meta.total || 0)}
                                        loader={
                                            <div className="flex items-center justify-center gap-2 text-center p-6 text-xs sm:text-sm text-gray-500 bg-gray-50">
                                                <Loader2 className="size-4 animate-spin" />
                                                Cargando más productos...
                                            </div>
                                        }
                                        scrollableTarget="product-list-scroll-container"
                                    >
                                        <CustomizableTable
                                            table={table}
                                            isError={isError}
                                            errorMessage="Ocurrió un error al cargar los productos"
                                            isLoading={isLoading}
                                            rows={filters.pagina_registros}
                                            noDataMessage="No se encontraron productos"
                                            selectedRowIndex={selectedIndex}
                                            onRowClick={handleRowClick}
                                            onRowDoubleClick={handleRowDoubleClick}
                                            tableRef={tableRef}
                                            focused={isFocused}
                                            keyboardNavigationEnabled={isFeatureEnabled('keyboardNavigation')}
                                            enableColumnReordering={getBehaviorValue<boolean>('enableColumnReordering') ?? true}
                                            enableSorting={false}
                                            onDragEnd={handleDragEnd}
                                            onDragStart={handleDragStart}
                                        />
                                    </InfiniteScroll>
                                </div>
                            ) : (
                                <CustomizableTable
                                    table={table}
                                    isError={isError}
                                    isFetching={isFetching}
                                    isLoading={isLoading}
                                    errorMessage="Ocurrió un error al cargar los productos"
                                    rows={filters.pagina_registros}
                                    noDataMessage="No se encontraron productos"
                                    selectedRowIndex={selectedIndex}
                                    onRowClick={handleRowClick}
                                    onRowDoubleClick={handleRowDoubleClick}
                                    tableRef={tableRef}
                                    focused={isFocused}
                                    keyboardNavigationEnabled={isFeatureEnabled('keyboardNavigation')}
                                    enableColumnReordering={getBehaviorValue<boolean>('enableColumnReordering') ?? true}
                                    enableSorting={false}
                                    onDragEnd={handleDragEnd}
                                    onDragStart={handleDragStart}
                                />
                            )}
                        </div>

                        {/* Paginación */}
                        {isFeatureEnabled('pagination') && !isInfiniteScroll && (productData?.data?.length ?? 0) > 0 && (
                            <Pagination
                                currentPage={filters.pagina || 1}
                                onPageChange={onPageChange}
                                totalData={productData?.meta.total || 1}
                                onShowRowsChange={onShowRowsChange}
                                showRows={filters.pagina_registros}
                            />
                        )}
                    </div>
                </ResizablePanel>

                {
                    isFeatureEnabled('bottomShoppingCartPanel') && (
                        <>
                            <ResizableHandle withHandle />

                            <ResizablePanel defaultSize={50}>
                                <BottomShoppingCartBar
                                    tableRef={tableShoppingCartRef}
                                    callback={() => setIsFocusedTable(false)} />
                            </ResizablePanel>
                        </>
                    )
                }
            </ResizablePanelGroup>

            {/* Modales */}
            {isFeatureEnabled('deleteButton') && (
                <ConfirmationModal
                    isOpen={showDeleteAlert}
                    title="Eliminar producto"
                    message={`¿Estás seguro de que deseas eliminar el producto #${productToDelete}?`}
                    onClose={handleCloseDeleteAlert}
                    onConfirm={handleConfirmDeleteAlert}
                    isLoading={isDeletingProduct}
                />
            )}

            {isFeatureEnabled('viewDetails') && (
                <ProductDetailModal
                    productId={Number(selectedProductId)}
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    tableRef={tableShoppingCartRef}
                />
            )}

            {imageModalOpen && selectedProductForImage && (
                <ImageViewer
                    open={imageModalOpen}
                    onOpenChange={(open) => {
                        setImageModalOpen(open);
                        if (!open) setSelectedProductForImage(null);
                    }}
                    imageSrc={selectedProductForImage.imagen || undefined}
                    editMode={!selectedProductForImage.imagen}
                    title={selectedProductForImage.descripcion}
                    onSave={handleSaveImage}
                    imageMetadata={{
                        fileName: selectedProductForImage.imagen_name,
                        fileExtension: selectedProductForImage.imagen_ext,
                    }}
                    isLoading={isUpdatingImage}
                />
            )}
        </main>
    )
}

export default ProductListScreen;