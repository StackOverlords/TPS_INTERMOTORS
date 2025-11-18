import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Input } from "@/components/atoms/input"
import { Kbd } from "@/components/atoms/kbd"
import { Label } from "@/components/atoms/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select"
import { Separator } from "@/components/atoms/separator"
import { Textarea } from "@/components/atoms/textarea"
import ErrorDataComponent from "@/components/common/errorDataComponent"
import { PaginatedCombobox } from "@/components/common/paginatedCombobox"
import { ComboboxSelect } from "@/components/common/SelectCombobox"
import ShortcutKey from "@/components/common/ShortcutKey"
import TooltipButton from "@/components/common/TooltipButton"
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced"
import { useErrorHandler } from "@/hooks/useErrorHandler"
import { useGoBack } from "@/hooks/useGoBack"
import { cn } from "@/lib/utils"
import ProductSelectorModal from "@/modules/products/components/ProductSelectorModal"
import type { ProductGet } from "@/modules/products/types/ProductGet"
import { formatCurrency } from "@/utils/formaters"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CornerUpLeft, Loader2, Save, ShoppingCart } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Controller, FormProvider, useForm, type FieldErrors } from "react-hook-form"
import { useHotkeys } from "react-hotkeys-hook"
import { useNavigate, useParams } from "react-router"
import { useDebounce } from "use-debounce"
import type { OrderDetailTableRef } from "../components/OrderDetailTable"
import OrderDetailTable from "../components/OrderDetailTable"
import OrderEditSkeleton from "../components/orderEditSkeleton"
import { useOrderModalities } from "../hooks/commons/useOrderModalities"
import { useOrderProvider } from "../hooks/commons/useOrderProviders"
import { useOrderResponsibles } from "../hooks/commons/useOrderResponsibles"
import { useOrderStatus } from "../hooks/commons/useOrderStatus"
import { useOrderTypes } from "../hooks/commons/useOrderTypes"
import { useGetOrderById } from "../hooks/useGetOrderById"
import { useOrderDetails } from "../hooks/useOrderDetails"
import { useUpdateOrder } from "../hooks/useUpdateOrder"
import { OrderUpdateSchema } from "../schemas/orderUpdateSchema"
import type { OrderUpdate, UIOrderDetailUpdate } from "../types/orderUpdate.types"

