import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Kbd } from "@/components/atoms/kbd";
import { Label } from "@/components/atoms/label";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/atoms/resizable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { Switch } from "@/components/atoms/switch";
import { Textarea } from "@/components/atoms/textarea";
import { PDFViewer } from "@/components/common/PDFViewer";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import TooltipButton from "@/components/common/TooltipButton";
import { PaginatedCombobox } from "@/components/common/paginatedCombobox";
import { useTabEffect } from "@/hooks/tabs/useTabEffect";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useProductSelectorWindow } from "@/hooks/useSecondaryWindow";
import { cn } from "@/lib/utils";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import { useSaleCustomers } from "@/modules/sales/hooks/useSaleCustomers";
import { useSaleModalities } from "@/modules/sales/hooks/useSaleModalities";
import { useSaleResponsibles } from "@/modules/sales/hooks/useSaleResponsibles";
import { useSaleTypes } from "@/modules/sales/hooks/useSaleTypes";
import { EditablePrice } from "@/modules/shoppingCart/components/editablePrice";
import { useCartWithUtils } from "@/modules/shoppingCart/hooks/useCartWithUtils";
import type { CartItem } from "@/modules/shoppingCart/types/cart.types";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";
import { CornerUpLeft, Plus, Printer, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router";
import { useDebounce } from "use-debounce";
import ProductDetailTable from "../components/productDetailTable";
import QuotationsSummary from "../components/quotationsSummary";
import { useCreateQuotation } from "../hooks/useCreateQuotation";
import { useQuotationPDF } from "../hooks/useQuotationPDF";
import { QuotationCreateSchema } from "../schemas/quotationCreate.schema";
import type { QuotationCreate, QuotationDetail } from "../types/quotationCreate.types";
import ProductSearchPanel from "@/modules/products/components/ProductSearchPanel";
import type { SelectedItem } from "@/types/windowSelectedItems";

const SCREEN_PATH = "/dashboard/create-quotation"

const QuotationCreateScreen = () => {
    const configuraciones = {
        inputs: false,
        formulario: 'top',
        selector_mode: 'window'
    }
    const [createdQuotationId, setCreatedQuotationId] = useState<number | null>(null);
    const [createdQuotationDetails, setCreatedQuotationDetails] = useState<CartItem[] | null>(null);
    const [createdQuotationSummary, setCreatedQuotationSummary] = useState<{
        subtotal: number;
        total: number;
        discount: number;
        discountPercent: number;
    } | null>(null);
    const isReadOnly = useMemo(() => createdQuotationId !== null && createdQuotationDetails !== null, [createdQuotationId, createdQuotationDetails]);
    const navigate = useNavigate();
    const user = authSDK.getCurrentUser()
    const selectedBranchId = useBranchStore((state) => state.selectedBranchId);
    const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");

    const [debouncedCustomerSearchTerm] = useDebounce<string>(customerSearchTerm, 500)

    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

    const {
        data: pdfBlob,
        isLoading: isLoadingPdf,
        isError: isErrorPdf,
    } = useQuotationPDF(createdQuotationId || 0, isDialogOpen && !!createdQuotationId);

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
        control,
        handleSubmit,
        setValue,
        getValues,
        setError,
        clearErrors,
        formState: { errors }
    } = methods

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
        addMultipleItemsWithQuantity,
        setCartMode,
        mode,
    } = useCartWithUtils(user?.name || '', selectedBranchId ?? '')

    useTabEffect(SCREEN_PATH, () => {
        if (mode !== 'quote' && !isReadOnly) {
            setCartMode('quote')
        }
    }, [mode, isReadOnly, setCartMode]);

    const subtotal = getCartSubtotal()
    const total = getCartTotal()

    const formValues = watch();
    const { tipo_cotizacion, plazo_pago } = formValues;

    const detalles = useMemo((): QuotationDetail[] => {
        return items.map((item, index) => ({
            id_producto: item.product.id,
            cantidad: item.quantity,
            precio: item.customPrice,
            descuento: ((item.customPrice ?? 0) * item.quantity) * ((discountPercent ?? 0) / 100),
            porcentaje_descuento: discountPercent ?? 0,
            descripcion: item.customDescription,
            nueva_marca: item.customBrand,
            orden: index + 1,
        }));
    }, [items, discountPercent]);

    useEffect(() => {
        if (detalles.length > 0) {
            setValue("detalles", detalles);
            clearErrors("detalles");
        }
    }, [detalles, setValue, clearErrors]);

    const validateBeforeSubmit = useCallback((): boolean => {
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
            return isValid;
        }

        if (!formValues.id_cliente) {
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

        if (!formValues.tipo_cotizacion) {
            setError("tipo_cotizacion", {
                type: "manual",
                message: "Debes seleccionar un tipo de cotización"
            });
            isValid = false;
        }

        if (!formValues.forma_cotizacion) {
            setError("forma_cotizacion", {
                type: "manual",
                message: "Debes seleccionar una forma de cotización"
            });
            isValid = false;
        }

        if (formValues.tipo_cotizacion === "VC" && !formValues.plazo_pago) {
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
        if (formValues.tipo_cotizacion === "VC" && formValues.plazo_pago && formValues.fecha) {
            const fechaVenta = parse(formValues.fecha, "yyyy-MM-dd", new Date());
            fechaVenta.setHours(0, 0, 0, 0);

            const plazoDate = parse(formValues.plazo_pago, "yyyy-MM-dd", new Date());
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
    }, [items.length, formValues, setError]);

    // VALIDACIÓN DE FECHA DE PLAZO
    useEffect(() => {
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
    }, [tipo_cotizacion, plazo_pago, formValues.fecha, setError, clearErrors]);

    const handleNewQuotation = useCallback(() => {
        setCreatedQuotationId(null);
        setCreatedQuotationDetails(null);
        setCreatedQuotationSummary(null);
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
            cliente_nombre: "",
            cliente_nit: "",
            sucursal: Number(selectedBranchId) || 1,
            id_responsable: currentValues.id_responsable,
            detalles: [],
            cliente_contacto: "",
            cliente_telefono: "",
            anticipo: 0,
            pedido: false,
        });
    }, [getValues, reset]);

    const handleAddProductItem = useCallback((product: ProductGet) => {
        addItemToCart(product);
    }, [addItemToCart]);

    const handleAddMultipleProducts = useCallback((
        products: Array<ProductGet & { quantity?: number }>
    ) => {
        return addMultipleItemsWithQuantity(products);
    }, [addMultipleItemsWithQuantity]);

    const onSubmit = useCallback((data: QuotationCreate) => {
        if (!validateBeforeSubmit()) {
            return;
        }
        createQuotation(data, {
            onSuccess: (createdQuotation) => {

                const finalSubtotal = subtotal;
                const finalTotal = total;
                const finalDiscountAmount = discountAmount || 0;
                const finalDiscountPercent = discountPercent || 0;

                setCreatedQuotationSummary({
                    subtotal: finalSubtotal,
                    total: finalTotal,
                    discount: finalDiscountAmount,
                    discountPercent: finalDiscountPercent
                });

                clearCart();
                showSuccessToast({
                    title: "Cotización Creada",
                    description: `Cotización #${createdQuotation.id} creada exitosamente`,
                    duration: 5000
                });

                setCreatedQuotationId(createdQuotation.id);
                const details: CartItem[] = createdQuotation.detalles.map((det) => ({
                    product: {
                        id: det.producto.id,
                        descripcion: det.producto.descripcion,
                        codigo_oem: det.producto.codigo_oem,
                        codigo_upc: det.producto.codigo_upc,
                        precio_venta: det.producto.precio_venta,
                        precio_venta_alt: det.producto.precio_venta_alt,
                        stock_actual: 0,
                        marca: det.producto.marca?.marca || '',
                        unidad_medida: det.producto.unidad_medida.unidad_medida,
                        sucursal: ''
                    },
                    quantity: det.cantidad,
                    customDescription: det.descripcion || '',
                    customPrice: det.precio,
                    customSubtotal: det.cantidad * det.precio,
                    customBrand: det.marca || '',
                }));
                setCreatedQuotationDetails(details);
            },
            onError: (error: unknown) => {
                handleError({ error, customTitle: "No se pudo crear la cotización" });
            }
        });
    }, [validateBeforeSubmit, createQuotation, handleError]);

    const onError = useCallback((errors: FieldErrors<QuotationCreate>) => {
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
    }, [validateBeforeSubmit]);

    const handleGoBack = useCallback(() => {
        navigate('/dashboard/productos');
    }, [navigate]);

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
        instanceId: 'create-quotation',
        onProductSelect: handleAddProductItem,
        onMultiSelect: handleAddMultipleProducts,
        onlyWithStock: false,
        multiSelect: true,
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

    return (
        <main className="p-2 h-full">
            <FormProvider {...methods}>
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
                                    tooltip={<p className="flex items-center gap-1">Presiona <Kbd>esc</Kbd> para volver a la lista de productos</p>}
                                    buttonProps={{
                                        variant: 'default',
                                        type: 'button'
                                    }}
                                >
                                    <CornerUpLeft />
                                </TooltipButton>
                                <div>
                                    <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight">
                                        Nueva Cotización
                                    </h1>
                                    <p className="text-sm text-gray-500">Registra una nueva cotización en el sistema</p>
                                </div>
                            </div >

                            {/* Action Buttons */}
                            < div className="flex items-center justify-end w-full sm:w-auto gap-2" >
                                {
                                    createdQuotationId && (
                                        <>
                                            <TooltipButton
                                                onClick={handleOpenPrintDialog}
                                                tooltip="Imprimir cotizacion"
                                                buttonProps={{
                                                    variant: 'default',
                                                }}
                                            >
                                                <Printer className="h-4 w-4" />
                                                Imprimir
                                            </TooltipButton>

                                            <Badge
                                                className="h-8 rounded-sm font-bold text-xl border border-emerald-500"
                                                variant={'success'}
                                            >
                                                {createdQuotationId}
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
                                configuraciones.formulario === "top" && "grid md:grid-cols-3",
                                configuraciones.formulario === "left" && "flex flex-col",
                            )}>
                                {/* 1. Datos de la cotización */}
                                <Card className={cn(
                                    "shadow-none",
                                    configuraciones.formulario === "top" && "h-full flex-shrink-0 md:col-span-2",
                                    configuraciones.formulario === "left" && "h-auto md:col-auto",
                                )}>

                                    <CardContent className="p-2 sm:p-3">
                                        <div className={cn(
                                            "grid gap-2",
                                            configuraciones.formulario === "top" && "grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
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
                                                            options={saleResponsiblesData || []}
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
                                                                    onValueChange={field.onChange} value={field.value || saleModalitiesData?.[0]?.code || ""}>
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
                                                            onValueChange={field.onChange} value={field.value || saleTypesData?.[0]?.code || ""}>
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
                                                            disabled={isReadOnly}
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
                                                                disabled={isReadOnly}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className={cn(
                                    "shadow-none",
                                    configuraciones.formulario === "top" && "h-full",
                                    configuraciones.formulario === "left" && "grow",
                                )}>

                                    <CardContent className="p-2 sm:p-3">
                                        <div className="grid grid-cols-2 gap-2">

                                            <div>
                                                <Label htmlFor="cliente">Cliente *</Label>
                                                <Controller
                                                    name="id_cliente"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <PaginatedCombobox
                                                            value={field.value}
                                                            onChange={(value) => field.onChange(Number(value))}
                                                            optionsData={saleCustomersData?.data || []}
                                                            displayField="nombre"
                                                            isLoading={isSaleCustomersLoading}
                                                            updatePage={(page) => { console.log("Update page:", page) }}
                                                            updateSearch={setCustomerSearchTerm}
                                                            disabled={isReadOnly}
                                                            placeholder="Buscar cliente por nombre"
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
                                                {errors.id_cliente && <p className="text-red-500 text-xs">El campo es requerido</p>}
                                            </div>
                                            {
                                                configuraciones.inputs && (
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
                                                configuraciones.inputs && (
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

                                            <div className="col-span-full">
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
                                                            selectedProducts={items}
                                                            onProductSelect={handleAddProductItem}
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
                                                        {items.length === 0 && !createdQuotationDetails ? (
                                                            <div className="text-center py-8 text-gray-500">
                                                                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                                <p>No hay productos agregados</p>
                                                                <p className="text-sm">Haz clic en "Seleccionar Productos" para agregar</p>
                                                            </div>
                                                        ) :
                                                            <ProductDetailTable
                                                                details={createdQuotationDetails}
                                                                isReadOnly={isReadOnly}
                                                            />
                                                        }
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </ResizablePanel>
                                    </ResizablePanelGroup>

                                    {/* <div className="flex flex-col flex-shrink-0"> */}
                                    {/* Resumen de Cotización  */}
                                    <QuotationsSummary
                                        isReadOnly={isReadOnly}
                                        clearCart={clearCart}
                                        discountAmount={isReadOnly ? createdQuotationSummary?.discount ?? 0 : discountAmount}
                                        discountPercent={isReadOnly ? createdQuotationSummary?.discountPercent ?? 0 : discountPercent}
                                        subtotal={isReadOnly ? createdQuotationSummary?.subtotal ?? 0 : subtotal}
                                        total={isReadOnly ? createdQuotationSummary?.total ?? 0 : total}
                                        isPending={isSaving}
                                        callback={handleNewQuotation}
                                        setDiscountAmount={setDiscountAmount}
                                        setDiscountPercent={setDiscountPercent}
                                        hasProducts={items.length > 0}
                                    />
                                    {/* </div> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </FormProvider>

            {/* Modal PDF Viewer */}
            <PDFViewer
                id={createdQuotationId}
                pdfBlob={pdfBlob}
                isLoading={isLoadingPdf}
                isError={isErrorPdf}
                onClose={handleClosePrintDialog}
                isOpen={isDialogOpen}
                pdfName="cotizacion"
                title={`Cotizacion Nro. ${createdQuotationId}`}
            />
        </main >
    );
};

export default QuotationCreateScreen;