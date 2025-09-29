import { AlertDialogHeader } from "@/components/atoms/alert-dialog";
import { Badge } from "@/components/atoms/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/atoms/dialog";
import { Input } from "@/components/atoms/input";
import { apiConstructor } from "@/modules/products/services/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// Tipo de dato que responde el api
interface ProductResponse {
  id: number;
  descripcion: string;
  codigo_oem: string;
  codigo_upc: string;
  modelo: string;
  medida: string | null;
  nro_motor: string;
  categoria: string;
  subcategoria: string;
  marca: string;
  procedencia: string;
  unidad_medida: string;
  stock_actual: string;
  stock_resto: string;
  pedido_transito: string;
  pedido_almacen: string;
  precio_venta: string;
  precio_venta_alt: string;
  sucursal: string;
}

// El tipo de producto que ira en el detalle
interface PurchaseDetail {
  id_producto: string;
  cantidad: number;
  costo: number;
  inc_p_venta: number;
  precio_venta: number;
  inc_p_venta_alt: number;
  precio_venta_alt: number;
  producto: ProductResponse; // Referencia al producto original
  subtotal: number; // Calculado
}

export default function DialogSearchDetails({
  isSearchOpen,
  setIsSearchOpen,
  searchTerm,
  setSearchTerm,
  details,
  setDetails,
}: any) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [allProducts, setAllProducts] = useState<ProductResponse[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  
  // Ref para el contenedor de scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    data: productsResponse,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["products", page, pageSize, debouncedSearchTerm],
    queryFn: () => {
      const searchParam = debouncedSearchTerm
        ? `&descripcion=${encodeURIComponent(debouncedSearchTerm)}`
        : "";
      return apiConstructor({
        url: `/products?pagina=${page}&pagina_registros=${pageSize}&sucursal=1${searchParam}`,
        method: "GET",
      });
    },
    staleTime: 5 * 60 * 1000,
    enabled: isSearchOpen, // Solo hacer la petición cuando el modal esté abierto
  });

  // Agregar producto al detalle
  const addProduct = (product: ProductResponse) => {
    const existingDetail = details.find(
      (d: any) => d.id_producto === product.id.toString()
    );

    if (existingDetail) {
      return;
    }

    const costo = parseFloat(product.precio_venta) || 0;
    const inc_p_venta = 30; // 30% por defecto
    const inc_p_venta_alt = 15; // 15% por defecto

    const precio_venta = costo * (1 + inc_p_venta / 100);
    const precio_venta_alt = costo * (1 + inc_p_venta_alt / 100);

    const newDetail: PurchaseDetail = {
      id_producto: product.id.toString(),
      cantidad: 1,
      costo,
      inc_p_venta,
      precio_venta,
      inc_p_venta_alt,
      precio_venta_alt,
      producto: product,
      subtotal: costo * 1, // costo * cantidad
    };

    setDetails([...details, newDetail]);
    setIsSearchOpen(false);
    setSearchTerm("");
    setPage(1); // Reset page when closing modal
  };

  // Debounce para el término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset cuando cambia el término de búsqueda o se abre el modal
  useEffect(() => {
    if (isSearchOpen) {
      setPage(1);
      setAllProducts([]);
      setHasNextPage(true);
    }
  }, [debouncedSearchTerm, isSearchOpen]);

  // Manejar los productos cuando llega nueva data
  useEffect(() => {
    if (productsResponse && isSearchOpen) {
      if (page === 1) {
        // Si es la primera página, reemplazar todos los productos
        setAllProducts(productsResponse);
      } else {
        // Si es una página adicional, agregar a los productos existentes
        setAllProducts(prev => [...prev, ...productsResponse]);
      }
      
      // Determinar si hay más páginas (si recibimos menos productos que el pageSize, no hay más)
      setHasNextPage(productsResponse.length === pageSize);
    }
  }, [productsResponse, page, pageSize, isSearchOpen]);

  // Función para manejar el scroll infinito
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isFetching || !hasNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // Si estamos cerca del final (100px antes del final)
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setPage(prev => prev + 1);
    }
  }, [isFetching, hasNextPage]);

  // Agregar event listener para scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Auto-focus en el primer producto cuando se carguen
  useEffect(() => {
    if (allProducts.length > 0 && isSearchOpen) {
      // Esperar un tick para que el DOM se actualice
      setTimeout(() => {
        const firstProduct = document.querySelector('[tabindex="0"]') as HTMLElement;
        if (firstProduct) {
          firstProduct.focus();
        }
      }, 100);
    }
  }, [allProducts.length, isSearchOpen]);

  return ( 
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}> 
        <DialogContent className="max-w-4xl border-gray-200">
          <AlertDialogHeader>
            <DialogTitle>Buscar Productos</DialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' && allProducts.length > 0) {
                    e.preventDefault();
                    const firstProduct = document.querySelector('[data-product-index="0"]') as HTMLElement;
                    if (firstProduct) {
                      firstProduct.focus();
                    }
                  }
                }}
                className="pl-10 border-gray-200 focus:border-gray-300"
              />
            </div>

            <div
              ref={scrollContainerRef}
              className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg"
              tabIndex={-1}
            >
              {isLoading && page === 1 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">
                    Cargando productos...
                  </span>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <p>Error al cargar los productos</p>
                  <p className="text-sm mt-1">Intenta nuevamente</p>
                </div>
              ) : allProducts.length > 0 ? (
                <div className="space-y-1 p-2">
                  {allProducts.map((product: ProductResponse, index: number) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer hover:border-gray-300 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-blue-10 0"
                      onClick={() => addProduct(product)}
                      tabIndex={index === 0 ? 0 : -1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          addProduct(product);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          const nextIndex = Math.min(index + 1, allProducts.length - 1);
                          const nextElement = document.querySelector(`[data-product-index="${nextIndex}"]`) as HTMLElement;
                          if (nextElement) {
                            nextElement.focus();
                          }
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          if (index === 0) {
                            // Si estamos en el primer elemento, volver al input de búsqueda
                            const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLElement;
                            if (searchInput) {
                              searchInput.focus();
                            }
                          } else {
                            const prevIndex = Math.max(index - 1, 0);
                            const prevElement = document.querySelector(`[data-product-index="${prevIndex}"]`) as HTMLElement;
                            if (prevElement) {
                              prevElement.focus();
                            }
                          }
                        }
                      }}
                      data-product-index={index}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {product.descripcion}
                          </h4>
                          <p className="text-xs text-gray-500">
                            OEM: {product.codigo_oem} | UPC:{" "}
                            {product.codigo_upc}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="secondary"
                              className="text-xs border-gray-200"
                            >
                              {product.marca}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs border-gray-200"
                            >
                              {product.categoria}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">
                            ${product.precio_venta}
                          </p>
                            <p className="text-sm text-gray-500">
                            Stock: {parseInt(product.stock_actual, 10)} {product.unidad_medida}
                            </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isFetching && page > 1 && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500 text-sm">
                        Cargando más...
                      </span>
                    </div>
                  )}
                  
                  {!hasNextPage && allProducts.length > 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No hay más productos para mostrar
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron productos
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
};