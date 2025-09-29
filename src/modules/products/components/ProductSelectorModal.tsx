import { AlertDialogHeader } from "@/components/atoms/alert-dialog";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "@/components/atoms/dialog";
import { Plus, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useRef, useCallback, type Dispatch, type SetStateAction } from "react";
import type { ProductGet } from "../types/ProductGet";
import { useProductsPaginated } from "../hooks/queries/useProductsPaginated";
import { useProductFilters } from "../hooks/useProductFilters";
import { useBranchStore } from "@/states/branchStore";
import InfiniteScroll from "react-infinite-scroll-component";
import { formatCurrency } from "@/utils/formaters";
import NoDataComponent from "@/components/common/noDataComponent";
import { Checkbox } from "@/components/atoms/checkbox";
import { DialogDescription } from "@radix-ui/react-dialog";
import ProductFilters from "./productList/productFilters";
import ErrorDataComponent from "@/components/common/errorDataComponent";

interface ProductSelectorModalProps {
    isSearchOpen: boolean
    setIsSearchOpen: Dispatch<SetStateAction<boolean>>
    addItem: (product: ProductGet) => void
    addMultipleItem: (products: ProductGet[]) => void
    onlyWithStock?: boolean
}

const ProductSelectorModal: React.FC<ProductSelectorModalProps> = ({
    isSearchOpen,
    setIsSearchOpen,
    addItem,
    addMultipleItem,
    onlyWithStock = false,
}) => {
    const [products, setProducts] = useState<ProductGet[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<ProductGet[]>([]);
    const [isAutoLoading, setIsAutoLoading] = useState(false);
    const autoLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { selectedBranchId } = useBranchStore();
    const {
        filters,
        setPage,
        updateFilter,
        resetFilters,
        debouncedFilters,
    } = useProductFilters(Number(selectedBranchId) || 0);

    const {
        data: productsResponse,
        isLoading,
        isFetching,
        error,
    } = useProductsPaginated(debouncedFilters);

    const addProduct = (product: ProductGet) => {
        addItem(product);
        setIsSearchOpen(false);
    };

    const currentPageProducts = productsResponse?.data || [];

    const totalPages = Math.ceil((productsResponse?.meta.total || 0) / filters.pagina_registros);
    const hasMorePages = filters.pagina < totalPages;

    // Función para cargar automáticamente más páginas si hay pocos productos con stock
    const autoLoadMoreIfNeeded = useCallback(() => {
        if (!onlyWithStock || !hasMorePages || isLoading || isFetching || isAutoLoading) return;

        const currentVisibleProducts = products.filter(p => p.stock_actual > 0);
        const minProductsToShow = 10;

        if (currentVisibleProducts.length < minProductsToShow && hasMorePages) {
            setIsAutoLoading(true);

            if (autoLoadTimeoutRef.current) {
                clearTimeout(autoLoadTimeoutRef.current);
            }

            autoLoadTimeoutRef.current = setTimeout(() => {
                setPage((filters.pagina || 1) + 1);
                setIsAutoLoading(false);
            }, 300);
        }
    }, [onlyWithStock, hasMorePages, isLoading, isFetching, isAutoLoading, products, setPage]);

    useEffect(() => {
        if (!currentPageProducts || error || isFetching) return;

        if (filters.pagina && filters.pagina > 1) {
            setProducts((prev) => {
                const merged = [...prev, ...currentPageProducts];
                // Quitar duplicados por id
                const unique = merged.filter(
                    (item, index, self) => index === self.findIndex((p) => p.id === item.id)
                );
                return unique;
            });
        } else {
            setProducts(currentPageProducts);
        }

        // Auto-cargar más páginas si es necesario
        setTimeout(() => autoLoadMoreIfNeeded(), 100);
    }, [currentPageProducts, filters.pagina, error, isFetching]);

    // Limpiar timeout al desmontar
    useEffect(() => {
        return () => {
            if (autoLoadTimeoutRef.current) {
                clearTimeout(autoLoadTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isSearchOpen) {
            // Solo resetear filtros cuando se ABRE el modal
            resetFilters();
            setSelectedProducts([]);
            setProducts([]); // Limpiar productos acumulados
        }
    }, [isSearchOpen, resetFilters]);

    useEffect(() => {
        if (isSearchOpen && onlyWithStock && !isLoading && !isFetching && products.length > 0) {
            // Usar timeout para permitir que se actualice el estado primero
            const timeoutId = setTimeout(() => {
                autoLoadMoreIfNeeded();
            }, 500); // Aumenté a 500ms para dar más tiempo

            return () => clearTimeout(timeoutId);
        }
    }, [isSearchOpen, onlyWithStock, products.length, isLoading, isFetching, autoLoadMoreIfNeeded]);

    useEffect(() => {
        if (isSearchOpen && onlyWithStock && !isLoading && !isFetching) {
            const timeoutId = setTimeout(() => {
                autoLoadMoreIfNeeded();
            }, 200);

            return () => clearTimeout(timeoutId);
        }
    }, [products, isSearchOpen, onlyWithStock, isLoading, isFetching, autoLoadMoreIfNeeded]);

    const handleToggleSelectedProduct = (product: ProductGet) => {
        setSelectedProducts((prev) => {
            const existingProduct = prev.find((p) => p.id === product.id);
            if (existingProduct) {
                return prev.filter((p) => p.id !== product.id);
            }
            return [...prev, product];
        });
    };

    const handleAddMultipleItems = () => {
        addMultipleItem(selectedProducts);
        setIsSearchOpen(false);
    };

    const handleLoadMore = () => {
        if (!isFetching && hasMorePages) {
            setPage((filters.pagina || 1) + 1);
        }
    };

    const visibleProducts = useMemo(() => {
        return onlyWithStock
            ? products.filter(p => p.stock_actual > 0)
            : products;
    }, [products, onlyWithStock]);

    // Determinar si hay más productos para mostrar
    const hasMoreToShow = hasMorePages || (onlyWithStock && products.length > visibleProducts.length);

    return (
        <section className="flex flex-wrap items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
                Detalle de Productos
            </h3>
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogTrigger asChild>
                    <Button
                        className="bg-black hover:bg-gray-800 text-white"
                        size="sm"
                        title="Seleccionar Productos"
                    >
                        <Plus className="size-4" />
                        <span className="hidden sm:block">Seleccionar Productos</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl border-gray-200 p-2 md:p-4 max-h-full" aria-describedby="Seleccionar productos">
                    <AlertDialogHeader className="text-start">
                        <DialogTitle>Seleccionar Productos</DialogTitle>
                    </AlertDialogHeader>
                    <DialogDescription className="text-gray-500 text-sm -mt-2">
                        {!onlyWithStock && "Seleccionar productos para agregar"}
                        {onlyWithStock && (
                            <span className="text-blue-600 font-medium">
                                Mostrando solo productos con stock disponible
                            </span>
                        )}
                    </DialogDescription>
                    <div className="space-y-2">
                        <ProductFilters
                            filters={filters}
                            updateFilter={updateFilter}
                        />

                        <div
                            id="products-scroll-container"
                            className="max-h-96 overflow-y-auto rounded-lg"
                        >
                            {isLoading && filters.pagina === 1 ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                    <span className="ml-2 text-gray-500">
                                        Cargando productos...
                                    </span>
                                </div>
                            ) : error ? (
                                <ErrorDataComponent
                                    errorMessage="Error al cargar los productos"
                                />
                            ) : visibleProducts.length > 0 ? (
                                <InfiniteScroll
                                    dataLength={visibleProducts.length}
                                    next={handleLoadMore}
                                    hasMore={hasMoreToShow}
                                    loader={
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                            <span className="ml-2 text-gray-500 text-sm">
                                                {isAutoLoading
                                                    ? "Buscando más productos con stock..."
                                                    : "Cargando más productos..."
                                                }
                                            </span>
                                        </div>
                                    }
                                    scrollableTarget="products-scroll-container"
                                    scrollThreshold={0.8}
                                >
                                    <div className="space-y-1 p-2">
                                        {visibleProducts.map((product) => {
                                            const isSelected = selectedProducts.some((p) => p.id === product.id);
                                            return (
                                                <article
                                                    key={product.id}
                                                    className={`rounded-lg p-2 hover:bg-gray-100 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                                                    onDoubleClick={() => addProduct(product)}
                                                    onClick={() => handleToggleSelectedProduct(product)}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => handleToggleSelectedProduct(product)}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-xs sm:text-sm">
                                                                {product.descripcion}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 hidden sm:block">
                                                                OEM: {product.codigo_oem} | UPC:{" "}
                                                                {product.codigo_upc}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge
                                                                    variant="accent"
                                                                    className="text-[10px] sm:text-xs"
                                                                >
                                                                    {product.categoria}
                                                                </Badge>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-gray-200 text-[10px] sm:text-xs"
                                                                >
                                                                    {product.marca}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs sm:text-sm font-bold text-green-600">
                                                                {formatCurrency(product.precio_venta)}
                                                            </p>
                                                            <Badge
                                                                className="text-[10px] sm:text-xs"
                                                                variant={product.stock_actual > 0 ? 'default' : 'destructive'}
                                                            >
                                                                {`${product.stock_actual} ${product.unidad_medida}`}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}

                                        {!hasMoreToShow && (
                                            <div className="text-center py-4 text-gray-500 text-sm">
                                                {onlyWithStock
                                                    ? "No hay más productos con stock disponible"
                                                    : "No hay más productos para mostrar"
                                                }
                                            </div>
                                        )}
                                    </div>
                                </InfiniteScroll>
                            ) : (
                                <NoDataComponent
                                    message={onlyWithStock ? "No se encontraron productos con stock" : "No se encontraron productos"}
                                    description="Intenta nuevamente con otro término de búsqueda"
                                />
                            )}
                        </div>
                    </div>
                    <DialogFooter className="gap-1">
                        <Button
                            variant={'outline'}
                            onClick={() => setIsSearchOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAddMultipleItems}
                            disabled={selectedProducts.length === 0}
                        >
                            <Plus className="size-4" />
                            {`Agregar ${selectedProducts.length > 0 ? `(${selectedProducts.length})` : ''}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
};
export default ProductSelectorModal;