const OrderEditScreen = () => {
    const navigate = useNavigate()
    const { orderId } = useParams()
    const [providerSearchTerm, setProviderSearchTerm] = useState<string>("");
    const [debouncedProviderSearchTerm] = useDebounce<string>(providerSearchTerm, 500)
    const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
    const [hasInitialized, setHasInitialized] = useState<boolean>(false);
    const tableRef = useRef<OrderDetailTableRef>(null);

    // Hook de detalles de orden en modo edición
    const orderDetailsHook = useOrderDetails<UIOrderDetailUpdate>(true);

    const {
        data: orderTypesData,
        isLoading: isLoadingOrderTypes,
    } = useOrderTypes()

    const {
        data: orderModalitiesData,
        isLoading: isLoadingOrderModalities,
    } = useOrderModalities()

    const {
        data: orderResponsiblesData,
        isLoading: isLoadingOrderResponsibles
    } = useOrderResponsibles()

    const {
        data: orderProvidersData,
        isLoading: isOrderProvidersLoading
    } = useOrderProvider(debouncedProviderSearchTerm)

    const {
        data: orderStatusData,
        isLoading: isOrderStatusLoading
    } = useOrderStatus();

    const {
        mutate: updateOrder,
        isPending: isSaving
    } = useUpdateOrder();

    const {
        data: orderData,
        isLoading: isLoadingOrder,
        isError: isErrorOrder
    } = useGetOrderById(Number(orderId))

    const handleGoBack = useGoBack("/dashboard/orders");
    const { handleError } = useErrorHandler()

    const formMethods = useForm<OrderUpdate>({
        resolver: zodResolver(OrderUpdateSchema),
        defaultValues: {
            fecha: format(new Date(), "yyyy-MM-dd"),
            nro_comprobante: "",
            id_proveedor: undefined,
            tipo_pedido: "",
            forma_pedido: "",
            comentario: "",
            id_responsable: 1,
            detalles: [],
            estado_actual: "",
            fecha_inicio_transito: "",
            fecha_llegada: "",
        }
    });

    const {
        register,
        reset,
        control,
        handleSubmit,
        setValue,
        getValues,
        setError,
        clearErrors,
        watch,
        formState: { errors }
    } = formMethods

    const currentStatus = watch("estado_actual")

    useEffect(() => {
        if (orderData && orderTypesData && orderModalitiesData) {
            // Transformar detalles a UIOrderDetailUpdate
            const detallesUI: UIOrderDetailUpdate[] = orderData.detalles.map((detalle, index) => {
                // Si precio_venta es null, usar el precio del producto
                const precioVentaFinal = detalle.precio_venta !== null
                    ? Number(detalle.precio_venta)
                    : Number(detalle.producto.precio_venta);

                const precioVentaAltFinal = detalle.precio_venta_alt !== null
                    ? Number(detalle.precio_venta_alt)
                    : Number(detalle.producto.precio_venta_alt);

                return {
                    id_detalle_pedido: detalle.id,
                    id_producto: detalle.producto.id,
                    cantidad: Number(detalle.cantidad),
                    costo: Number(detalle.costo),
                    inc_p_venta: detalle.inc_precio_venta !== null ? Number(detalle.inc_precio_venta) : 0,
                    precio_venta: precioVentaFinal,
                    inc_p_venta_alt: detalle.inc_precio_venta_alt !== null ? Number(detalle.inc_precio_venta_alt) : 0,
                    precio_venta_alt: precioVentaAltFinal,
                    orden: detalle.orden ?? (index + 1),
                    product: {
                        id: detalle.producto.id,
                        descripcion: detalle.producto.descripcion,
                        codigo_oem: detalle.producto.codigo_oem,
                        codigo_upc: detalle.producto.codigo_upc,
                        precio_venta: Number(detalle.producto.precio_venta),
                    }
                };
            });

            // Establecer detalles en el hook
            orderDetailsHook.setOrderDetails(detallesUI);

            const resetData: OrderUpdate = {
                fecha: format(orderData.fecha, "yyyy-MM-dd") ?? "",
                nro_comprobante: orderData.comprobante ?? "",
                id_proveedor: orderData.proveedor?.id ?? 0,
                comentario: orderData.comentarios ?? "",
                id_responsable: orderData.responsable?.id ?? 1,
                detalles: [],
                tipo_pedido: orderData.tipo_pedido,
                forma_pedido: orderData.forma_pedido,
                estado_actual: orderData.situacion_actual,
                fecha_inicio_transito: "",
                fecha_llegada: "",
            };
            reset(resetData);
            setHasInitialized(true);
        }
    }, [orderData, orderTypesData, orderModalitiesData, reset]);

    // Sincronizar detalles con el formulario
    useEffect(() => {
        if (hasInitialized) {
            const detalles = orderDetailsHook.getOrderDetails();

            if (detalles.length > 0) {
                setValue("detalles", detalles);
                clearErrors("detalles");
            }
        }
    }, [orderDetailsHook.details, hasInitialized, setValue, clearErrors]);

    // Validaciones de fechas según estado
    const statusesDisablingTransit = ["P", "C"];
    const statusesDisablingArrival = ["P", "C", "T"];

    useEffect(() => {
        if (!currentStatus || !hasInitialized) return;

        // Si el estado no permite fecha de tránsito, limpiarla
        if (statusesDisablingTransit.includes(currentStatus)) {
            setValue("fecha_inicio_transito", "");
        }

        // Si el estado no permite fecha de llegada, limpiarla
        if (statusesDisablingArrival.includes(currentStatus)) {
            setValue("fecha_llegada", "");
        }
    }, [currentStatus, hasInitialized, setValue]);

    const validateBeforeSubmit = (): boolean => {
        let isValid = true;
        const formData = getValues();

        if (formData.detalles.length === 0) {
            setError("detalles", {
                type: "manual",
                message: "Debes agregar al menos un producto para realizar un pedido"
            });
            showErrorToast({
                title: "No hay productos seleccionados",
                description: "Debes agregar al menos un producto para realizar un pedido",
                duration: 5000
            });
            isValid = false;
        }

        if (!formData.id_proveedor) {
            setError("id_proveedor", {
                type: "manual",
                message: "Debes seleccionar un proveedor"
            });
            showErrorToast({
                title: "Proveedor requerido",
                description: "Debes seleccionar un proveedor para el pedido",
                duration: 5000
            });
            isValid = false;
        }

        if (!formData.tipo_pedido) {
            setError("tipo_pedido", {
                type: "manual",
                message: "Debes seleccionar un tipo de pedido"
            });
            isValid = false;
        }

        if (!formData.forma_pedido) {
            setError("forma_pedido", {
                type: "manual",
                message: "Debes seleccionar una forma de pedido"
            });
            isValid = false;
        }

        return isValid;
    };

    const handleAddProduct = (product: ProductGet) => {
        orderDetailsHook.addProduct(product);
        setTimeout(() => {
            tableRef.current?.focusFirstQuantityInput();
        }, 100);
    };

    const handleAddMultipleProducts = (products: ProductGet[]) => {
        products.forEach(product => {
            orderDetailsHook.addProduct(product);
        });
        setTimeout(() => {
            tableRef.current?.focusFirstQuantityInput();
        }, 100);
    };

    const onSubmit = (data: OrderUpdate) => {
        if (!validateBeforeSubmit()) return;

        const result = OrderUpdateSchema.safeParse(data);

        if (!result.success) {
            showErrorToast({
                title: "Datos inválidos",
                description: "Revisa los campos antes de continuar.",
                duration: 5000,
            });
            return;
        }

        const transformedData = result.data;
        if (transformedData.fecha_inicio_transito === '') {
            transformedData.fecha_inicio_transito = undefined;
        }

        if (transformedData.fecha_llegada === '') {
            transformedData.fecha_llegada = undefined;
        }
        updateOrder(
            { id: Number(orderId), data: transformedData },
            {
                onSuccess: () => {
                    showSuccessToast({
                        title: "Pedido Modificado",
                        description: `Pedido modificado con éxito`,
                        duration: 5000,
                    });
                    setTimeout(handleGoBack, 200);
                },
                onError: (error: unknown) => {
                    handleError({ error, customTitle: "No se pudo modificar el pedido" });
                }
            }
        );
    };

    const onError = (errors: FieldErrors<OrderUpdate>) => {
        console.log(errors)
        if (errors.id_proveedor || errors.tipo_pedido || errors.forma_pedido || errors.id_responsable) {
            showErrorToast({
                title: "Error de validación",
                description: "Revisa los campos obligatorios del formulario",
                duration: 5000
            });
            return;
        }
        const firstErrorKey = Object.keys(errors)[0] as keyof OrderUpdate;
        const firstError = errors[firstErrorKey];

        if (firstError?.message) {
            showErrorToast({
                title: "Error en formulario",
                description: firstError.message,
                duration: 5000
            });
        }

        if (errors.detalles) {
            validateBeforeSubmit();
        }
    };

    // Shortcuts
    useHotkeys('escape', (e) => {
        e.preventDefault();
        handleGoBack();
    }, {
        scopes: ["esc-key"],
        enabled: true
    });

    useHotkeys('alt+s', (e) => {
        e.preventDefault();
        handleSubmit(onSubmit, onError)();
    })

    if (isLoadingOrder || isLoadingOrderTypes || isLoadingOrderModalities || isLoadingOrderResponsibles) {
        return <OrderEditSkeleton />;
    }

    if (isErrorOrder || isNaN(Number(orderId))) {
        return <ErrorDataComponent
            errorMessage="No se pudo cargar el pedido."
            showButtonIcon={false}
            buttonText="Ir a lista de pedidos"
            onRetry={() => {
                navigate("/dashboard/orders")
            }}
        />
    }

    return (
        <main className="flex flex-col items-center">
            <div className="w-full space-y-2">
                <FormProvider {...formMethods}>
                    <form
                        className="space-y-2"
                        onSubmit={handleSubmit(onSubmit, onError)}
                    >
                        <header className="border-gray-200 border bg-white rounded-lg p-2 sm:p-3">
                            <div className="flex flex-wrap gap-2 items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <TooltipButton
                                        tooltipContentProps={{
                                            align: 'start'
                                        }}
                                        onClick={handleGoBack}
                                        tooltip={<p className="flex items-center gap-1">Presiona <Kbd>esc</Kbd> para volver atrás</p>}
                                        buttonProps={{
                                            variant: 'default',
                                            type: 'button'
                                        }}
                                    >
                                        <CornerUpLeft />
                                    </TooltipButton>
                                    <div>
                                        <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                                            Editar pedido #{orderData?.nro}
                                        </h1>
                                        {orderData && (
                                            <p className="text-sm text-gray-600">
                                                {orderData.proveedor ? `${orderData.proveedor.proveedor} - ` : ''}
                                                {orderData.cantidad_detalles} {orderData.cantidad_detalles === 1 ? 'producto' : 'productos'}
                                            </p>
                                        )}
                                    </div>
                                </div >

                                {/* Action Buttons */}
                                < div className="flex items-center justify-end w-full sm:w-auto gap-2" >
                                    <TooltipButton
                                        onClick={handleGoBack}
                                        tooltip="Cancelar Edicion"
                                        buttonProps={{
                                            variant: 'outline',
                                            size: 'sm',
                                            type: 'button'
                                        }}
                                    >
                                        Cancelar
                                    </TooltipButton>

                                    <TooltipButton
                                        tooltip={
                                            <span className="flex items-center gap-1">Guardar Cambios <ShortcutKey combo="alt+s" /></span>
                                        }
                                        buttonProps={{
                                            variant: 'default',
                                            size: 'sm',
                                            type: 'submit',
                                            disabled: isSaving
                                        }}
                                    >
                                        {
                                            !isSaving ? (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    Guardar Cambios
                                                </>
                                            ) : (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Guardando...
                                                </>
                                            )
                                        }
                                    </TooltipButton>
                                </div >
                            </div >
                        </header >

                        {/* Formulario de información del pedido*/}
                        <div className="grid md:grid-cols-3 gap-3">
                            {/* 1. Datos de el pedido */}
                            <Card className="shadow-none h-full md:col-span-2">

                                <CardContent className="py-3">
                                    <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-y-3 gap-x-2">
                                        <div>
                                            <Label htmlFor="fechaCotizacion">Fecha *</Label>
                                            <Input
                                                id="fechaCotizacion"
                                                type="date"
                                                {...register("fecha")}
                                                className="w-full"
                                                autoFocus
                                            />
                                            {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha.message}</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor="id_responsable">Responsable *</Label>
                                            <Controller
                                                name="id_responsable"
                                                control={control}
                                                render={({ field }) => (
                                                    <ComboboxSelect
                                                        value={field.value}
                                                        onChange={(value) => {
                                                            field.onChange(Number(value));
                                                        }}
                                                        options={orderResponsiblesData?.data || []}
                                                        optionTag={"nombre"}
                                                    />
                                                )}
                                            />
                                            {errors.id_responsable && <p className="text-red-500 text-sm mt-1">El campo es requerido</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="forma">Forma de Pedido *</Label>
                                            <Controller
                                                name="forma_pedido"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value || orderData?.forma_pedido || ""}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona una forma" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {
                                                                orderModalitiesData && orderModalitiesData.map((modality) => (
                                                                    <SelectItem key={modality.id} value={modality.id}>
                                                                        {modality.label}
                                                                    </SelectItem>
                                                                ))
                                                            }
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.forma_pedido && <p className="text-red-500 text-sm mt-1">{errors.forma_pedido.message}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="tipoPedido">Tipo de Pedido *</Label>
                                            <Controller
                                                name="tipo_pedido"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value || orderData?.tipo_pedido || ""}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona un tipo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {
                                                                orderTypesData && orderTypesData.map((type) => (
                                                                    <SelectItem key={type.id} value={type.id}>
                                                                        {type.label}
                                                                    </SelectItem>
                                                                ))
                                                            }
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.tipo_pedido && <p className="text-red-500 text-sm mt-1">El campo es requerido</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor="fechaTransito">
                                                Fecha Tránsito
                                            </Label>
                                            <Input
                                                id="fechaTransito"
                                                type="date"
                                                {...register("fecha_inicio_transito")}
                                                disabled={statusesDisablingTransit.includes(currentStatus)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="fechaLlegada">
                                                Fecha Llegada
                                            </Label>
                                            <Input
                                                id="fechaLlegada"
                                                type="date"
                                                {...register("fecha_llegada")}
                                                disabled={statusesDisablingArrival.includes(currentStatus)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="nroComprobante">N° Comprobante</Label>
                                            <Input
                                                id="nroComprobante"
                                                {...register("nro_comprobante")}
                                                placeholder="Número de comprobante"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-none h-full">

                                <CardContent className="space-y-3 py-3">
                                    <div className="grid sm:grid-cols-2 gap-y-3 gap-x-2">

                                        <div>
                                            <Label htmlFor="cliente">Proveedor *</Label>
                                            <Controller
                                                name="id_proveedor"
                                                control={control}
                                                render={({ field }) => (
                                                    <PaginatedCombobox
                                                        value={field.value}
                                                        onChange={(value) => field.onChange(Number(value))}
                                                        optionsData={orderProvidersData?.data || []}
                                                        displayField="nombre"
                                                        isLoading={isOrderProvidersLoading}
                                                        updatePage={(page) => { console.log("Update page:", page) }}
                                                        updateSearch={setProviderSearchTerm}
                                                        metaData={
                                                            {
                                                                current_page: orderProvidersData?.meta?.current_page || 1,
                                                                last_page: orderProvidersData?.meta?.last_page || 1,
                                                                total: orderProvidersData?.meta?.total || 0,
                                                                per_page: orderProvidersData?.meta?.per_page || 10,
                                                            }
                                                        }
                                                    />
                                                )}
                                            />
                                            {errors.id_proveedor && <p className="text-red-500 text-sm mt-1">El campo es requerido</p>}
                                        </div>
                                        <div>
                                            <Label>Estado *</Label>
                                            <Controller
                                                name="estado_actual"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select
                                                        value={field.value || orderData?.situacion_actual || ""}
                                                        disabled={isOrderStatusLoading}
                                                        onValueChange={(value) => field.onChange(value)}
                                                    >
                                                        <SelectTrigger className={cn(
                                                            "space-x-2 w-full",
                                                        )}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className={cn(
                                                            "shadow-lg",
                                                        )}>
                                                            {orderStatusData?.map(({ id, label }) => (
                                                                <SelectItem key={id} value={id}>
                                                                    {label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>

                                        <div className="col-span-full">
                                            <Label htmlFor="comentario">Comentarios</Label>
                                            <Textarea
                                                id="comentario"
                                                {...register("comentario")}
                                                placeholder="Comentarios adicionales sobre el pedido"
                                                className="min-h-[50px]"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                    </form>

                    {/* 2. Productos */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle>
                                <ProductSelectorModal
                                    isSearchOpen={isSearchOpen}
                                    setIsSearchOpen={setIsSearchOpen}
                                    addItem={handleAddProduct}
                                    onlyWithStock={false}
                                    addMultipleItem={handleAddMultipleProducts}
                                />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {orderData?.detalles.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p>No hay productos agregados</p>
                                        <p className="text-sm">Haz clic en "Seleccionar Productos" para agregar</p>
                                    </div>
                                ) :
                                    <div>
                                        <OrderDetailTable
                                            ref={tableRef}
                                            details={orderDetailsHook.details}
                                            onUpdateCantidad={orderDetailsHook.updateCantidad}
                                            onUpdateCosto={orderDetailsHook.updateCosto}
                                            onUpdatePrecioVenta={orderDetailsHook.updatePrecioVenta}
                                            onUpdateIncPVenta={orderDetailsHook.updateIncPVenta}
                                            onUpdatePrecioVentaAlt={orderDetailsHook.updatePrecioVentaAlt}
                                            onUpdateIncPVentaAlt={orderDetailsHook.updateIncPVentaAlt}
                                            onRemoveProduct={orderDetailsHook.removeProduct}
                                        />
                                        <Separator className="h-[0.5px]" />
                                        <div className="flex justify-between items-center px-2 pt-2">
                                            <span className="font-medium text-gray-500">Total:</span>
                                            <span className="font-bold text-emerald-600">{formatCurrency(orderDetailsHook.getTotalCosto())}</span>
                                        </div>
                                    </div>
                                }
                            </div>
                        </CardContent>
                    </Card>
                </FormProvider>
            </div>
        </main >
    );
}

export default OrderEditScreen;