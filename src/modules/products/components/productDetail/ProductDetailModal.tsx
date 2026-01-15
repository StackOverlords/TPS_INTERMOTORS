import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { useBranchStore } from "@/states/branchStore";
import authSDK from "@/services/sdk-simple-auth";
import { useEffect, useState } from "react";
import { useCartWithUtils } from "@/modules/shoppingCart/hooks/useCartWithUtils";
import { useProductsPaginated } from "../../hooks/queries/useProductsPaginated";
import { useProductById } from "../../hooks/queries/useProductById";
import { useProductSalesStats } from "../../hooks/queries/useProductSalesStats";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import ProductSales from "./ProductSales";
import { MapPin, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Skeleton } from "@/components/atoms/skeleton";
import ProductInventory from "./ProductInventory";
import { useProductStock } from "../../hooks/queries/useProductStock";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/atoms/resizable";
import ProductTableOverview from "./productTableOverview";
import type { TableShoppingCartRef } from "@/modules/shoppingCart/components/tableShoppingCart";
import ProductLogistics from "./ProductLogistics";
import { useProductProviderOrders } from "../../hooks/queries/useProductProviderOrders";
import type { ProductStock } from "../../types/productStock";
import UpdatePurchaseDetailPricesFormModal from "@/modules/purchases/components/UpdatePurchaseDetailPricesFormModal";

interface ProductDetailModalProps {
  productId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableRef: React.RefObject<TableShoppingCartRef | null>;
}

