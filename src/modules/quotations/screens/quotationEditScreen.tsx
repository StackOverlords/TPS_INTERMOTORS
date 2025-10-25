import ErrorDataComponent from "@/components/common/errorDataComponent"
import { useNavigate, useParams } from "react-router"
import TooltipButton from "@/components/common/TooltipButton"
import { CornerUpLeft, Loader2, Save, ShoppingCart } from "lucide-react"
import { Kbd } from "@/components/atoms/kbd"
import { Controller, FormProvider, useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Label } from "@/components/atoms/label"
import { Input } from "@/components/atoms/input"
import { ComboboxSelect } from "@/components/common/SelectCombobox"
import { useEffect, useState } from "react"
import { useDebounce } from "use-debounce"
import { PaginatedCombobox } from "@/components/common/paginatedCombobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select"
import { useBranchStore } from "@/states/branchStore"
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced"
import { format, parse } from "date-fns"
import { useHotkeys } from "react-hotkeys-hook"
import ProductSelectorModal from "@/modules/products/components/ProductSelectorModal"
import { useGoBack } from "@/hooks/useGoBack"
import { Button } from "@/components/atoms/button"
import { Separator } from "@/components/atoms/separator"
import { formatCurrency } from "@/utils/formaters"
import { EditablePercentage } from "@/modules/shoppingCart/components/EditablePercentage"
import { EditablePrice } from "@/modules/shoppingCart/components/editablePrice"
import { useErrorHandler } from "@/hooks/useErrorHandler"
import ShortcutKey from "@/components/common/ShortcutKey"
import { useSaleTypes } from "@/modules/sales/hooks/useSaleTypes"
import { useSaleModalities } from "@/modules/sales/hooks/useSaleModalities"
import { useSaleResponsibles } from "@/modules/sales/hooks/useSaleResponsibles"
import { useSaleCustomers } from "@/modules/sales/hooks/useSaleCustomers"
import { useUpdateQuotation } from "../hooks/useUpdateQuotation"
import { useQuotationGetById } from "../hooks/useQuotationGetById"
import type { QuotationUpdate, QuotationUpdateDetail } from "../types/quotationUpdate.types"
import { QuotationUpdateSchema } from "../schemas/quotationUpdate.schema"
import QuotationEditSkeleton from "../components/quotationEditSkeleton"
import { Textarea } from "@/components/atoms/textarea"
import useQuotationProductDetails from "../hooks/useQuotationProductDetails"
import QuotationDetailsEditingTable from "../components/quotationDetailsEditingTable"
import { Switch } from "@/components/atoms/switch"
import ResizableBox from "@/components/atoms/resizable-box"
import ProductSearchPanel from "@/modules/products/components/ProductSearchPanel"

