import { useEffect, useState, useRef } from "react";
import { ShoppingCart, CornerUpLeft, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Label } from "@/components/atoms/label";
import { Input } from "@/components/atoms/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import ProductSelectorModal from "@/modules/products/components/ProductSelectorModal";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import authSDK from "@/services/sdk-simple-auth";
import { FormProvider, useForm, Controller, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Kbd } from "@/components/atoms/kbd";
import { useNavigate } from "react-router";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { PaginatedCombobox } from "@/components/common/paginatedCombobox";
import { useBranchStore } from "@/states/branchStore";
import { useHotkeys } from "react-hotkeys-hook";
import TooltipButton from "@/components/common/TooltipButton";
import { format } from "date-fns";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useDebounce } from "use-debounce";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { Textarea } from "@/components/atoms/textarea";
import { useOrderTypes } from "../hooks/commons/useOrderTypes";
import { useOrderModalities } from "../hooks/commons/useOrderModalities";
import { useOrderResponsibles } from "../hooks/commons/useOrderResponsibles";
import { useOrderProvider } from "../hooks/commons/useOrderProviders";
import { useCreateOrder } from "../hooks/useCreateOrder";
import type { OrderCreate } from "../types/orderCreate.types";
import { OrderCreateSchema } from "../schemas/orderCreateSchema";
import { useOrderStatus } from "../hooks/commons/useOrderStatus";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/button";
import ShortcutKey from "@/components/common/ShortcutKey";
import OrderDetailTable, { type OrderDetailTableRef } from "../components/OrderDetailTable";
import { useOrderDetails } from "../hooks/useOrderDetails";
import { formatCurrency } from "@/utils/formaters";
import { Separator } from "@/components/atoms/separator";

