import { useEffect, useState } from "react";
import { ShoppingCart, CornerUpLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Label } from "@/components/atoms/label";
import { Input } from "@/components/atoms/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import ProductSelectorModal from "@/modules/products/components/ProductSelectorModal";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import authSDK from "@/services/sdk-simple-auth";
import { useCartWithUtils } from "@/modules/shoppingCart/hooks/useCartWithUtils";
import { FormProvider, useForm, Controller, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Kbd } from "@/components/atoms/kbd";
import { useNavigate } from "react-router";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { PaginatedCombobox } from "@/components/common/paginatedCombobox";
import { useBranchStore } from "@/states/branchStore";
import { useHotkeys } from "react-hotkeys-hook";
import TooltipButton from "@/components/common/TooltipButton";
import { format, parse } from "date-fns";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useDebounce } from "use-debounce";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useSaleTypes } from "@/modules/sales/hooks/useSaleTypes";
import { useSaleModalities } from "@/modules/sales/hooks/useSaleModalities";
import { useSaleResponsibles } from "@/modules/sales/hooks/useSaleResponsibles";
import { useSaleCustomers } from "@/modules/sales/hooks/useSaleCustomers";
import { useCreateQuotation } from "../hooks/useCreateQuotation";
import type { QuotationCreate, QuotationDetail } from "../types/quotationCreate.types";
import { QuotationCreateSchema } from "../schemas/quotationCreate.schema";
import QuotationsSummary from "../components/quotationsSummary";
import ProductDetailTable from "../components/productDetailTable";
import { Textarea } from "@/components/atoms/textarea";
import { EditablePrice } from "@/modules/shoppingCart/components/editablePrice";
import { Switch } from "@/components/atoms/switch";