const QuotationEditScreen = () => {
    const navigate = useNavigate()
    const { selectedBranchId } = useBranchStore()
    const { quotationId } = useParams()
    const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
    const [debouncedCustomerSearchTerm] = useDebounce<string>(customerSearchTerm, 500)
    const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
    const [hasInitialized, setHasInitialized] = useState<boolean>(false);

    const {
        data: quotationTypesData,
        isLoading: isLoadingQuotationTypes,
    } = useSaleTypes()

    const {
        data: quotationModalitiesData,
        isLoading: isLoadingQuotationModalities,
    } = useSaleModalities()

    const {
        data: quotationResponsiblesData,
        isLoading: isLoadingQuotationResponsibles
    } = useSaleResponsibles()

    const {
        data: quotationCustomersData,
        isLoading: isQuotationCustomersLoading
    } = useSaleCustomers(debouncedCustomerSearchTerm)

    const {
        mutate: updateQuotation,
        isPending: isSaving
    } = useUpdateQuotation();

    const {
        data: quotationData,
        isLoading: isLoadingQuotation,
        isError: isErrorQuotation
    } = useQuotationGetById(Number(quotationId))

    const handleGoBack = useGoBack("/dashboard/quotations");
    const { handleError } = useErrorHandler()

    const formMethods = useForm<QuotationUpdate>({
        resolver: zodResolver(QuotationUpdateSchema),
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
            id_responsable: 1,
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
    } = formMethods

    useEffect(() => {
        if (quotationData && quotationTypesData && quotationModalitiesData) {
            const detallesTransformados: QuotationUpdateDetail[] = quotationData.detalles.map((detalle, index) => ({
                id_producto: detalle.producto.id,
                descripcion: detalle.descripcion,
                cantidad: detalle.cantidad,
                precio: detalle.precio,
                descuento: detalle.descuento ?? 0,
                porcentaje_descuento: detalle.porcentaje_descuento ?? 0,
                nueva_marca: detalle.marca,
                orden: index + 1,
                id_detalle_cotizacion: detalle.id,
            }));

            const resetData: QuotationUpdate = {
                fecha: format(quotationData.fecha, "yyyy-MM-dd") ?? "",
                nro_comprobante2: quotationData.comprobante2 ?? "",
                nro_comprobante: quotationData.comprobante ?? "",
                id_cliente: quotationData.cliente?.id ?? 0,
                comentarios: quotationData.comentarios ?? "",
                plazo_pago: quotationData.plazo_pago?.slice(0, 10) ?? "",
                vehiculo: quotationData.vehiculo ?? "",
                nro_motor: quotationData.nmotor ?? "",
                cliente_nombre: quotationData.cliente?.cliente ?? "",
                cliente_nit: quotationData.cliente_nit ?? "",
                usuario: 1,
                sucursal: 1,
                id_responsable: quotationData.responsable_cotizacion?.id ?? 1,
                detalles: detallesTransformados,
                tipo_cotizacion: quotationData.tipo_cotizacion,
                forma_cotizacion: quotationData.forma_cotizacion,
                cliente_contacto: quotationData.cliente_contacto ?? "",
                cliente_telefono: quotationData.cliente_telefono ?? "",
                anticipo: quotationData.anticipo ?? 0,
                pedido: quotationData.es_pedido,
            };
            reset(resetData);
            setHasInitialized(true);
        }
    }, [quotationData, quotationTypesData, quotationModalitiesData, reset]);

    const validateBeforeSubmit = (): boolean => {
        let isValid = true;
        const formData = getValues();

        if (formData.detalles.length === 0) {
            setError("detalles", {
                type: "manual",
                message: "Debes agregar al menos un producto para realizar una cotización"
            });
            showErrorToast({
                title: "No hay productos seleccionados",
                description: "Debes agregar al menos un producto para realizar una cotización",
                duration: 5000
            });
            isValid = false;
        }

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
        if (!hasInitialized) return;
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
            resetField("plazo_pago", { defaultValue: "" });
        }
    }, [tipoCotizacion, plazoPago, resetField, setError, clearErrors, hasInitialized]);

    const {
        addProduct,
        removeProduct,
        updateQuantity,
        updatePrice,
        updateCustomSubtotal,
        applyGlobalDiscount,
        calculateTotal,
        calculateTotalDiscount,
        calculateTotalBeforeDiscount,
        getDiscountPercentage,
        updateDescription,
        updateBrand
    } = useQuotationProductDetails({ formMethods });

    const onSubmit = (data: QuotationUpdate) => {
        if (!validateBeforeSubmit()) return;

        const result = QuotationUpdateSchema.safeParse(data);

        if (!result.success) {
            showErrorToast({
                title: "Datos inválidos",
                description: "Revisa los campos antes de continuar.",
                duration: 5000,
            });
            return;
        }

        const transformedData = result.data;
        updateQuotation(
            { quotationId: Number(quotationId), data: transformedData },
            {
                onSuccess: () => {
                    showSuccessToast({
                        title: "Cotización Modificada",
                        description: `Cotización modificada con éxito`,
                        duration: 5000,
                    });
                    setTimeout(handleGoBack, 200);
                },
                onError: (error: unknown) => {
                    handleError({ error, customTitle: "No se pudo modificar la cotización" });
                }
            }
        );
    };

    const onError = (errors: FieldErrors<QuotationUpdate>) => {
        console.log(errors)
        if (errors.id_cliente || errors.tipo_cotizacion || errors.forma_cotizacion || errors.id_responsable) {
            showErrorToast({
                title: "Error de validación",
                description: "Revisa los campos obligatorios del formulario",
                duration: 5000
            });
            return;
        }
        const firstErrorKey = Object.keys(errors)[0] as keyof QuotationUpdate;
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

    if (isLoadingQuotation || isLoadingQuotationTypes || isLoadingQuotationModalities || isLoadingQuotationResponsibles) {
        return <QuotationEditSkeleton />;
    }

    if (isErrorQuotation || isNaN(Number(quotationId))) {
        return <ErrorDataComponent
            errorMessage="No se pudo cargar la cotización."
            showButtonIcon={false}
            buttonText="Ir a lista de cotizaciones"
            onRetry={() => {
                navigate("/dashboard/quotations")
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
                                            Editar cotización #{quotationData?.nro}
                                        </h1>
                                        {quotationData && (
                                            <p className="text-sm text-gray-600">
                                                {quotationData.cliente ? `${quotationData.cliente?.cliente} - ` : ''}
                                                {quotationData.cantidad_detalles} {quotationData.cantidad_detalles === 1 ? 'producto' : 'productos'}
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
                                                        options={quotationResponsiblesData || []}
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
                                                    <Select onValueChange={field.onChange} value={field.value || quotationData?.forma_cotizacion || ""}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona una forma" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {
                                                                quotationModalitiesData && quotationModalitiesData.map((modality) => (
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
                                                    <Select onValueChange={field.onChange} value={field.value || quotationData?.tipo_cotizacion || ""}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona un tipo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {
                                                                quotationTypesData && quotationTypesData.map((type) => (
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
                                                        value={field.value || quotationData?.anticipo || 0}
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
                                                            const selected = quotationCustomersData?.data.find((c) => c.id.toString() === value);
                                                            if (selected) {
                                                                setValue("cliente_nombre", selected.nombre);
                                                                setValue("cliente_nit", selected.nit?.toString() || "");
                                                            }
                                                        }}
                                                        optionsData={quotationCustomersData?.data || []}
                                                        displayField="nombre"
                                                        isLoading={isQuotationCustomersLoading}
                                                        updatePage={(page) => { console.log("Update page:", page) }}
                                                        updateSearch={setCustomerSearchTerm}
                                                        metaData={
                                                            {
                                                                current_page: quotationCustomersData?.meta.current_page || 1,
                                                                last_page: quotationCustomersData?.meta.last_page || 1,
                                                                total: quotationCustomersData?.meta.total || 0,
                                                                per_page: quotationCustomersData?.meta.per_page || 10,
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

                    </form>

                    {/* 2. Productos */}
                    <div className="flex-1 overflow-auto flex flex-col">
                        {/* Panel de búsqueda de productos - Superior (altura para ~5 filas) */}
                        <div className="flex-shrink-0">
                            <ResizableBox
                                direction="vertical"
                                minSize={'100px'}
                                initialSize={'350px'}
                            >
                                <ProductSearchPanel
                                    selectedProducts={watch("detalles")}
                                    onProductSelect={addProduct}
                                    onlySelectWithStock={true}
                                />
                            </ResizableBox>
                        </div>
                    </div>

                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Detalle de Venta
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="-mt-4">
                            <div className="space-y-2">
                                {quotationData?.detalles.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p>No hay productos agregados</p>
                                        <p className="text-sm">Haz clic en "Seleccionar Productos" para agregar</p>
                                    </div>
                                ) :
                                    <QuotationDetailsEditingTable
                                        products={watch("detalles")}
                                        removeItem={removeProduct}
                                        updatePrice={updatePrice}
                                        updateQuantity={updateQuantity}
                                        updateCustomSubtotal={updateCustomSubtotal}
                                        updateBrand={updateBrand}
                                        updateDescription={updateDescription}
                                    />
                                }
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-none border-gray-200 pt-3">
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-3">
                                <section className="space-y-2 bg-gray-50 p-3 rounded-lg">
                                    <header className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-gray-700">Descuento</span>
                                    </header>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs text-gray-600">Porcentaje (%)</Label>
                                            <EditablePercentage
                                                value={getDiscountPercentage()}
                                                onSubmit={(value) => applyGlobalDiscount(value as number, 'percentage')}
                                                className="w-full"
                                                buttonClassName="w-full"
                                                showEditIcon={false}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-gray-600">Monto (Bs)</Label>
                                            <EditablePrice
                                                value={calculateTotalDiscount()}
                                                onSubmit={(value) => applyGlobalDiscount(value as number, 'amount')}
                                                className="w-full"
                                                buttonClassName="w-full"
                                                showEditIcon={false}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-1">
                                        {[0, 5, 10, 15, 20].map((percentage) => (
                                            <Button
                                                key={percentage}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="text-xs h-7 px-2 border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-600 transition-colors duration-300"
                                                onClick={() => applyGlobalDiscount(percentage, 'percentage')}
                                            >
                                                {percentage}%
                                            </Button>
                                        ))}
                                    </div>
                                </section>

                                {/* Totales - DERECHA */}
                                <section className="space-y-4">
                                    <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <Label>Subtotal:</Label>
                                            <span className="text-base font-semibold tabular-nums">
                                                {formatCurrency(calculateTotalBeforeDiscount())}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <Label>
                                                Descuento ({getDiscountPercentage().toFixed(2)}%):
                                            </Label>
                                            <span className="text-base font-semibold text-red-600 tabular-nums">
                                                -{formatCurrency(calculateTotalDiscount())}
                                            </span>
                                        </div>

                                        <Separator className="my-2" />

                                        <div className="bg-white rounded-lg p-2 border border-green-200">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-base font-bold text-gray-700">TOTAL:</Label>
                                                <span className="text-xl font-bold text-green-600 tabular-nums">
                                                    {formatCurrency(calculateTotal())}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </CardContent>
                    </Card>
                </FormProvider>
            </div>
        </main >
    );
}

export default QuotationEditScreen;