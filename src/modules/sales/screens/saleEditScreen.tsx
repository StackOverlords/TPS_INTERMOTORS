import ErrorDataComponent from "@/components/common/errorDataComponent"
import { useNavigate, useParams } from "react-router"
import { useSaleGetById } from "../hooks/useSaleGetById"
import TooltipButton from "@/components/common/TooltipButton"
import { CornerUpLeft, Loader2, Save, ShoppingCart } from "lucide-react"
import { Kbd } from "@/components/atoms/kbd"
import { Controller, FormProvider, useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { SaleUpdate, SaleUpdateDetailUI, SaleUpdateForm } from "../types/saleUpdate.type"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Label } from "@/components/atoms/label"
import { Input } from "@/components/atoms/input"
import { ComboboxSelect } from "@/components/common/SelectCombobox"
import { useEffect, useState } from "react"
import { useDebounce } from "use-debounce"
import { useSaleTypes } from "../hooks/useSaleTypes"
import { useSaleModalities } from "../hooks/useSaleModalities"
import { useSaleResponsibles } from "../hooks/useSaleResponsibles"
import { useSaleCustomers } from "../hooks/useSaleCustomers"
import { PaginatedCombobox } from "@/components/common/paginatedCombobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select"
import { useBranchStore } from "@/states/branchStore"
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced"
import { parse } from "date-fns"
import { useHotkeys } from "react-hotkeys-hook"
import ProductSelectorModal from "@/modules/products/components/ProductSelectorModal"
import SaleDetailsEditingTable from "../components/saleEdit/saleDetailsEditingTable"
import { SaleUpdateFormSchema, SaleUpdateSchema } from "../schemas/saleUpdate.schema"
import useSaleProductDetailsWithForm from "../hooks/useSaleProductDetails"
import { useUpdateSale } from "../hooks/useUpdateSale"
import { useGoBack } from "@/hooks/useGoBack"
import { Button } from "@/components/atoms/button"
import { Separator } from "@/components/atoms/separator"
import { formatCurrency } from "@/utils/formaters"
import { EditablePercentage } from "@/modules/shoppingCart/components/EditablePercentage"
import { EditablePrice } from "@/modules/shoppingCart/components/editablePrice"
import { useErrorHandler } from "@/hooks/useErrorHandler"
import SaleEditSkeleton from "../components/saleEdit/saleEditSkeleton"
import ShortcutKey from "@/components/common/ShortcutKey"
import { Textarea } from "@/components/atoms/textarea"

