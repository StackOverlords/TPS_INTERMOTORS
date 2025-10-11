import { useEffect, useState } from "react"
import {
    Truck,
    BarChart3,
    MapPin,
    Box,
    Activity,
    ShoppingCart,
    CornerUpLeft,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/tabs"
import { Button } from "@/components/atoms/button"
import { useNavigate, useParams } from "react-router"
import { useProductById } from "../hooks/queries/useProductById"
import { useProductSalesStats } from "../hooks/queries/useProductSalesStats"
import { useBranchStore } from "@/states/branchStore"
import { useProductStock } from "../hooks/queries/useProductStock"
import ProductSales from "../components/productDetail/ProductSales"
import ProductOverview from "../components/productDetail/ProductOverview"
import ProductInventory from "../components/productDetail/ProductInventory"
import ProductLogistics from "../components/productDetail/ProductLogistics"
import { useProductProviderOrders } from "../hooks/queries/useProductProviderOrders"
import ProductDetailSkeleton from "../components/productDetail/ProductDetailSkeleton"
import ErrorDataComponent from "@/components/common/errorDataComponent"
import authSDK from "@/services/sdk-simple-auth"
import { useCartWithUtils } from "@/modules/shoppingCart/hooks/useCartWithUtils"
import { useProductsPaginated } from "../hooks/queries/useProductsPaginated"
import TooltipButton from "@/components/common/TooltipButton"
import { Kbd } from "@/components/atoms/kbd"
import { useHotkeys } from "react-hotkeys-hook"

const ProductDetailScreen = () => {
    const navigate = useNavigate()
    const { id: productId } = useParams()
    const { selectedBranchId } = useBranchStore()
    const user = authSDK.getCurrentUser()
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState<number>(Number(selectedBranchId))

    const {
        addItemToCart
    } = useCartWithUtils(user?.name || '', selectedBranchId ?? '')

    const [gestiones, setGestiones] = useState<{ gestion_1: number; gestion_2: number }>({
        gestion_1: new Date().getFullYear() - 1,
        gestion_2: new Date().getFullYear(),
    })

    const {
        data: productForCart,
        // isLoading,
        // error,
        // isFetching,
        // isError,
    } = useProductsPaginated({
        producto: Number(productId),
        sucursal: Number(selectedBranchId),
        pagina_registros: 1,
        pagina: 1
    });

    const {
        data: product,
        isLoading: isLoadingProduct,
        isError: isErrorProduct,
        refetch: refetchProduct,
        // isFetching: isFetchingProduct
    } = useProductById(Number(productId))

    const {
        data: twoYearSalesData,
        isLoading: isLoadingTwoYearSalesData,
        isError: isErrorTwoYearSalesData,
        isFetching: isFetchingTwoYearSalesData
    } = useProductSalesStats({
        producto: Number(productId),
        sucursal: sucursalSeleccionada,
        gestion_1: gestiones.gestion_1,
        gestion_2: gestiones.gestion_2,
    })

    const {
        data: productStockLocalData,
        isError: isErrorStockLocalData,
        isFetching: isFetchingStockLocalData,
        isLoading: isLoadingStockLocalData
    } = useProductStock({
        producto: Number(productId),
        sucursal: sucursalSeleccionada,
        resto_only: 0
    })

    const {
        data: productStockSucursalesData,
        isError: isErrorStockSucursalesData,
        isLoading: isLoadingStockSucursalesData,
    } = useProductStock({
        producto: Number(productId),
        sucursal: sucursalSeleccionada,
        resto_only: 1
    })

    const {
        data: productProviderOrders,
        isError: isErrorProviderOrders,
        isLoading: isLoadingProviderOrders,
    } = useProductProviderOrders({
        producto: Number(productId),
        sucursal: sucursalSeleccionada,
    })

    useEffect(() => {
        setSucursalSeleccionada(Number(selectedBranchId))
    }, [selectedBranchId])

    const handleChangeGestion1 = (value: string) => {
        setGestiones(prev => ({
            ...prev,
            gestion_1: parseInt(value)
        }))
    }
    const handleChangeGestion2 = (value: string) => {
        setGestiones(prev => ({
            ...prev,
            gestion_2: parseInt(value)
        }))
    }

    const handleAddItemCart = () => {
        const productData = productForCart?.data[0];
        if (!productData) return;

        addItemToCart(productData);
    }

    const handleRetry = () => {
        refetchProduct()
    }

    const handleGoBack = () => {
        navigate('/dashboard/productos')
    }

    // Shortcuts
    useHotkeys('escape', handleGoBack, {
        scopes: ["esc-key"],
        enabled: true
    });

    if (isLoadingProduct) {
        return <ProductDetailSkeleton />;
    }

    if (isErrorProduct || !(Number(productId))) {
        return <ErrorDataComponent
            errorMessage="No se pudo cargar el producto. Por favor, inténtalo de nuevo más tarde."
            showButtonIcon={false}
            onRetry={handleRetry}
        />;
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-4">
                {/* Header Simple - Solo nombre del producto */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                        <TooltipButton
                            tooltipContentProps={{
                                align: 'start'
                            }}
                            onClick={handleGoBack}
                            tooltip={<p>Presiona <Kbd>esc</Kbd> para volver a la lista de productos</p>}
                            buttonProps={{
                                variant: 'default',
                            }}
                        >
                            <CornerUpLeft />
                        </TooltipButton>
                        <div>
                            <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">{product?.descripcion}</h1>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <Tabs defaultValue="sales" className="space-y-4">
                    <div className="flex flex-wrap-reverse gap-2 justify-between">
                        <TabsList className="bg-white border border-gray-200 gap-2 h-10">
                            <TabsTrigger
                                value="overview"
                                className="data-[state=active]:bg-gray-900 data-[state=active]:text-white rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors h-8"
                            >
                                <Activity className="h-4 w-4 mr-2" />
                                Resumen
                            </TabsTrigger>
                            <TabsTrigger
                                value="inventory"
                                className="data-[state=active]:bg-gray-900 data-[state=active]:text-white rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors h-8"
                            >
                                <Box className="h-4 w-4 mr-2" />
                                Inventario
                            </TabsTrigger>
                            <TabsTrigger
                                value="sales"
                                className="data-[state=active]:bg-gray-900 data-[state=active]:text-white rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors h-8"
                            >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Ventas
                            </TabsTrigger>
                            <TabsTrigger
                                value="logistics"
                                className="data-[state=active]:bg-gray-900 data-[state=active]:text-white rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors h-8"
                            >
                                <Truck className="h-4 w-4 mr-2" />
                                Logística
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2">
                            {/* Branch Selector */}
                            <div className="flex items-center gap-2 bg-white rounded-md px-1 h-10 border border-gray-200">
                                <MapPin className="h-4 w-4 text-gray-500 ml-2" />
                                <span className="text-sm font-medium text-gray-700">Sucursal:</span>
                                {user?.sucursales && user?.sucursales.map((sucursal) => (
                                    <TooltipButton
                                        key={sucursal.id}
                                        buttonProps={{
                                            variant: sucursalSeleccionada === sucursal.id ? "default" : "ghost",
                                            size: "sm"
                                        }}
                                        onClick={() => setSucursalSeleccionada(sucursal.id)}
                                        tooltip={
                                            <span>{sucursal.sucursal}</span>
                                        }
                                    >
                                        {sucursal.sigla}
                                    </TooltipButton>
                                ))}
                                <Button
                                    disabled={!productForCart?.data || productForCart.data[0].stock_actual <= 0}
                                    size={'sm'}
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
                    < ProductOverview
                        productStockData={productStockLocalData ?? []}
                        isError={isErrorStockLocalData}
                        isFetching={isFetchingStockLocalData}
                        isLoading={isLoadingStockLocalData}
                    />

                    {/* Inventory Tab */}
                    <ProductInventory
                        productStockData={productStockSucursalesData ?? []}
                        isErrorData={isErrorStockSucursalesData}
                        isLoadingData={isLoadingStockSucursalesData}
                    />

                    {/* Sales Tab */}
                    <TabsContent value="sales" className="space-y-8">
                        <ProductSales
                            isLoadingData={isLoadingTwoYearSalesData}
                            gestion_1={gestiones.gestion_1}
                            gestion_2={gestiones.gestion_2}
                            handleChangeGestion1={handleChangeGestion1}
                            handleChangeGestion2={handleChangeGestion2}
                            productSalesData={twoYearSalesData ?? { meta: { getion_1: "", getion_2: "" }, data: [] }}
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
        </div>
    )
}

export default ProductDetailScreen;