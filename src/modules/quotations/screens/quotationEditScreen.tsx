import ErrorDataComponent from "@/components/common/errorDataComponent"
import { useLocation, useNavigate, useParams } from "react-router"
import TooltipButton from "@/components/common/TooltipButton"
import { CornerUpLeft, Plus, Printer, ShoppingCart } from "lucide-react"
import { Kbd } from "@/components/atoms/kbd"
import { Controller, FormProvider, useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Label } from "@/components/atoms/label"
import { Input } from "@/components/atoms/input"
import { ComboboxSelect } from "@/components/common/SelectCombobox"
import { useEffect, useMemo, useRef, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select"
import { useBranchStore } from "@/states/branchStore"
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced"
import { format, parse } from "date-fns"
import { useHotkeys } from "react-hotkeys-hook"
import { useGoBack } from "@/hooks/useGoBack"
import { Button } from "@/components/atoms/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/atoms/resizable"
import { Textarea } from "@/components/atoms/textarea"
import { PDFViewer } from "@/components/common/PDFViewer"
import { useErrorHandler } from "@/hooks/useErrorHandler"
import { useProductSelectorWindow } from "@/hooks/useSecondaryWindow"
import { cn } from "@/lib/utils"
import ProductSearchPanel from "@/modules/products/components/ProductSearchPanel"
import { useSaleCustomers } from "@/modules/sales/hooks/useSaleCustomers"
import { useSaleModalities } from "@/modules/sales/hooks/useSaleModalities"
import { useSaleResponsibles } from "@/modules/sales/hooks/useSaleResponsibles"
import { useSaleTypes } from "@/modules/sales/hooks/useSaleTypes"
import QuotationDetailsEditingTable, { type QuotationDetailsEditingTableRef } from "../components/quotationDetailsEditingTable"
import QuotationEditSkeleton from "../components/quotationEditSkeleton"
import QuotationsSummary from "../components/quotationsSummary"
import { useQuotationGetById } from "../hooks/useQuotationGetById"
import { useQuotationPDF } from "../hooks/useQuotationPDF"
import useQuotationProductDetails, { type QuotationUpdateDetailUI } from "../hooks/useQuotationProductDetails"
import { useUpdateQuotation } from "../hooks/useUpdateQuotation"
import { QuotationUpdateSchema } from "../schemas/quotationUpdate.schema"
import type { QuotationGetById } from "../types/quotationGet.types"
import type { SelectedItem } from "@/types/windowSelectedItems"
import type { QuotationUpdate } from "../types/quotationUpdate.types"
import { Badge } from "@/components/atoms/badge"
import { useClienteVarios } from "../hooks/useClienteVarios"
import type { ProductGet } from "@/modules/products/types/ProductGet"

const QuotationEditScreen = () => {
    const configuraciones = {
        inputs: false,
        formulario: 'top',
        selector_mode: 'window'
    }

    const location = useLocation();
    const { tempFormData, tempCreatedQuotation, tempCreatedDetails, fromCreate } = (location.state as {
        tempFormData?: QuotationUpdate;
        tempCreatedQuotation?: QuotationGetById;
        tempCreatedDetails?: QuotationUpdateDetailUI[];
        fromCreate?: boolean
    }) || {};

    const [isReadOnly] = useState<boolean>(false)
    const navigate = useNavigate()
    const selectedBranchId = useBranchStore((s) => s.selectedBranchId)
    const { updateQuotationId } = useParams()
    const [hasInitialized, setHasInitialized] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
    const [isUsingTempData, setIsUsingTempData] = useState(false);

    const tableRef = useRef<QuotationDetailsEditingTableRef>(null);

    const {
        data: pdfBlob,
        isLoading: isLoadingPdf,
        isError: isErrorPdf,
    } = useQuotationPDF(Number(updateQuotationId) || 0, isDialogOpen && !!Number(updateQuotationId));

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
        // isLoading: isQuotationCustomersLoading
    } = useSaleCustomers()

    const {
        mutate: updateQuotation,
        isPending: isSaving
    } = useUpdateQuotation();

    const {
        data: quotationData,
        isLoading: isLoadingQuotation,
        isError: isErrorQuotation
    } = useQuotationGetById(Number(updateQuotationId))

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
        control,
        handleSubmit,
        getValues,
        setError,
        clearErrors,
        setValue,
        formState: { errors, isDirty }
    } = formMethods

    const quotationDetailsHook = useQuotationProductDetails();

    const loadFormData = (quotation: QuotationGetById) => {
        const detallesTransformados: QuotationUpdateDetailUI[] = quotation.detalles.map((detalle, index) => ({
            id_producto: detalle.producto.id,
            descripcion: detalle.descripcion,
            cantidad: Number(detalle.cantidad),
            precio: Number(detalle.precio),
            descuento: detalle.descuento ?? 0,
            porcentaje_descuento: detalle.porcentaje_descuento ?? 0,
            nueva_marca: detalle.marca,
            orden: detalle.orden ?? (index + 1),
            id_detalle_cotizacion: detalle.id,
            codigo_oem: detalle.producto.codigo_oem ?? '',
        }));

        const resetData: QuotationUpdate = {
            fecha: format(quotation.fecha, "yyyy-MM-dd") ?? "",
            nro_comprobante2: quotation.comprobante2 ?? "",
            nro_comprobante: quotation.comprobante ?? "",
            id_cliente: quotation.cliente?.id ?? 0,
            comentarios: quotation.comentarios ?? "",
            plazo_pago: quotation.plazo_pago?.slice(0, 10) ?? "",
            vehiculo: quotation.vehiculo ?? "",
            nro_motor: quotation.nmotor ?? "",
            cliente_nombre: quotation.cliente?.cliente ?? "",
            cliente_nit: quotation.cliente_nit ?? "",
            sucursal: Number(selectedBranchId) || 1,
            id_responsable: quotation.responsable_cotizacion?.id ?? 1,
            detalles: [],
            tipo_cotizacion: quotation.tipo_cotizacion,
            forma_cotizacion: quotation.forma_cotizacion,
            cliente_contacto: quotation.cliente_contacto ?? "",
            cliente_telefono: quotation.cliente_telefono ?? "",
            anticipo: quotation.anticipo ?? 0,
            pedido: quotation.es_pedido,
        };
        reset(resetData);
        quotationDetailsHook.initializeDetails(detallesTransformados)
        setHasInitialized(true);
        setIsUsingTempData(false);
    }

    useEffect(() => {
        // Si viene de crear venta, cargar datos temporales primero
        if (fromCreate && tempFormData && !hasInitialized) {
            reset(tempFormData);
            setHasInitialized(true);
            setIsUsingTempData(true);
            quotationDetailsHook.initializeDetails(tempCreatedDetails || []);

            // Limpiar el estado de navegación para evitar recargas
            window.history.replaceState({}, document.title);
        }

        // Cuando lleguen los datos reales del backend, reemplazar
        if (quotationData && quotationTypesData && quotationModalitiesData) {
            loadFormData(quotationData)
        }
        return
    }, [quotationData, quotationTypesData, quotationModalitiesData, fromCreate, tempFormData, hasInitialized, reset]);

    // Sincronizar detalles con el formulario
    useEffect(() => {
        if (hasInitialized) {
            const detalles = quotationDetailsHook.getCleanDetailsForSubmit();

            if (detalles.length > 0) {
                setValue("detalles", detalles);
                clearErrors("detalles");
            }
        }
    }, [quotationDetailsHook.details, hasInitialized, setValue, clearErrors]);

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
            return isValid;
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
                description: "Las ventas a crédito requieren una fecha de plazo",
                duration: 5000
            });
            isValid = false;
        }

        // Agregar validación adicional
        if (formData.tipo_cotizacion === "VC" && formData.plazo_pago && formData.fecha) {
            const fechaVenta = parse(formData.fecha, "yyyy-MM-dd", new Date());
            fechaVenta.setHours(0, 0, 0, 0);

            const plazoDate = parse(formData.plazo_pago, "yyyy-MM-dd", new Date());
            plazoDate.setHours(0, 0, 0, 0);

            if (plazoDate <= fechaVenta) {
                setError("plazo_pago", {
                    type: "manual",
                    message: "La fecha de plazo debe ser posterior a la fecha de cotización"
                });
                showErrorToast({
                    title: "Fecha inválida",
                    description: "La fecha de plazo debe ser posterior a la fecha de cotización",
                    duration: 5000
                });
                isValid = false;
            }
        }

        return isValid;
    };

    const formValues = watch();
    const { tipo_cotizacion, plazo_pago, detalles, id_cliente } = formValues;

    const { shouldEnableInputs } = useClienteVarios({
        currentClientId: id_cliente,
        clientes: quotationCustomersData?.data
    });

    // VALIDACIÓN DE FECHA DE PLAZO
    useEffect(() => {
        if (!hasInitialized) return;

        // Si no es cotización a crédito, limpiar y salir
        if (tipo_cotizacion !== "VC") {
            clearErrors("plazo_pago");
            return;
        }

        // Si no hay plazo_pago o no hay fecha de cotización, no validar
        if (!plazo_pago || !formValues.fecha) {
            clearErrors("plazo_pago");
            return;
        }

        // Comparar con la fecha de cotización, no con hoy
        const fechaVenta = parse(formValues.fecha, "yyyy-MM-dd", new Date());
        fechaVenta.setHours(0, 0, 0, 0);

        const plazoDate = parse(plazo_pago, "yyyy-MM-dd", new Date());
        plazoDate.setHours(0, 0, 0, 0);

        if (plazoDate <= fechaVenta) {
            setError("plazo_pago", {
                type: "manual",
                message: "La fecha de plazo debe ser posterior a la fecha de cotización"
            });
        } else {
            clearErrors("plazo_pago");
        }
    }, [tipo_cotizacion, plazo_pago, formValues.fecha, setError, clearErrors, hasInitialized]);

    // Función para agregar un solo producto
    const handleAddProductItem = (product: ProductGet) => {
        quotationDetailsHook.addProduct(product);
        setTimeout(() => {
            // Enfocar el input del producto agregado
            tableRef.current?.focusQuantityInputByProductId(product.id);
        }, 100);
    };

    // Función para agregar múltiples productos
    const handleAddMultipleProducts = (products: Array<ProductGet & { quantity?: number }>) => {
        quotationDetailsHook.addMultipleItemsWithQuantity(products);

        setTimeout(() => {
            // Enfocar el primer producto nuevo que se agregó
            if (products.length > 0) {
                tableRef.current?.focusQuantityInputByProductId(products[0].id);
            } else if (products.length > 0) {
                // Si todos ya existían, enfocar el primero de la lista
                tableRef.current?.focusQuantityInputByProductId(products[0].id);
            }
        }, 100);
    };

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
            { quotationId: Number(updateQuotationId), data: transformedData },
            {
                onSuccess: (updatedData) => {
                    showSuccessToast({
                        title: "Cotización Modificada",
                        description: `Cotización modificada con éxito`,
                        duration: 5000,
                    });
                    loadFormData(updatedData)
                },
                onError: (error: unknown) => {
                    handleError({ error, customTitle: "No se pudo modificar la cotización" });
                }
            }
        );
    };

    const onError = (errors: FieldErrors<QuotationUpdate>) => {
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
        console.log(errors)
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

    const handleOpenPrintDialog = () => {
        setIsDialogOpen(true)
    }

    const handleClosePrintDialog = () => {
        setIsDialogOpen(false)
    }

    const selectedItems = useMemo<SelectedItem[]>(() => {
        return detalles.map(detail => ({
            productId: detail.id_producto || 0,
            quantity: detail.cantidad,
        }));
    }, [detalles]);

    // Hook para manejar la ventana secundaria de productos
    const productWindow = useProductSelectorWindow({
        context: 'cotizacion',
        instanceId: 'update-quotation',
        onProductSelect: handleAddProductItem,
        onMultiSelect: handleAddMultipleProducts,
        onlyWithStock: false,
        multiSelect: true,
        mode: 'edit',
        selectedItems
    });

    const toggleWindowSelector = () => {
        if (productWindow.isOpen) {
            productWindow.close();
        }
        productWindow.open();
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

    if ((isLoadingQuotation || isLoadingQuotationTypes || isLoadingQuotationModalities || isLoadingQuotationResponsibles) && !isUsingTempData) {
        return <QuotationEditSkeleton />;
    }

    if ((isErrorQuotation || !quotationData) && !isUsingTempData) {
        return (
            <div className="h-full flex items-center justify-center p-2 lg:p-8">
                <ErrorDataComponent
                    className="h-full w-full"
                    errorMessage="No se pudo cargar la cotización."
                    showButtonIcon={false}
                    buttonText="Ir a lista de cotizaciones"
                    onRetry={() => navigate("/dashboard/quotations")}
                />
            </div>
        )
    }

    return (
        <main className="p-2 h-full">
            <FormProvider {...formMethods}>
                <form onSubmit={handleSubmit(onSubmit, onError)} className="h-full flex flex-col gap-2">
                    {/* Header */}
                    <header className="border-border flex-shrink-0 border bg-card rounded-lg p-2 sm:px-3">
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
                                    <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight">
                                        Editar cotización #{isUsingTempData ? tempCreatedQuotation?.nro : quotationData?.nro}
                                    </h1>
                                    {quotationData && (
                                        <p className="text-sm text-gray-600">
                                            {quotationData.cliente ? `${quotationData.cliente?.cliente} - ` : ''}
                                            {quotationData.cantidad_detalles} {quotationData.cantidad_detalles === 1 ? 'producto' : 'productos'}
                                        </p>
                                    )}
                                    {isUsingTempData && (
                                        <p className="text-sm text-gray-600">
                                            {tempCreatedQuotation?.cliente ? `${tempCreatedQuotation.cliente?.cliente} - ` : ''}
                                            {tempCreatedQuotation?.cantidad_detalles} {tempCreatedQuotation?.cantidad_detalles === 1 ? 'producto' : 'productos'}
                                        </p>
                                    )}
                                </div>
                            </div >

                            {/* Action Buttons */}
                            < div className="flex items-center justify-end w-full sm:w-auto gap-2" >
                                {
                                    updateQuotationId && (
                                        <>
                                            <TooltipButton
                                                onClick={handleOpenPrintDialog}
                                                tooltip={
                                                    isDirty
                                                        ? "Los cambios no guardados no se reflejarán en la impresión"
                                                        : "Imprimir cotización"
                                                }
                                                buttonProps={{
                                                    variant: isDirty ? 'outline' : 'default',
                                                }}
                                            >
                                                <Printer className="h-4 w-4" />
                                                Imprimir
                                                {isDirty && <span className="text-xs">(sin cambios)</span>}
                                            </TooltipButton>

                                            <Badge
                                                className="h-8 rounded-sm font-bold text-xl border border-emerald-500"
                                                variant={'success'}
                                            >
                                                {updateQuotationId}
                                            </Badge>
                                        </>
                                    )
                                }
                            </div >
                        </div >
                    </header >

                    <div className="gap-2 flex-1 min-h-screen md:min-h-0">
                        <div className={cn(
                            "h-full gap-2",
                            configuraciones.formulario === "top" && "flex flex-col",
                            configuraciones.formulario === "left" && "flex flex-col md:grid md:grid-cols-3"
                        )}>
                            {/* Formulario de información de cotización*/}
                            <div className={cn(
                                "gap-2 flex-shrink-0",
                                configuraciones.formulario === "top" && "grid md:grid-cols-2",
                                configuraciones.formulario === "left" && "flex flex-col",
                            )}>
                                {/* 1. Datos de la cotización */}
                                <Card className={cn(
                                    "shadow-none",
                                    configuraciones.formulario === "top" && "h-full flex-shrink-0",
                                    configuraciones.formulario === "left" && "h-auto md:col-auto",
                                )}>

                                    <CardContent className="p-2 sm:p-3">
                                        <div className={cn(
                                            "grid gap-2",
                                            configuraciones.formulario === "top" && "grid-cols-2 xl:grid-cols-3",
                                            configuraciones.formulario === "left" && "grid-cols-2",
                                        )}>
                                            <div>
                                                <Label htmlFor="fechaCotizacion">Fecha *</Label>
                                                <Input
                                                    id="fechaCotizacion"
                                                    type="date"
                                                    {...register("fecha")}
                                                    className="w-full"
                                                    autoFocus
                                                    disabled={isReadOnly}
                                                />
                                                {errors.fecha && <p className="text-red-500 text-xs">{errors.fecha.message}</p>}
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
                                                            disabled={isReadOnly}
                                                        />
                                                    )}
                                                />
                                                {errors.id_responsable && <p className="text-red-500 text-xs">El campo es requerido</p>}
                                            </div>

                                            {
                                                configuraciones.inputs && (
                                                    <div>
                                                        <Label htmlFor="forma">Forma de Cotización *</Label>
                                                        <Controller
                                                            name="forma_cotizacion"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Select
                                                                    disabled={isReadOnly}
                                                                    onValueChange={field.onChange} value={field.value || quotationData?.forma_cotizacion || ""}>
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
                                                        {errors.forma_cotizacion && <p className="text-red-500 text-xs">{errors.forma_cotizacion.message}</p>}
                                                    </div>
                                                )
                                            }

                                            <div>
                                                <Label htmlFor="tipo_cotizacion">Tipo de Cotización *</Label>
                                                <Controller
                                                    name="tipo_cotizacion"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select
                                                            disabled={isReadOnly}
                                                            onValueChange={field.onChange} value={field.value || quotationData?.tipo_cotizacion || ""}>
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
                                                {errors.tipo_cotizacion && <p className="text-red-500 text-xs">El campo es requerido</p>}
                                            </div>
                                            {
                                                configuraciones.inputs && (
                                                    <div>
                                                        <Label htmlFor="nroComprobante">N° Comprobante</Label>
                                                        <Input
                                                            id="nroComprobante"
                                                            {...register("nro_comprobante")}
                                                            placeholder="Número de comprobante"
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                )
                                            }
                                            {
                                                configuraciones.inputs && (
                                                    <div>
                                                        <Label htmlFor="nroComprobanteSecundario">N° Comprobante Sec.</Label>
                                                        <Input
                                                            id="nroComprobanteSecundario"
                                                            {...register("nro_comprobante2")}
                                                            placeholder="Comprobante secundario"
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                )
                                            }
                                            <div>
                                                <Label htmlFor="fechaPlazo">
                                                    Fecha Plazo
                                                    <span className="text-xs ml-1 text-gray-500">(Crédito)</span>
                                                </Label>
                                                <Input
                                                    id="fechaPlazo"
                                                    type="date"
                                                    {...register("plazo_pago")}
                                                    disabled={formValues.tipo_cotizacion !== "VC" || isReadOnly}
                                                />
                                                {errors.plazo_pago && <p className="text-red-500 text-xs">{errors.plazo_pago.message}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="vehiculo">Vehículo/Motor</Label>
                                                <Input
                                                    id="vehiculo"
                                                    {...register("vehiculo")}
                                                    placeholder="Modelo del vehículo"
                                                    disabled={isReadOnly}
                                                />
                                            </div>
                                            {
                                                configuraciones.inputs && (
                                                    <div>
                                                        <Label htmlFor="motor">Motor</Label>
                                                        <Input
                                                            id="motor"
                                                            {...register("nro_motor")}
                                                            placeholder="Tipo de motor"
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className={cn(
                                    "shadow-none",
                                    configuraciones.formulario === "top" && "h-full",
                                    configuraciones.formulario === "left" && "grow",
                                )}>

                                    <CardContent className="p-2 sm:p-3">
                                        <div className="grid grid-cols-3 gap-2">

                                            <div>
                                                <Label htmlFor="cliente">Cliente *</Label>
                                                <Controller
                                                    name="id_cliente"
                                                    control={control}
                                                    render={({ field }) => (
                                                        // <PaginatedCombobox
                                                        //     value={field.value}
                                                        //     onChange={(value) => field.onChange(Number(value))}
                                                        //     optionsData={quotationCustomersData?.data || []}
                                                        //     displayField="nombre"
                                                        //     isLoading={isQuotationCustomersLoading}
                                                        //     updatePage={(page) => { console.log("Update page:", page) }}
                                                        //     updateSearch={setCustomerSearchTerm}
                                                        //     disabled={isReadOnly}
                                                        //     placeholder="Buscar cliente por nombre"
                                                        //     metaData={
                                                        //         {
                                                        //             current_page: quotationCustomersData?.meta.current_page || 1,
                                                        //             last_page: quotationCustomersData?.meta.last_page || 1,
                                                        //             total: quotationCustomersData?.meta.total || 0,
                                                        //             per_page: quotationCustomersData?.meta.per_page || 10,
                                                        //         }
                                                        //     }
                                                        // />
                                                        <ComboboxSelect
                                                            value={field.value}
                                                            onChange={(value) => field.onChange(Number(value))}
                                                            options={quotationCustomersData?.data || []}
                                                            optionTag={"nombre"}
                                                            disabled={isReadOnly}
                                                            placeholder="Buscar cliente por nombre"
                                                            clearOnEmpty={true}
                                                        />
                                                    )}
                                                />
                                                {errors.id_cliente && <p className="text-red-500 text-xs">El campo es requerido</p>}
                                            </div>
                                            {
                                                (shouldEnableInputs || configuraciones.inputs) && (
                                                    <div>
                                                        <Label htmlFor="altClie">Cliente Alt.</Label>
                                                        <Input
                                                            id="altClie"
                                                            {...register("cliente_nombre")}
                                                            placeholder="Cliente alternativo"
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                )
                                            }
                                            {
                                                (shouldEnableInputs || configuraciones.inputs) && (
                                                    <div>
                                                        <Label htmlFor="contacto">Contacto</Label>
                                                        <Input
                                                            id="contacto"
                                                            {...register("cliente_contacto")}
                                                            placeholder="Nombre de contacto"
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                )
                                            }
                                            {
                                                configuraciones.inputs && (
                                                    <div>
                                                        <Label htmlFor="nit">Nit</Label>
                                                        <Input
                                                            id="nit"
                                                            {...register("cliente_nit")}
                                                            placeholder="Nro de nit del cliente"
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                )
                                            }
                                            {
                                                !configuraciones.inputs && (
                                                    <div>
                                                        <Label htmlFor="telefono">Teléfono</Label>
                                                        <Input
                                                            id="telefono"
                                                            {...register("cliente_telefono")}
                                                            placeholder="Teléfono del cliente"
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                )
                                            }

                                            <div className={cn(
                                                "col-span-2",
                                                (!shouldEnableInputs || configuraciones.inputs) && 'col-span-full'
                                            )}>
                                                <Label htmlFor="comentarios">Comentarios</Label>
                                                <Textarea
                                                    id="comentarios"
                                                    {...register("comentarios")}
                                                    placeholder="Comentarios adicionales sobre la Cotización"
                                                    rows={configuraciones.formulario === "top" ? 1 : 2}
                                                    disabled={isReadOnly}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className={cn(
                                "flex-1 min-h-0",
                                configuraciones.formulario === "top" && "",
                                configuraciones.formulario === "top" && configuraciones.inputs && "",
                                configuraciones.formulario === "left" && "col-span-2",
                            )}>
                                <div className={cn(
                                    "h-full min-h-screen md:min-h-auto flex flex-col gap-2",
                                    configuraciones.selector_mode === "embebed" && "md:min-h-screen"
                                )}>
                                    <ResizablePanelGroup
                                        className={cn(
                                            "flex-1 min-h-0"
                                        )}
                                        direction={"vertical"}
                                    >
                                        {
                                            configuraciones.selector_mode === "embebed" && (
                                                <>
                                                    <ResizablePanel
                                                        defaultSize={50}
                                                    >
                                                        <ProductSearchPanel
                                                            selectedProducts={detalles}
                                                            onProductSelect={quotationDetailsHook.addProduct}
                                                            allowExceedStock={true}
                                                        />
                                                    </ResizablePanel>
                                                    <ResizableHandle withHandle />
                                                </>
                                            )
                                        }
                                        <ResizablePanel
                                            defaultSize={50}
                                            className="h-full flex flex-col">
                                            {/* 2. Productos */}
                                            <Card className="shadow-none flex-1 min-h-0 overflow-hidden flex flex-col">
                                                <CardHeader className="flex-shrink-0">
                                                    <CardTitle className="flex justify-between">
                                                        <h2 className="text-primary text-base">
                                                            Detalle de Productos
                                                        </h2>
                                                        {
                                                            configuraciones.selector_mode === "window" && (
                                                                <Button
                                                                    type="button"
                                                                    onClick={toggleWindowSelector}
                                                                    disabled={isSaving || isReadOnly}
                                                                >
                                                                    <Plus className="size-4" />
                                                                    <span className="hidden sm:block">Seleccionar Productos</span>
                                                                </Button>
                                                            )
                                                        }
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="flex-1 min-h-0">
                                                    <div className="h-full overflow-auto">
                                                        {detalles.length === 0 ? (
                                                            <div className="text-center py-8 text-gray-500">
                                                                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                                <p>No hay productos agregados</p>
                                                                <p className="text-sm">Haz clic en "Seleccionar Productos" para agregar</p>
                                                            </div>
                                                        ) :
                                                            <QuotationDetailsEditingTable
                                                                ref={tableRef}
                                                                isReadOnly={isReadOnly}
                                                                products={quotationDetailsHook.details}
                                                                removeItem={quotationDetailsHook.removeProduct}
                                                                updatePrice={quotationDetailsHook.updatePrice}
                                                                updateQuantity={quotationDetailsHook.updateQuantity}
                                                                updateCustomSubtotal={quotationDetailsHook.updateCustomSubtotal}
                                                                updateBrand={quotationDetailsHook.updateBrand}
                                                                updateDescription={quotationDetailsHook.updateDescription}
                                                            />
                                                        }
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </ResizablePanel>
                                    </ResizablePanelGroup>

                                    {/* Resumen de Cotización  */}
                                    <QuotationsSummary
                                        isReadOnly={isReadOnly}
                                        isEditMode={true}
                                        discountAmount={quotationDetailsHook.calculateTotalDiscount()}
                                        discountPercent={quotationDetailsHook.getDiscountPercentage()}
                                        subtotal={quotationDetailsHook.calculateTotalBeforeDiscount()}
                                        total={quotationDetailsHook.calculateTotal()}
                                        isPending={isSaving}
                                        callback={handleGoBack}
                                        aplyGlobalDiscount={quotationDetailsHook.applyGlobalDiscount}
                                        hasProducts={detalles.length > 0}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </FormProvider>

            {/* Modal PDF Viewer */}
            <PDFViewer
                id={Number(updateQuotationId)}
                pdfBlob={pdfBlob}
                isLoading={isLoadingPdf}
                isError={isErrorPdf}
                onClose={handleClosePrintDialog}
                isOpen={isDialogOpen}
                pdfName="cotizacion"
                title={`Cotizacion Nro. ${updateQuotationId}`}
            />
        </main >
    );
}

export default QuotationEditScreen;