const SaleEditScreen = () => {
    const navigate = useNavigate()
    const { selectedBranchId } = useBranchStore()
    const { saleId } = useParams()
    const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
    const [debouncedCustomerSearchTerm] = useDebounce<string>(customerSearchTerm, 500)
    const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
    const [hasInitialized, setHasInitialized] = useState<boolean>(false);

    const {
        data: saleTypesData,
        isLoading: isLoadingSaleTypes,
    } = useSaleTypes()

    const {
        data: saleModalitiesData,
        isLoading: isLoadingSaleModalities,
    } = useSaleModalities()

    const {
        data: saleResponsiblesData,
        isLoading: isLoadingSaleResponsibles
    } = useSaleResponsibles()

    const {
        data: saleCustomersData,
        isLoading: isSaleCustomersLoading
    } = useSaleCustomers(debouncedCustomerSearchTerm)

    const {
        mutate: updateSale,
        isPending: isSaving
    } = useUpdateSale();

    const {
        data: saleData,
        isLoading: isLoadingSale,
        isError: isErrorSale
    } = useSaleGetById(Number(saleId))

    const handleGoBack = useGoBack("/dashboard/sales");
    const { handleError } = useErrorHandler()

    const formMethods = useForm<SaleUpdateForm>({
        resolver: zodResolver(SaleUpdateFormSchema),
        defaultValues: {
            fecha: "",
            nro_comprobante: "",
            nro_comprobante2: "",
            id_cliente: undefined,
            tipo_venta: "",
            forma_venta: "",
            comentario: "",
            plazo_pago: "",
            vehiculo: "",
            nro_motor: "",
            cliente_nombre: "",
            cliente_nit: "",
            usuario: 1,
            sucursal: Number(selectedBranchId) || 1,
            id_responsable: undefined,
            detalles: []
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
        if (saleData && saleTypesData && saleModalitiesData) {
            const detallesTransformados: SaleUpdateDetailUI[] =
                (saleData.detalles ?? []).map((d) => ({
                    cantidad: d.cantidad,
                    descuento: d.descuento,
                    id_detalle_venta: d.id,
                    id_producto: d.producto.id,
                    porcentaje_descuento: d.porcentaje_descuento,
                    precio: d.precio,
                    producto: {
                        id: d.producto.id,
                        categoria: d.producto.categoria?.categoria ?? null,
                        codigo_oem: d.producto.codigo_oem ?? null,
                        codigo_upc: d.producto.codigo_upc ?? null,
                        descripcion: d.producto.descripcion,
                        marca: d.producto.marca?.marca ?? '',
                        precio_venta: d.producto.precio_venta
                    }
                }));

            const resetData: SaleUpdateForm = {
                fecha: saleData.fecha?.slice(0, 10) ?? "",
                nro_comprobante2: saleData.comprobante2 ?? "",
                nro_comprobante: saleData.comprobante ?? "",
                id_cliente: saleData.cliente?.id ?? 0,
                comentario: saleData.comentarios ?? "",
                plazo_pago: saleData.plazo_pago?.slice(0, 10) ?? "",
                vehiculo: saleData.vehiculo ?? "",
                nro_motor: saleData.nmotor ?? "",
                cliente_nombre: saleData.cliente?.cliente ?? "",
                cliente_nit: saleData.cliente?.nit?.toString() ?? "",
                usuario: 1,
                sucursal: 1,
                id_responsable: saleData.responsable_venta?.id ?? 0,
                detalles: detallesTransformados,
                tipo_venta: saleData.tipo_venta,
                forma_venta: saleData.forma_venta,
            };
            reset(resetData);
            setHasInitialized(true);
        }
    }, [saleData, saleTypesData, saleModalitiesData, reset]);

    const validateBeforeSubmit = (): boolean => {
        let isValid = true;
        const formData = getValues();

        if (formData.detalles.length === 0) {
            setError("detalles", {
                type: "manual",
                message: "Debes agregar al menos un producto para realizar una venta"
            });
            showErrorToast({
                title: "No hay productos seleccionados",
                description: "Debes agregar al menos un producto para realizar una venta",
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
                description: "Debes seleccionar un cliente para la venta",
                duration: 5000
            });
            isValid = false;
        }

        if (!formData.tipo_venta) {
            setError("tipo_venta", {
                type: "manual",
                message: "Debes seleccionar un tipo de venta"
            });
            isValid = false;
        }

        if (!formData.forma_venta) {
            setError("forma_venta", {
                type: "manual",
                message: "Debes seleccionar una forma de venta"
            });
            isValid = false;
        }

        if (formData.tipo_venta === "VC" && !formData.plazo_pago) {
            setError("plazo_pago", {
                type: "manual",
                message: "Debes especificar la fecha de plazo para venta a crédito"
            });
            showErrorToast({
                title: "Plazo requerido",
                description: "Las ventas a crédito requieren una fecha de plazo",
                duration: 5000
            });
            isValid = false;
        }

        return isValid;
    };

    // VALIDACIÓN DE FECHA DE PLAZO
    const tipoVenta = watch("tipo_venta");
    const plazoPago = watch("plazo_pago");
    useEffect(() => {
        if (!hasInitialized) return;
        if (tipoVenta === "VC" && plazoPago) {
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
        if (tipoVenta !== "VC") {
            resetField("plazo_pago", { defaultValue: "" });
        }
    }, [tipoVenta, plazoPago, resetField, setError, clearErrors, hasInitialized]);

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
    } = useSaleProductDetailsWithForm({ formMethods });

    const onSubmit = (data: SaleUpdate) => {
        if (!validateBeforeSubmit()) return;

        const result = SaleUpdateSchema.safeParse(data);

        if (!result.success) {
            showErrorToast({
                title: "Datos inválidos",
                description: "Revisa los campos antes de continuar.",
                duration: 5000,
            });
            return;
        }

        const transformedData = result.data;
        updateSale(
            { saleId: Number(saleId), data: transformedData },
            {
                onSuccess: () => {
                    showSuccessToast({
                        title: "Venta Modificada",
                        description: `Venta modificada con éxito`,
                        duration: 5000,
                    });
                    setTimeout(handleGoBack, 200);
                },
                onError: (error: unknown) => {
                    handleError({ error, customTitle: "No se pudo modificar la venta" });
                }
            }
        );
    };

    const onError = (errors: FieldErrors<SaleUpdateForm>) => {
        // console.log(errors)
        if (errors.id_cliente || errors.tipo_venta || errors.forma_venta || errors.id_responsable) {
            showErrorToast({
                title: "Error de validación",
                description: "Revisa los campos obligatorios del formulario",
                duration: 5000
            });
            return;
        }
        const firstErrorKey = Object.keys(errors)[0] as keyof SaleUpdateForm;
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

    if (isLoadingSale || isLoadingSaleTypes || isLoadingSaleModalities || isLoadingSaleResponsibles) {
        return <SaleEditSkeleton />;
    }

    if (isErrorSale || isNaN(Number(saleId))) {
        return <ErrorDataComponent
            errorMessage="No se pudo cargar la venta."
            showButtonIcon={false}
            buttonText="Ir a lista de ventas"
            onRetry={() => {
                navigate("/dashboard/sales")
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
                                            Editar venta #{saleData?.nro}
                                        </h1>
                                        {saleData && (
                                            <p className="text-sm text-gray-600">
                                                {saleData.cliente ? `${saleData.cliente?.cliente} - ` : ''}
                                                {saleData.cantidad_detalles} {saleData.cantidad_detalles === 1 ? 'producto' : 'productos'}
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

                        {/* 1. Datos de la Venta */}
                        <Card className="border-gray-200 shadow-none pt-4">
                            <CardContent className="">
                                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 xl:gap-x-2 xl:gap-y-3">
                                    <div>
                                        <Label htmlFor="fechaVenta">Fecha *</Label>
                                        <Input
                                            id="fechaVenta"
                                            type="date"
                                            {...register("fecha")}
                                            className="w-full"
                                            autoFocus
                                        />
                                        {errors.fecha && <p className="text-red-500 text-sm mt-1">El campo es requerido</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="responsable">Responsable *</Label>
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
                                        <Label htmlFor="altClie">Alt. Clie</Label>
                                        <Input
                                            id="altClie"
                                            {...register("cliente_nombre")}
                                            placeholder="Cliente alternativo"
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
                                    <div>
                                        <Label htmlFor="nroComprobanteSecundario">N° Comprobante Sec.</Label>
                                        <Input
                                            id="nroComprobanteSecundario"
                                            {...register("nro_comprobante2")}
                                            placeholder="Número secundario"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="forma_venta">Forma de venta *</Label>
                                        <Controller
                                            name="forma_venta"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value || saleData?.forma_venta || ""}>
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
                                        {errors.forma_venta && <p className="text-red-500 text-sm mt-1">El campo es requerido</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="tipo_venta">Tipo de Venta *</Label>
                                        <Controller
                                            name="tipo_venta"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    onValueChange={field.onChange} value={field.value || saleData?.tipo_venta || ""}>
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
                                        {errors.tipo_venta && <p className="text-red-500 text-sm mt-1">El campo es requerido</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="fechaPlazo">
                                            Fecha Plazo
                                            <span className="text-xs ml-1 text-gray-500">(Crédito)</span>
                                        </Label>
                                        <Input
                                            id="plazo_pago"
                                            type="date"
                                            {...register("plazo_pago")}
                                            disabled={watch("tipo_venta") !== "VC"}
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
                                        <Label htmlFor="comentarios">Comentarios</Label>
                                        <Textarea
                                            id="comentarios"
                                            {...register("comentario")}
                                            placeholder="Comentarios adicionales sobre la venta"
                                            rows={1}
                                        />
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">* Campos requeridos</span>
                            </CardContent>
                        </Card>

                    </form>

                    {/* 2. Productos */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle>
                                <ProductSelectorModal
                                    isSearchOpen={isSearchOpen}
                                    setIsSearchOpen={setIsSearchOpen}
                                    addItem={addProduct}
                                    onlyWithStock={true}
                                    addMultipleItem={addProduct}
                                />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {saleData?.detalles.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p>No hay productos agregados</p>
                                        <p className="text-sm">Haz clic en "Seleccionar Productos" para agregar</p>
                                    </div>
                                ) :
                                    <SaleDetailsEditingTable
                                        products={watch("detalles")}
                                        removeItem={removeProduct}
                                        updatePrice={updatePrice}
                                        updateQuantity={updateQuantity}
                                        updateCustomSubtotal={updateCustomSubtotal}
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

export default SaleEditScreen;