const QuotationCreateScreen = () => {
    const navigate = useNavigate();
    const user = authSDK.getCurrentUser()
    const { selectedBranchId } = useBranchStore()
    const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");

    const [debouncedCustomerSearchTerm] = useDebounce<string>(customerSearchTerm, 500)

    const {
        data: saleTypesData,
    } = useSaleTypes()

    const {
        data: saleModalitiesData,
    } = useSaleModalities()

    const {
        data: saleResponsiblesData,
    } = useSaleResponsibles()

    const {
        data: saleCustomersData,
        isLoading: isSaleCustomersLoading
    } = useSaleCustomers(debouncedCustomerSearchTerm)

    const {
        mutate: createQuotation,
        isPending: isSaving
    } = useCreateQuotation();

    const { handleError } = useErrorHandler()

    const methods = useForm<QuotationCreate>({
        resolver: zodResolver(QuotationCreateSchema),
        defaultValues: {
            fecha: format(new Date(), "yyyy-MM-dd"),
            nro_comprobante: "",
            nro_comprobante2: "",
            id_cliente: undefined,
            tipo_cotizacion: "",
            forma_cotizacion: "",
            comentarios: "",
            plazo_pago: "",
            vehiculo: "",
            nro_motor: "",
            cliente_nombre: "",
            cliente_nit: "",
            usuario: 1,
            sucursal: Number(selectedBranchId) || 1,
            id_responsable: Number(user?._id) || undefined,
            detalles: [],
            cliente_contacto: "",
            cliente_telefono: "",
            anticipo: 0,
            pedido: false,
        }
    });

    const {
        register,
        watch,
        reset,
        resetField,
        control,
        handleSubmit,
        setValue,
        getValues,
        setError,
        clearErrors,
        formState: { errors }
    } = methods

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const {
        items,
        getCartSubtotal,
        getCartTotal,
        discountAmount,
        discountPercent,
        setDiscountAmount,
        setDiscountPercent,
        clearCart,
        addItemToCart,
        addMultipleItems,
        validateCartWithToast
    } = useCartWithUtils(user?.name || '', selectedBranchId ?? '')
    const subtotal = getCartSubtotal();
    const total = getCartTotal();

    useEffect(() => {
        const detalles: QuotationDetail[] = items.map((item, index) => ({
            id_producto: item.product.id,
            cantidad: item.quantity,
            precio: item.customPrice,
            descuento: ((item.customPrice ?? 0) * item.quantity) * ((discountPercent ?? 0) / 100),
            porcentaje_descuento: discountPercent ?? 0,
            descripcion: item.customDescription,
            nueva_marca: item.customBrand,
            orden: index + 1,
        }));

        if (detalles.length > 0) {
            setValue("detalles", detalles);
            clearErrors("detalles");
        } else {
            // setValue("detalles", []);
        }
    }, [items, discountAmount, discountPercent, setValue, clearErrors]);

    const validateBeforeSubmit = (): boolean => {
        let isValid = true;

        if (items.length === 0) {
            setError("detalles", {
                type: "manual",
                message: "Debes agregar al menos un producto para realizar una cotización"
            });
            showErrorToast({
                title: "Carrito vacío",
                description: "Debes agregar al menos un producto para realizar una cotización",
                duration: 5000
            });
            isValid = false;
        }

        const validation = validateCartWithToast();
        if (!validation.isValid) {
            setError("detalles", {
                type: "manual",
                message: "Hay productos con problemas de stock en el carrito"
            });
            isValid = false;
        }

        const formData = getValues();

        if (!formData.id_cliente) {
            setError("id_cliente", {
                type: "manual",
                message: "Debes seleccionar un cliente"
            });
            showErrorToast({
                title: "Cliente requerido",
                description: "Debes seleccionar un cliente para la cotización",
                duration: 5000
            });
            isValid = false;
        }

        if (!formData.tipo_cotizacion) {
            setError("tipo_cotizacion", {
                type: "manual",
                message: "Debes seleccionar un tipo de cotización"
            });
            isValid = false;
        }

        if (!formData.forma_cotizacion) {
            setError("forma_cotizacion", {
                type: "manual",
                message: "Debes seleccionar una forma de cotización"
            });
            isValid = false;
        }

        if (formData.tipo_cotizacion === "VC" && !formData.plazo_pago) {
            setError("plazo_pago", {
                type: "manual",
                message: "Debes especificar la fecha de plazo para cotización a crédito"
            });
            showErrorToast({
                title: "Plazo requerido",
                description: "Las cotizaciones a crédito requieren una fecha de plazo",
                duration: 5000
            });
            isValid = false;
        }

        return isValid;
    };

    // VALIDACIÓN DE FECHA DE PLAZO
    const tipoCotizacion = watch("tipo_cotizacion");
    const plazoPago = watch("plazo_pago");
    useEffect(() => {

        if (tipoCotizacion === "VC" && plazoPago) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const plazoDate = parse(plazoPago, "yyyy-MM-dd", new Date());
            plazoDate.setHours(0, 0, 0, 0);

            if (plazoDate <= today) {
                setError("plazo_pago", {
                    type: "manual",
                    message: "La fecha de plazo debe ser posterior a hoy"
                });
                showErrorToast({
                    title: "Fecha inválida",
                    description: "La fecha de plazo debe ser posterior a hoy",
                    duration: 5000
                });
                resetField("plazo_pago");
            } else {
                clearErrors("plazo_pago");
            }
        }
        if (tipoCotizacion !== "VC") {
            resetField("plazo_pago");
        }
    }, [tipoCotizacion, plazoPago, resetField, setError, clearErrors, watch]);

    const handleCheckout = () => {
        clearCart();

        const currentValues = getValues();
        reset({
            fecha: format(new Date(), "yyyy-MM-dd"),
            nro_comprobante: "",
            nro_comprobante2: "",
            id_cliente: currentValues.id_cliente,
            tipo_cotizacion: currentValues.tipo_cotizacion,
            forma_cotizacion: currentValues.forma_cotizacion,
            comentarios: "",
            plazo_pago: "",
            vehiculo: "",
            nro_motor: "",
            cliente_nombre: currentValues.cliente_nombre,
            cliente_nit: currentValues.cliente_nit,
            usuario: currentValues.usuario,
            sucursal: currentValues.sucursal,
            id_responsable: currentValues.id_responsable,
            detalles: [],
            cliente_contacto: "",
            cliente_telefono: "",
            anticipo: 0,
            pedido: false,
        });
    };

    const handleAddProductItem = (product: ProductGet) => {
        addItemToCart(product)
    };

    const handleAddMultipleProducts = (products: ProductGet[]) => {
        addMultipleItems(products);
    };

    // FUNCIÓN onSubmit corregida
    const onSubmit = (data: QuotationCreate) => {
        if (!validateBeforeSubmit()) {
            return;
        }
        createQuotation(data, {
            onSuccess: () => {
                // console.log('Cotización creada:', response);
                showSuccessToast({
                    title: "Cotización Exitosa",
                    description: `Cotización realizada con éxito`,
                    duration: 5000
                });
                handleCheckout();
            },
            onError: (error: unknown) => {
                handleError({ error, customTitle: "No se pudo crear la cotización" });
            }
        });
    };

    const onError = (errors: FieldErrors<QuotationCreate>) => {
        console.log("Errores de validación:", errors);
        if (errors.id_cliente || errors.tipo_cotizacion || errors.forma_cotizacion || errors.id_responsable) {
            showErrorToast({
                title: "Error de validación",
                description: "Revisa los campos obligatorios del formulario",
                duration: 5000
            });
            return;
        }
        const firstErrorKey = Object.keys(errors)[0] as keyof QuotationCreate;
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
        navigate('/dashboard/productos')
    }

    useEffect(() => {
        if (!user?._id && saleResponsiblesData && saleResponsiblesData.length > 0) {
            const firstResponsible = saleResponsiblesData[0];
            setValue("id_responsable", firstResponsible.id);
        }
    }, [saleResponsiblesData, setValue, user?._id]);

    useEffect(() => {
        const clientId = getValues("id_cliente");
        if (clientId) return
        if (saleCustomersData?.data && saleCustomersData.data.length > 0) {
            const firstCustomer = saleCustomersData.data[0];
            setValue("id_cliente", firstCustomer.id);
            setValue("cliente_nombre", firstCustomer.nombre);
            setValue("cliente_nit", firstCustomer.nit?.toString() || "");
        }
    }, [saleCustomersData, setValue, getValues]);

    useEffect(() => {
        if (saleTypesData && saleModalitiesData) {
            if (!getValues("tipo_cotizacion")) {
                setValue("tipo_cotizacion", saleTypesData[0].code)
            }
            if (!getValues("forma_cotizacion")) {
                setValue("forma_cotizacion", saleModalitiesData[0].code)
            }
        }
    }, [saleTypesData, saleModalitiesData, getValues, setValue])

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
                                    tooltip={<p className="flex items-center gap-1">Presiona <Kbd>esc</Kbd> para volver a la lista de productos</p>}
                                    buttonProps={{
                                        variant: 'default',
                                        type: 'button'
                                    }}
                                >
                                    <CornerUpLeft />
                                </TooltipButton>
                                <div>
                                    <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                                        Nueva Cotización
                                    </h1>
                                    <p className="text-sm text-gray-500">Registra una nueva cotización en el sistema</p>
                                </div>
                            </div >

                            {/* Action Buttons */}
                            < div className="flex items-center justify-end w-full sm:w-auto gap-2" >

                            </div >
                        </div >
                    </header >

                    {/* Formulario de información de cotización*/}
                    <div className="grid md:grid-cols-3 gap-3">
                        {/* 1. Datos de la cotización */}
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
                                                    options={saleResponsiblesData || []}
                                                    optionTag={"nombre"}
                                                />
                                            )}
                                        />
                                        {errors.id_responsable && <p className="text-red-500 text-sm mt-1">El campo es requerido</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="forma">Forma de Cotización *</Label>
                                        <Controller
                                            name="forma_cotizacion"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value || saleModalitiesData?.[0]?.code || ""}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona una forma" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {
                                                            saleModalitiesData && saleModalitiesData.map((modality) => (
                                                                <SelectItem key={modality.code} value={modality.code}>
                                                                    {modality.label}
                                                                </SelectItem>
                                                            ))
                                                        }
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.forma_cotizacion && <p className="text-red-500 text-sm mt-1">{errors.forma_cotizacion.message}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="tipoCotizacion">Tipo de Cotización *</Label>
                                        <Controller
                                            name="tipo_cotizacion"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value || saleTypesData?.[0]?.code || ""}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un tipo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {
                                                            saleTypesData && saleTypesData.map((type) => (
                                                                <SelectItem key={type.code} value={type.code}>
                                                                    {type.label}
                                                                </SelectItem>
                                                            ))
                                                        }
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.tipo_cotizacion && <p className="text-red-500 text-sm mt-1">El campo es requerido</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="nroComprobante">N° Comprobante</Label>
                                        <Input
                                            id="nroComprobante"
                                            {...register("nro_comprobante")}
                                            placeholder="Número de comprobante"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="nroComprobanteSecundario">N° Comprobante Sec.</Label>
                                        <Input
                                            id="nroComprobanteSecundario"
                                            {...register("nro_comprobante2")}
                                            placeholder="Comprobante secundario"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="fechaPlazo">
                                            Fecha Plazo
                                            <span className="text-xs ml-1 text-gray-500">(Crédito)</span>
                                        </Label>
                                        <Input
                                            id="fechaPlazo"
                                            type="date"
                                            {...register("plazo_pago")}
                                            disabled={watch("tipo_cotizacion") !== "VC"}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="vehiculo">Vehículo</Label>
                                        <Input
                                            id="vehiculo"
                                            {...register("vehiculo")}
                                            placeholder="Modelo del vehículo"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="motor">Motor</Label>
                                        <Input
                                            id="motor"
                                            {...register("nro_motor")}
                                            placeholder="Tipo de motor"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="anticipo">Anticipo</Label>
                                        <Controller
                                            name="anticipo"
                                            control={control}
                                            render={({ field }) => (
                                                <EditablePrice
                                                    value={field.value || 0}
                                                    onSubmit={(value) => field.onChange(value as number)}
                                                    className="w-full"
                                                    buttonClassName="w-full"
                                                    numberProps={{ min: 0, step: 0.01 }}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="pedido">Es Pedido</Label>
                                        <div>
                                            <Controller
                                                name="pedido"
                                                control={control}
                                                render={({ field }) => (
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={(checked) => field.onChange(checked)}
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-none h-full">

                            <CardContent className="space-y-3 py-3">
                                <div className="grid sm:grid-cols-2 gap-y-3 gap-x-2">

                                    <div>
                                        <Label htmlFor="cliente">Cliente *</Label>
                                        <Controller
                                            name="id_cliente"
                                            control={control}
                                            render={({ field }) => (
                                                <PaginatedCombobox
                                                    value={field.value}
                                                    onChange={(value) => {
                                                        field.onChange(Number(value));
                                                        const selected = saleCustomersData?.data.find((c) => c.id.toString() === value);
                                                        if (selected) {
                                                            setValue("cliente_nombre", selected.nombre);
                                                            setValue("cliente_nit", selected.nit?.toString() || "");
                                                        }
                                                    }}
                                                    optionsData={saleCustomersData?.data || []}
                                                    displayField="nombre"
                                                    isLoading={isSaleCustomersLoading}
                                                    updatePage={(page) => { console.log("Update page:", page) }}
                                                    updateSearch={setCustomerSearchTerm}
                                                    metaData={
                                                        {
                                                            current_page: saleCustomersData?.meta.current_page || 1,
                                                            last_page: saleCustomersData?.meta.last_page || 1,
                                                            total: saleCustomersData?.meta.total || 0,
                                                            per_page: saleCustomersData?.meta.per_page || 10,
                                                        }
                                                    }
                                                />
                                            )}
                                        />
                                        {errors.id_cliente && <p className="text-red-500 text-sm mt-1">El campo es requerido</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="altClie">Alt. Cliente</Label>
                                        <Input
                                            id="altClie"
                                            {...register("cliente_nombre")}
                                            placeholder="Cliente alternativo"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="contacto">Contacto</Label>
                                        <Input
                                            id="contacto"
                                            {...register("cliente_contacto")}
                                            placeholder="Nombre de contacto"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="telefono">Teléfono</Label>
                                        <Input
                                            id="telefono"
                                            {...register("cliente_telefono")}
                                            placeholder="Teléfono del cliente"
                                        />
                                    </div>

                                    <div className="col-span-full">
                                        <Label htmlFor="comentarios">Comentarios</Label>
                                        <Textarea
                                            id="comentarios"
                                            {...register("comentarios")}
                                            placeholder="Comentarios adicionales sobre la Cotización"
                                            rows={1}
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
                                {items.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p>No hay productos agregados</p>
                                        <p className="text-sm">Haz clic en "Seleccionar Productos" para agregar</p>
                                    </div>
                                ) :
                                    <ProductDetailTable />
                                }
                            </div>
                        </CardContent>
                    </Card>
                    {/* Resumen de Cotización  */}
                    <QuotationsSummary
                        clearCart={clearCart}
                        discountAmount={discountAmount || 0}
                        discountPercent={discountPercent || 0}
                        isPending={isSaving}
                        reset={reset}
                        setDiscountAmount={setDiscountAmount}
                        setDiscountPercent={setDiscountPercent}
                        subtotal={subtotal}
                        total={total}
                        hasProducts={items.length > 0}
                    />
                </form>
            </FormProvider>
        </main>
    );
};

export default QuotationCreateScreen;