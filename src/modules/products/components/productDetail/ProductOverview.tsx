import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { TabsContent } from "@/components/atoms/tabs";
import { format } from "date-fns";
import { Calendar, ImageIcon } from "lucide-react";
import type { ProductStock } from "../../types/productStock";
import { formatCurrency } from "@/utils/formaters";
import ProductTableOverview from "./productTableOverview";

interface ProductOverviewProps {
    productStockData: ProductStock[],
    isLoading: boolean;
    isFetching: boolean
    isError: boolean,
}
const ProductOverview: React.FC<ProductOverviewProps> = ({
    productStockData,
    isError,
    isFetching,
    isLoading,
}) => {
    const imagenProducto = null
    const compraReciente = productStockData.length > 0
        ? productStockData.reduce((latest, current) => {
            const fechaActual = new Date(current.fecha_adquisicion);
            const fechaLatest = new Date(latest.fecha_adquisicion);
            return fechaActual > fechaLatest ? current : latest;
        })
        : undefined;

    return (
        <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main Content */}
                <div className={`lg:${compraReciente ? 'col-span-3 space-y-4' : 'col-span-2'}`}>
                    <div className={`grid grid-cols-1 ${compraReciente ? 'md:grid-cols-5' : ''} gap-y-4 md:gap-y-0 md:gap-4`}>
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
                                    <div className="aspect-square xl:aspect-auto bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 h-full col-span-2 xl:col-span-1">
                                        {imagenProducto ? (
                                            <img
                                                src={imagenProducto || "/placeholder.svg"}
                                                alt="Producto"
                                                className="max-w-full max-h-full object-contain rounded-lg"
                                            />
                                        ) : (
                                            <div className="text-center p-8">
                                                <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-500 font-medium">Sin imagen</p>
                                                <p className="text-sm text-gray-400 mt-1">Disponible próximamente</p>
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
                        <div className="space-y-4">
                            {/* Product Image */}
                            <Card className="bg-card border border-border">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-lg">
                                        <ImageIcon className="size-4 text-gray-700" />
                                        Imagen del Producto
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                                        {imagenProducto ? (
                                            <img
                                                src={imagenProducto || "/placeholder.svg"}
                                                alt="Producto"
                                                className="max-w-full max-h-full object-contain rounded-lg"
                                            />
                                        ) : (
                                            <div className="text-center p-8">
                                                <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-500 font-medium">Sin imagen</p>
                                                <p className="text-sm text-gray-400 mt-1">Disponible próximamente</p>
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
    );
}

export default ProductOverview;