export const ProductDetailModal = ({
  productId,
  open,
  onOpenChange,
  tableRef,
}: ProductDetailModalProps) => {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const user = authSDK.getCurrentUser();
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<number>(
    Number(selectedBranchId)
  );

  // Estado para el modal de actualización de precios
  const [updatePriceModalOpen, setUpdatePriceModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ProductStock | null>(
    null
  );
  const [selectedBranchType, setSelectedBranchType] = useState<
    "current" | "other"
  >("current");

  const { addItemToCart } = useCartWithUtils(
    user?.name || "",
    selectedBranchId ?? ""
  );

  const [gestiones, setGestiones] = useState<{
    gestion_1: number;
    gestion_2: number;
  }>({
    gestion_1: new Date().getFullYear() - 1,
    gestion_2: new Date().getFullYear(),
  });

  const { data: productForCart } = useProductsPaginated({
    producto: Number(productId),
    sucursal: Number(selectedBranchId),
    pagina_registros: 1,
    pagina: 1,
  });

  const {
    data: product,
    isError: isErrorProduct,
    refetch: refetchProduct,
    isLoading: isLoadingProduct,
    isFetching: isFetchingProduct,
  } = useProductById(Number(productId));

  const {
    data: twoYearSalesData,
    isLoading: isLoadingTwoYearSalesData,
    isError: isErrorTwoYearSalesData,
    isFetching: isFetchingTwoYearSalesData,
  } = useProductSalesStats({
    producto: Number(productId),
    sucursal: sucursalSeleccionada,
    gestion_1: gestiones.gestion_1,
    gestion_2: gestiones.gestion_2,
  });

  const {
    data: productStockSucursalesData,
    isError: isErrorStockSucursalesData,
    isLoading: isLoadingStockSucursalesData,
    refetch: refetchStockSucursales,
  } = useProductStock({
    producto: Number(productId),
    sucursal: sucursalSeleccionada,
    resto_only: 1,
  });

  const {
    data: productStockLocalData,
    isError: isErrorStockLocalData,
    isFetching: isFetchingStockLocalData,
    isLoading: isLoadingStockLocalData,
    refetch: refetchStockLocal,
  } = useProductStock({
    producto: Number(productId),
    sucursal: sucursalSeleccionada,
    resto_only: 0,
  });

  const {
    data: productProviderOrders,
    isError: isErrorProviderOrders,
    isLoading: isLoadingProviderOrders,
    isFetching: isFetchingProviderOrders,
  } = useProductProviderOrders({
    producto: Number(productId),
    sucursal: sucursalSeleccionada,
  });

  useEffect(() => {
    setSucursalSeleccionada(Number(selectedBranchId));
  }, [selectedBranchId]);

  const handleChangeGestion1 = (value: string) => {
    setGestiones((prev) => ({
      ...prev,
      gestion_1: parseInt(value),
    }));
  };
  const handleChangeGestion2 = (value: string) => {
    setGestiones((prev) => ({
      ...prev,
      gestion_2: parseInt(value),
    }));
  };

  const handleAddItemCart = () => {
    const productData = productForCart?.data[0];
    if (!productData) return;

    addItemToCart(productData);

    setTimeout(() => {
      tableRef.current?.focusQuantityInputByProductId(productData.id);
    }, 100);
    onOpenChange(false);
  };

  const handleRetry = () => {
    refetchProduct();
  };

  // Manejadores para abrir el modal de actualización de precios
  const handleEditPriceCurrentBranch = (detail: ProductStock) => {
    setSelectedDetail(detail);
    setSelectedBranchType("current");
    setUpdatePriceModalOpen(true);
  };

  const handleEditPriceOtherBranches = (detail: ProductStock) => {
    setSelectedDetail(detail);
    setSelectedBranchType("other");
    setUpdatePriceModalOpen(true);
  };

  const handleCloseUpdatePriceModal = (open: boolean) => {
    setUpdatePriceModalOpen(open);
    if (!open) {
      // Refrescar los datos cuando se cierra el modal
      refetchStockLocal();
      refetchStockSucursales();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[90%] h-[90vh] overflow-auto p-2"
          aria-describedby="Estadisticas del producto"
        >
          {isErrorProduct || !Number(productId) ? (
            <ErrorDataComponent
              errorMessage="No se pudo cargar el producto. Por favor, inténtalo de nuevo más tarde."
              showButtonIcon={false}
              onRetry={handleRetry}
            />
          ) : (
            <div className="h-full flex flex-col gap-2 overflow-hidden">
              <DialogHeader className="px-2 pt-2 flex-shrink-0">
                <div className="flex items-start flex-wrap md:flex-nowrap gap-2 justify-between">
                  <div className="space-y-2">
                    <DialogTitle className="text-base md:text-xl font-bold">
                      {isLoadingProduct || isFetchingProduct ? (
                        <Skeleton className="p-3 w-full sm:w-80" />
                      ) : (
                        product?.descripcion
                      )}
                    </DialogTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Branch Selector */}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 ml-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Sucursal:
                      </span>
                      {user?.sucursales &&
                        user?.sucursales.map((sucursal) => (
                          <Button
                            key={sucursal.id}
                            variant={
                              sucursalSeleccionada === sucursal.id
                                ? "default"
                                : "ghost"
                            }
                            onClick={() => setSucursalSeleccionada(sucursal.id)}
                          >
                            {sucursal.sigla}
                          </Button>
                        ))}
                      <Button
                        disabled={
                          !productForCart?.data ||
                          productForCart.data.length === 0 ||
                          !productForCart.data[0] ||
                          productForCart.data[0].stock_actual <= 0
                        }
                        size={"sm"}
                        className="cursor-pointer"
                        onClick={handleAddItemCart}
                        autoFocus
                      >
                        <ShoppingCart className="size-4" />
                        Agregar al carrito
                      </Button>
                      <Button
                        variant={"ghost"}
                        size={"icon"}
                        onClick={() => onOpenChange(false)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 h-full overflow-hidden">
                  <div className="md:col-span-2 flex flex-col gap-2 h-full overflow-auto">
                    <div className="flex-shrink-0">
                      <ProductSales
                        isLoadingData={isLoadingTwoYearSalesData}
                        gestion_1={gestiones.gestion_1}
                        gestion_2={gestiones.gestion_2}
                        handleChangeGestion1={handleChangeGestion1}
                        handleChangeGestion2={handleChangeGestion2}
                        productSalesData={
                          twoYearSalesData ?? {
                            meta: { getion_1: "", getion_2: "" },
                            data: [],
                          }
                        }
                        isErrorData={isErrorTwoYearSalesData}
                        isFetchingData={isFetchingTwoYearSalesData}
                        showComparisonColumns={false}
                      />
                    </div>
                    <div className="flex-1 min-h-0">
                      <ProductLogistics
                        ProductProviderOrders={productProviderOrders ?? []}
                        isErrorData={isErrorProviderOrders}
                        isLoadingData={isLoadingProviderOrders}
                        isFetchingData={isFetchingProviderOrders}
                        className="h-full"
                        sortByDate={true}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-3 h-full flex flex-col">
                    <ResizablePanelGroup
                      direction="vertical"
                      className="flex-1 min-h-screen md:min-h-0 overflow-hidden gap-1"
                    >
                      <ResizablePanel defaultSize={50}>
                        <ProductTableOverview
                          productStockData={productStockLocalData ?? []}
                          isError={isErrorStockLocalData}
                          isFetching={isFetchingStockLocalData}
                          isLoading={isLoadingStockLocalData}
                          className="h-full"
                          filterByStock={true}
                          sortByDate={true}
                          onEditPrice={handleEditPriceCurrentBranch}
                        />
                      </ResizablePanel>

                      <ResizableHandle withHandle />

                      <ResizablePanel defaultSize={50}>
                        <ProductInventory
                          productStockData={productStockSucursalesData ?? []}
                          isErrorData={isErrorStockSucursalesData}
                          isLoadingData={isLoadingStockSucursalesData}
                          className="h-full"
                          filterByStock={true}
                          sortByDate={true}
                          onEditPrice={handleEditPriceOtherBranches}
                        />
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Actualización de Precios */}
      <UpdatePurchaseDetailPricesFormModal
        open={updatePriceModalOpen}
        onOpenChange={handleCloseUpdatePriceModal}
        detail={selectedDetail}
        branchType={selectedBranchType}
        currentBranchDetails={productStockLocalData ?? []}
        otherBranchesDetails={productStockSucursalesData ?? []}
      />
    </>
  );
};
