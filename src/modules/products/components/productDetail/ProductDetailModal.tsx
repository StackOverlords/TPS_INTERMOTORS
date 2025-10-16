import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Separator } from '@/components/atoms/separator';
import { useBranchStore } from '@/states/branchStore';
import authSDK from '@/services/sdk-simple-auth';
import { useEffect, useState } from 'react';
import { useCartWithUtils } from '@/modules/shoppingCart/hooks/useCartWithUtils';
import { useProductsPaginated } from '../../hooks/queries/useProductsPaginated';
import { useProductById } from '../../hooks/queries/useProductById';
import { useProductSalesStats } from '../../hooks/queries/useProductSalesStats';
import { useProductProviderOrders } from '../../hooks/queries/useProductProviderOrders';
import ProductDetailSkeleton from './ProductDetailSkeleton';
import ErrorDataComponent from '@/components/common/errorDataComponent';
import ProductLogistics from './ProductLogistics';
import ProductSales from './ProductSales';
import { MapPin, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/atoms/button';

interface ProductDetailModalProps {
    productId: number | null
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ProductDetailModal = ({ productId, open, onOpenChange }: ProductDetailModalProps) => {
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
        isLoading: isLoadingProductForCart
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

    // const {
    //     data: productStockSucursalesData,
    //     isError: isErrorStockSucursalesData,
    //     isLoading: isLoadingStockSucursalesData,
    // } = useProductStock({
    //     producto: Number(productId),
    //     sucursal: sucursalSeleccionada,
    //     resto_only: 1
    // })

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
        onOpenChange(false)
    }

    const handleRetry = () => {
        refetchProduct()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl h-full md:h-[90vh] overflow-auto p-2">
                {
                    isErrorProduct || !(Number(productId)) ? (
                        <ErrorDataComponent
                            errorMessage="No se pudo cargar el producto. Por favor, inténtalo de nuevo más tarde."
                            showButtonIcon={false}
                            onRetry={handleRetry}
                        />
                    ) : isLoadingProduct || isLoadingProductForCart ? (
                        <ProductDetailSkeleton />
                    ) : (
                        <>
                            <DialogHeader className="pr-8 pl-3 pt-3">
                                <div className="flex items-start flex-wrap md:flex-nowrap gap-2 justify-between">
                                    <div className="space-y-2">
                                        <DialogTitle className="text-base md:text-xl font-bold">
                                            {product?.descripcion}
                                        </DialogTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Branch Selector */}
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-500 ml-2" />
                                            <span className="text-sm font-medium text-gray-700">Sucursal:</span>
                                            {user?.sucursales && user?.sucursales.map((sucursal) => (
                                                <Button
                                                    key={sucursal.id}
                                                    variant={sucursalSeleccionada === sucursal.id ? "default" : "ghost"}
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
                                </div >
                            </DialogHeader >

                            <Separator />

                            <div className='grid grid-cols-1 md:grid-cols-5 gap-2'>
                                <div className='md:col-span-3 grid'>
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
                                </div>

                                <div className='md:col-span-2'>
                                    <ProductLogistics
                                        ProductProviderOrders={productProviderOrders ?? []}
                                        isErrorData={isErrorProviderOrders}
                                        isLoadingData={isLoadingProviderOrders}
                                    />
                                </div>
                            </div>
                        </>
                    )
                }
            </DialogContent >
        </Dialog >
    );
};