const OrderCreateScreen = () => {
    const navigate = useNavigate();
    const user = authSDK.getCurrentUser();
    const { selectedBranchId } = useBranchStore();
    const [providerSearchTerm, setProviderSearchTerm] = useState<string>("");
    const [debouncedCustomerSearchTerm] = useDebounce<string>(providerSearchTerm, 500);
    const tableRef = useRef<OrderDetailTableRef>(null);

    // Hook de detalles de orden
    const orderDetailsHook = useOrderDetails();

    const {
        data: orderTypesData,
    } = useOrderTypes();

    const {
        data: orderModalitiesData,
    } = useOrderModalities();

    const {
        data: orderResponsiblesData,
    } = useOrderResponsibles();

    const {
        data: orderProvidersData,
        isLoading: isOrderProvidersLoading
    } = useOrderProvider(debouncedCustomerSearchTerm);

    const {
        data: orderStatusData,
        isLoading: isOrderStatusLoading
    } = useOrderStatus();

    const {
        mutate: createOrder,
        isPending: isSaving
    } = useCreateOrder();

    const { handleError } = useErrorHandler();

    const methods = useForm<OrderCreate>({
        resolver: zodResolver(OrderCreateSchema),
        defaultValues: {
            fecha: format(new Date(), "yyyy-MM-dd"),
            nro_comprobante: "",
            id_proveedor: undefined,
            tipo_pedido: "",
            forma_pedido: "",
            comentario: "",
            sucursal: Number(selectedBranchId) || 1,
            id_responsable: Number(user?._id) || undefined,
            detalles: [],
            fecha_inicio_transito: "",
            fecha_llegada: "",
            estado_actual: "",
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
        formState: { errors }
    } = methods;

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Sincronizar detalles con el formulario
    useEffect(() => {
        const detalles = orderDetailsHook.getOrderDetails();

        if (detalles.length > 0) {
            setValue("detalles", detalles);
            clearErrors("detalles");
        }
    }, [orderDetailsHook.details, setValue, clearErrors]);

    const validateBeforeSubmit = (): boolean => {
        let isValid = true;

        if (orderDetailsHook.details.length === 0) {
            setError("detalles", {
                type: "manual",
                message: "Debes agregar al menos un producto para realizar un pedido"
            });
            showErrorToast({
                title: "Sin productos",
                description: "Debes agregar al menos un producto para realizar un pedido",
                duration: 5000
            });
            isValid = false;
        }

        const formData = getValues();

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

    const handleCheckout = () => {
        orderDetailsHook.clearDetails();

        const currentValues = getValues();
        reset({
            fecha: format(new Date(), "yyyy-MM-dd"),
            nro_comprobante: "",
            id_proveedor: currentValues.id_proveedor,
            tipo_pedido: currentValues.tipo_pedido,
            forma_pedido: currentValues.forma_pedido,
            comentario: "",
            sucursal: currentValues.sucursal,
            id_responsable: currentValues.id_responsable,
            detalles: [],
            fecha_inicio_transito: "",
            fecha_llegada: "",
            estado_actual: currentValues.estado_actual,
        });
    };

    const handleAddProductItem = (product: ProductGet) => {
        orderDetailsHook.addProduct(product);
        // Enfocar el primer input de cantidad después de agregar
        setTimeout(() => {
            tableRef.current?.focusFirstQuantityInput();
        }, 100);
    };

    const handleAddMultipleProducts = (products: ProductGet[]) => {
        products.forEach(product => {
            orderDetailsHook.addProduct(product);
        });
        // Enfocar el primer input de cantidad después de agregar
        setTimeout(() => {
            tableRef.current?.focusFirstQuantityInput();
        }, 100);
    };

    const onSubmit = (data: OrderCreate) => {
        if (!validateBeforeSubmit()) {
            return;
        }
        if (data.fecha_inicio_transito === '') {
            data.fecha_inicio_transito = undefined;
        }

        if (data.fecha_llegada === '') {
            data.fecha_llegada = undefined;
        }
        createOrder(data, {
            onSuccess: () => {
                showSuccessToast({
                    title: "Pedido Exitoso",
                    description: `Pedido realizado con éxito`,
                    duration: 5000
                });
                handleCheckout();
            },
            onError: (error: unknown) => {
                handleError({ error, customTitle: "No se pudo crear el pedido" });
            }
        });
    };

    const onError = (errors: FieldErrors<OrderCreate>) => {
        // console.log("Errores de validación:", errors);
        if (errors.id_proveedor || errors.tipo_pedido || errors.forma_pedido || errors.id_responsable) {
            showErrorToast({
                title: "Error de validación",
                description: "Revisa los campos obligatorios del formulario",
                duration: 5000
            });
            return;
        }
        const firstErrorKey = Object.keys(errors)[0] as keyof OrderCreate;
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

    const handleGoBack = () => {
        navigate('/dashboard/orders');
    };

    const handleNewOrder = () => {
        reset();
        orderDetailsHook.clearDetails();
    };

    useEffect(() => {
        if (!user?._id && orderResponsiblesData && orderResponsiblesData.data.length > 0) {
            const firstResponsible = orderResponsiblesData.data[0];
            setValue("id_responsable", firstResponsible.id);
        }
    }, [orderResponsiblesData, setValue, user?._id]);

    useEffect(() => {
        const clientId = getValues("id_proveedor");
        if (clientId) return;
        if (orderProvidersData?.data && orderProvidersData.data.length > 0) {
            const firstCustomer = orderProvidersData.data[0];
            setValue("id_proveedor", firstCustomer.id);
        }
    }, [orderProvidersData, setValue, getValues]);

    useEffect(() => {
        if (orderTypesData && orderModalitiesData && orderStatusData) {
            if (!getValues("tipo_pedido")) {
                setValue("tipo_pedido", orderTypesData[0].id);
            }
            if (!getValues("forma_pedido")) {
                setValue("forma_pedido", orderModalitiesData[0].id);
            }
            if (!getValues("estado_actual")) {
                setValue("estado_actual", orderStatusData[0].id);
            }
        }
    }, [orderTypesData, orderModalitiesData, orderStatusData, getValues, setValue]);

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
    });

    return (
        <main>
            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit, onError)} className="w-full mx-auto flex flex-col gap-3">
                    {/* Header */}
                    <header className="border-gray-200 border bg-white rounded-lg p-2 sm:px-3">
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <TooltipButton
                                    tooltipContentProps={{
                                        align: 'start'
                                    }}
                                    onClick={handleGoBack}
                                    tooltip={<p className="flex items-center gap-1">Presiona <Kbd>esc</Kbd> para volver a la lista de pedidos</p>}
                                    buttonProps={{
                                        variant: 'default',
                                        type: 'button',
                                    }}
                                >
                                    <CornerUpLeft />
                                </TooltipButton>
                                <div>
                                    <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                                        Nuevo Pedido
                                    </h1>
                                    <p className="text-sm text-gray-500">Registra un nuevo pedido en el sistema</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Formulario de información de cotización*/}
                    <div className="grid md:grid-cols-3 gap-3">
                        {/* 1. Datos del pedido */}
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
                                                <Select onValueChange={field.onChange} value={field.value || orderModalitiesData?.[0]?.id || ""}>
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
                                        <Label htmlFor="tipoCotizacion">Tipo de Pedido *</Label>
                                        <Controller
                                            name="tipo_pedido"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value || orderTypesData?.[0]?.id || ""}>
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
                                        <Label htmlFor="proveedor">Proveedor *</Label>
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
                                                    value={field.value || orderStatusData?.[0]?.id || ""}
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

                    {/* 2. Productos */}
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle>
                                <ProductSelectorModal
                                    isSearchOpen={isSearchOpen}
                                    setIsSearchOpen={setIsSearchOpen}
                                    addItem={handleAddProductItem}
                                    onlyWithStock={true}
                                    addMultipleItem={handleAddMultipleProducts}
                                />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {orderDetailsHook.details.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p>No hay productos agregados</p>
                                        <p className="text-sm">Haz clic en "Seleccionar Productos" para agregar</p>
                                    </div>
                                ) : (
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
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 shadow-none pt-3">
                        <CardContent className="space-y-2">
                            <footer className="flex gap-3 items-center justify-between">
                                <span className="text-xs text-gray-500">* Campos requeridos</span>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        size={'sm'}
                                        variant="outline"
                                        className="w-full py-3 font-medium"
                                        onClick={handleNewOrder}
                                    >
                                        Nuevo Pedido
                                    </Button>

                                    <TooltipButton
                                        buttonProps={{
                                            type: 'submit',
                                            disabled: isSaving,
                                            variant: 'default',
                                            className: "w-full"
                                        }}
                                        tooltip={
                                            <span className="flex items-center gap-1">Registrar Pedido <ShortcutKey combo="alt+s" /></span>
                                        }
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                Procesando Pedido...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 size-4" />
                                                Registrar Pedido
                                            </>
                                        )}
                                    </TooltipButton>
                                </div>
                            </footer>
                        </CardContent>
                    </Card>
                </form>
            </FormProvider>
        </main>
    );
};

export default OrderCreateScreen;