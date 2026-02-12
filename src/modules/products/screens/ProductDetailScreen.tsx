import { useEffect, useState } from "react";
import {
  Truck,
  BarChart3,
  MapPin,
  Box,
  Activity,
  ShoppingCart,
  CornerUpLeft,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/tabs";
import { Button } from "@/components/atoms/button";
import { useNavigate } from "react-router";
import { useProductById } from "../hooks/queries/useProductById";
import { useProductSalesStats } from "../hooks/queries/useProductSalesStats";
import { useBranchStore } from "@/states/branchStore";
import { useProductStock } from "../hooks/queries/useProductStock";
import ProductSales from "../components/productDetail/ProductSales";
import ProductOverview from "../components/productDetail/ProductOverview";
import ProductInventory from "../components/productDetail/ProductInventory";
import ProductLogistics from "../components/productDetail/ProductLogistics";
import { useProductProviderOrders } from "../hooks/queries/useProductProviderOrders";
import ProductDetailSkeleton from "../components/productDetail/ProductDetailSkeleton";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import authSDK from "@/services/sdk-simple-auth";
import { useCartWithUtils } from "@/modules/shoppingCart/hooks/useCartWithUtils";
import TooltipButton from "@/components/common/TooltipButton";
import { Kbd } from "@/components/atoms/kbd";
import { useHotkeys } from "react-hotkeys-hook";
import { useProductByIdWithStock } from "../hooks/queries/useProductByIdWithStock";
import type { ProductGet } from "../types/ProductGet";
import type { ProductStock } from "../types/productStock";
import UpdatePurchaseDetailPricesFormModal from "@/modules/purchases/components/UpdatePurchaseDetailPricesFormModal";
import { useValidatedRouteParam } from "@/hooks/useValidatedRouteParam";
import { useViewRenderer } from "@/hooks/useViewRenderer";

const ProductDetailScreen = () => {
  const navigate = useNavigate();

  const { value: productId, isValid: isValidProductId } =
    useValidatedRouteParam({
      paramName: "productId",
      minValidValue: 1,
    });

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

  const {
    data: productForCart,
    // isLoading,
    // error,
    // isFetching,
    // isError,
  } = useProductByIdWithStock(productId ?? 0, Number(selectedBranchId));

  const {
    data: product,
    isLoading: isLoadingProduct,
    isError: isErrorProduct,
    refetch: refetchProduct,
    // isFetching: isFetchingProduct
  } = useProductById(productId ?? 0);

  const {
    data: twoYearSalesData,
    isLoading: isLoadingTwoYearSalesData,
    isError: isErrorTwoYearSalesData,
    isFetching: isFetchingTwoYearSalesData,
  } = useProductSalesStats({
    producto: productId ?? 0,
    sucursal: sucursalSeleccionada,
    gestion_1: gestiones.gestion_1,
    gestion_2: gestiones.gestion_2,
  });

  const {
    data: productStockLocalData,
    isError: isErrorStockLocalData,
    isFetching: isFetchingStockLocalData,
    isLoading: isLoadingStockLocalData,
    refetch: refetchStockLocal,
  } = useProductStock({
    producto: productId ?? 0,
    sucursal: sucursalSeleccionada,
    resto_only: 0,
  });

  const {
    data: productStockSucursalesData,
    isError: isErrorStockSucursalesData,
    isLoading: isLoadingStockSucursalesData,
    refetch: refetchStockSucursales,
  } = useProductStock({
    producto: productId ?? 0,
    sucursal: sucursalSeleccionada,
    resto_only: 1,
  });

  const {
    data: productProviderOrders,
    isError: isErrorProviderOrders,
    isLoading: isLoadingProviderOrders,
  } = useProductProviderOrders({
    producto: productId ?? 0,
    sucursal: sucursalSeleccionada,
  });

  const { renderView } = useViewRenderer({
    queryStates: [
      {
        isLoading: isLoadingProduct,
        isError: isErrorProduct,
        data: product,
      },
    ],
    isValidating: isValidProductId, // Pasar la validación externa
    SkeletonComponent: ProductDetailSkeleton,
    ErrorComponent: ErrorDataComponent,
    errorMessage: "No se pudo cargar el producto.",
    onRetry: refetchProduct,
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
    const productData = productForCart?.data;
    if (!productData) return;
    const transformedProduct: ProductGet = {
      id: productData.id,
      categoria: productData.categoria?.categoria ?? "",
      codigo_oem: productData.codigo_oem,
      codigo_upc: productData.codigo_upc,
      codigo_interno: productData.codigo_interno,
      descripcion: productData.descripcion,
      imagen: productData.imagen,
      imagen_ext: productData.imagen_ext,
      imagen_name: productData.imagen_name,
      marca: productData.marca?.marca ?? "",
      medida: productData.medida,
      modelo: productData.modelo,
      nro_motor: productData.nro_motor,
      pedido_almacen: 0,
      pedido_transito: 0,
      precio_venta: productData.precio_venta,
      precio_venta_alt: productData.precio_venta_alt,
      procedencia: productData.procedencia?.procedencia ?? "",
      stock_actual: productForCart.stock_actual,
      stock_minimo: productData.stock_minimo,
      stock_resto: productForCart.stock_resto,
      subcategoria: productData.subcategoria?.subcategoria ?? "",
      sucursal: "",
      unidad_medida: productData.unidad_medida?.unidad_medida ?? "",
      costo_mas_alto: 0,
      costo_mas_antiguo: 0,
      costo_mas_reciente: 0,
      costo_promedio: 0,
      costo_referencia: productData.costo_referencia,
    };
    addItemToCart(transformedProduct);
  };

  const handleGoBack = () => {
    navigate("/dashboard/productos");
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

  // Shortcuts
  useHotkeys("escape", handleGoBack, {
    scopes: ["esc-key"],
    enabled: true,
  });

  const view = renderView();
  if (view) return view;

  return (
    <div className="p-2 h-full">
      <div className="max-w-7xl mx-auto space-y-2">
        {/* Header Simple - Solo nombre del producto */}
        <header className="bg-background border border-border rounded-lg p-3">
          <div className="flex items-center gap-3">
            <TooltipButton
              tooltipContentProps={{
                align: "start",
              }}
              onClick={handleGoBack}
              tooltip={
                <p>
                  Presiona <Kbd>esc</Kbd> para volver a la lista de productos
                </p>
              }
              buttonProps={{
                variant: "default",
              }}
            >
              <CornerUpLeft />
            </TooltipButton>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-foreground leading-tight">
                {product?.descripcion}
              </h1>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <Tabs defaultValue="sales" className="space-y-2">
          <div className="flex flex-wrap-reverse gap-2 justify-between">
            <TabsList className="bg-background border border-border gap-2 h-10">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 py-2 hover:bg-accent transition-colors h-8"
              >
                <Activity className="h-4 w-4 mr-2" />
                Resumen
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 py-2 hover:bg-accent transition-colors h-8"
              >
                <Box className="h-4 w-4 mr-2" />
                Inventario
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 py-2 hover:bg-accent transition-colors h-8"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Ventas
              </TabsTrigger>
              <TabsTrigger
                value="logistics"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 py-2 hover:bg-accent transition-colors h-8"
              >
                <Truck className="h-4 w-4 mr-2" />
                Logística
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {/* Branch Selector */}
              <div className="flex items-center gap-2 bg-background rounded-md px-1 h-10 border border-border">
                <MapPin className="h-4 w-4 text-muted-foreground ml-2" />
                <span className="text-sm font-medium text-foreground">
                  Sucursal:
                </span>
                {user?.sucursales &&
                  user?.sucursales.map((sucursal) => (
                    <TooltipButton
                      key={sucursal.id}
                      buttonProps={{
                        variant:
                          sucursalSeleccionada === sucursal.id
                            ? "default"
                            : "ghost",
                        size: "sm",
                      }}
                      onClick={() => setSucursalSeleccionada(sucursal.id)}
                      tooltip={<span>{sucursal.sucursal}</span>}
                    >
                      {sucursal.sigla}
                    </TooltipButton>
                  ))}
                <Button
                  disabled={
                    !productForCart?.data || productForCart.stock_actual <= 0
                  }
                  size={"sm"}
                  className="cursor-pointer"
                  onClick={handleAddItemCart}
                  autoFocus
                >
                  <ShoppingCart className="size-4" />
                  Agregar al carrito
                </Button>
              </div>
            </div>
          </div>

          {/* Overview Tab */}
          <ProductOverview
            productStockData={productStockLocalData ?? []}
            product={product}
            isError={isErrorStockLocalData}
            isFetching={isFetchingStockLocalData}
            isLoading={isLoadingStockLocalData}
            onEditPrice={handleEditPriceCurrentBranch}
          />

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-8">
            <ProductInventory
              productStockData={productStockSucursalesData ?? []}
              isErrorData={isErrorStockSucursalesData}
              isLoadingData={isLoadingStockSucursalesData}
              onEditPrice={handleEditPriceOtherBranches}
            />
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-8">
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
            />
          </TabsContent>

          {/* Logistics Tab */}
          <TabsContent value="logistics" className="space-y-8">
            <ProductLogistics
              ProductProviderOrders={productProviderOrders ?? []}
              isErrorData={isErrorProviderOrders}
              isLoadingData={isLoadingProviderOrders}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Actualización de Precios */}
      <UpdatePurchaseDetailPricesFormModal
        open={updatePriceModalOpen}
        onOpenChange={handleCloseUpdatePriceModal}
        detail={selectedDetail}
        branchType={selectedBranchType}
        currentBranchDetails={productStockLocalData ?? []}
        otherBranchesDetails={productStockSucursalesData ?? []}
      />
    </div>
  );
};

export default ProductDetailScreen;
