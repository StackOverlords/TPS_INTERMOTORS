import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { TabsContent } from "@/components/atoms/tabs";
import { format } from "date-fns";
import { Calendar, ImageIcon, Upload } from "lucide-react";
import type { ProductStock } from "../../types/productStock";
import { formatCurrency } from "@/utils/formaters";
import ProductTableOverview from "./productTableOverview";
import type { ProductDetail } from "../../types/productDetail";
import { useCallback, useState } from "react";
import { useUpdateProductImage } from "../../hooks/mutations/useUpdateProductImage";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { Button } from "@/components/atoms/button";
import { ImageViewer } from "@/components/common/ImageViewer";

interface ProductOverviewProps {
    productStockData: ProductStock[],
    product: ProductDetail | undefined
    isLoading: boolean;
    isFetching: boolean
    isError: boolean,
}
const ProductOverview: React.FC<ProductOverviewProps> = ({
    productStockData,
    product,
    isError,
    isFetching,
    isLoading,
}) => {
    const [imageModalOpen, setImageModalOpen] = useState(false)

    const { handleError } = useErrorHandler()
    const {
        mutate: updateProductImage,
        isPending: isUpdatingImage
    } = useUpdateProductImage({
        onSuccess: () => {
            showSuccessToast({
                title: "Imagen actualizada",
                description: "La imagen del producto se actualizó exitosamente",
            });
        },
        onError: (error) => {
            handleError({
                error,
                customTitle: "Error al actualizar la imagen del producto"
            });
        }
    });

    const handleSaveImage = useCallback(async (imageData: string) => {
        if (!product) return;

        try {
            // Convertir base64 a File
            const response = await fetch(imageData);
            const blob = await response.blob();
            const file = new File(
                [blob],
                `producto-${product.id}.png`,
                { type: 'image/png' }
            );

            // Llamar a la mutación
            updateProductImage({
                productId: product.id,
                imageFile: file
            });
        } catch (error) {
            showErrorToast({
                title: "Error",
                description: "No se pudo procesar la imagen",
            });
        }
    }, [product, updateProductImage]);

    const handleViewImage = useCallback(() => {
        setImageModalOpen(true)
    }, [])

    const imagenProducto = product?.imagen
    const compraReciente = productStockData.length > 0
        ? productStockData.reduce((latest, current) => {
            const fechaActual = new Date(current.fecha_adquisicion);
            const fechaLatest = new Date(latest.fecha_adquisicion);
            return fechaActual > fechaLatest ? current : latest;
        })
        : undefined;

    return (
        <>
            <TabsContent value="overview" className="space-y-2">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                    {/* Main Content */}
                    <div className={`lg:${compraReciente ? 'col-span-3 space-y-2' : 'col-span-2'}`}>
                        <div className={`grid grid-cols-1 ${compraReciente ? 'md:grid-cols-5' : ''} gap-y-4 md:gap-y-0 md:gap-2`}>
                            {/* Compra más reciente - Diseño simple */}
                            {
                                compraReciente && (
                                    <>
                                        <Card className="bg-card border border-border col-span-3 xl:col-span-4">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                                                    <Calendar className="size-4 text-gray-700" />
                                                    Compra Más Reciente (con saldo)
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Cantidad</label>
                                                        <p className="text-lg font-semibold text-gray-900">{compraReciente.cantidad}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Fecha</label>

                                                        <p className="text-lg font-semibold text-gray-900">{compraReciente.fecha_adquisicion ? format(compraReciente.fecha_adquisicion, "dd-MM-yyyy") : 'Sin fecha'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Costo</label>
                                                        <p className="text-lg font-semibold text-gray-900">
                                                            {formatCurrency(compraReciente.costo)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Precio de Venta F.</label>
                                                        <p className="text-lg font-semibold text-gray-900">
                                                            {formatCurrency(compraReciente.precio_venta)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Precio de Venta S.F.</label>
                                                        <p className="text-lg font-semibold text-gray-900">
                                                            {formatCurrency(compraReciente.precio_venta_alt)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Fecha Actualización</label>
                                                        <p className={` ${compraReciente.fecha_actualizacion ? 'text-lg font-semibold text-gray-900' : 'italic text-sm text-gray-500'}`}>{compraReciente.fecha_actualizacion ? format(compraReciente.fecha_actualizacion, "dd-MM-yyyy") : 'Sin fecha'}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <div className="aspect-square xl:aspect-auto bg-card rounded-xl flex items-center justify-center border border-border h-full col-span-2 xl:col-span-1 overflow-hidden group relative">
                                            {imagenProducto ? (
                                                <>
                                                    <img
                                                        src={imagenProducto}
                                                        alt="Producto"
                                                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                    {/* Overlay con botón para ver imagen */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                                        <Button
                                                            onClick={handleViewImage}
                                                            variant="outline"
                                                        >
                                                            Ver Imagen
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center gap-2 p-8">
                                                    {/* Icono con animación sutil */}
                                                    <div className="relative">
                                                        <div className="size-20 border-2 border-dashed border-zinc-300 rounded-2xl flex items-center justify-center bg-zinc-50/50 transition-all duration-300 hover:border-zinc-400 hover:bg-zinc-100/50">
                                                            <Upload className="size-10 text-zinc-400" />
                                                        </div>
                                                        {/* Elemento decorativo */}
                                                        <div className="absolute -top-1 -right-1 size-4 bg-primary/20 rounded-full animate-pulse" />
                                                    </div>

                                                    {/* Texto */}
                                                    <div className="text-center space-y-2">
                                                        <p className="text-xs font-medium text-zinc-700">
                                                            No hay imagen del producto
                                                        </p>
                                                    </div>

                                                    {/* Botón */}
                                                    <Button
                                                        onClick={handleViewImage}
                                                        className="mt-2 shadow-sm hover:shadow-md transition-shadow"
                                                    >
                                                        <Upload className="size-4" />
                                                        Cargar imagen
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )
                            }
                        </div>


                        {/* Stock Sucursal actual - Con todos los datos */}
                        <ProductTableOverview
                            isError={isError}
                            isFetching={isFetching}
                            isLoading={isLoading}
                            productStockData={productStockData}
                        />
                    </div>

                    {/* Sidebar */}
                    {
                        !compraReciente && (
                            <div className="space-y-2">
                                {/* Product Image */}
                                <Card className="bg-card border border-border">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3 text-lg">
                                            <ImageIcon className="size-4 text-gray-700" />
                                            Imagen del Producto
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="aspect-square bg-card rounded-xl flex items-center justify-center border border-border">
                                            {imagenProducto ? (
                                                <>
                                                    <img
                                                        src={imagenProducto}
                                                        alt="Producto"
                                                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                    {/* Overlay con botón para ver imagen */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                                        <Button
                                                            onClick={handleViewImage}
                                                            variant="outline"
                                                        >
                                                            Ver Imagen
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center gap-2 p-8">
                                                    {/* Icono con animación sutil */}
                                                    <div className="relative">
                                                        <div className="size-20 border-2 border-dashed border-zinc-300 rounded-2xl flex items-center justify-center bg-zinc-50/50 transition-all duration-300 hover:border-zinc-400 hover:bg-zinc-100/50">
                                                            <Upload className="size-10 text-zinc-400" />
                                                        </div>
                                                        {/* Elemento decorativo */}
                                                        <div className="absolute -top-1 -right-1 size-4 bg-primary/20 rounded-full animate-pulse" />
                                                    </div>

                                                    {/* Texto */}
                                                    <div className="text-center space-y-2">
                                                        <p className="text-xs font-medium text-zinc-700">
                                                            No hay imagen del producto
                                                        </p>
                                                    </div>

                                                    {/* Botón */}
                                                    <Button
                                                        onClick={handleViewImage}
                                                        className="mt-2 shadow-sm hover:shadow-md transition-shadow"
                                                    >
                                                        <Upload className="size-4" />
                                                        Cargar imagen
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )
                    }
                </div>
            </TabsContent>

            {imageModalOpen && product && (
                <ImageViewer
                    open={imageModalOpen}
                    onOpenChange={(open) => {
                        setImageModalOpen(open);
                    }}
                    imageSrc={product.imagen || undefined}
                    editMode={!product.imagen}
                    title={product.descripcion}
                    onSave={handleSaveImage}
                    imageMetadata={{
                        fileName: product.imagen_name,
                        fileExtension: product.imagen_ext,
                    }}
                    isLoading={isUpdatingImage}
                />
            )}
        </>
    );
}

export default ProductOverview;