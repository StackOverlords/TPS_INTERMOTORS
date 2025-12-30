import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Kbd } from "@/components/atoms/kbd";
import { Label } from "@/components/atoms/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { Textarea } from "@/components/atoms/textarea";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import TooltipButton from "@/components/common/TooltipButton";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useProductSelectorWindow } from "@/hooks/useSecondaryWindow";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import TableShoppingCart, { type TableShoppingCartRef } from "@/modules/shoppingCart/components/tableShoppingCart";
import { useCartWithUtils } from "@/modules/shoppingCart/hooks/useCartWithUtils";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { parse } from "date-fns";
import { CornerUpLeft, Plus, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router";
// import { useTabNavigation } from "@/hooks/useTabNavigation";
import SalesSummary from "../components/salesSummary";
import { useCreateSale } from "../hooks/useCreateSale";
import { useSaleCustomers } from "../hooks/useSaleCustomers";
import { useSaleModalities } from "../hooks/useSaleModalities";
import { useSaleResponsibles } from "../hooks/useSaleResponsibles";
import { useSaleTypes } from "../hooks/useSaleTypes";
import { SaleSchema } from "../schemas/sales.schema";
import type { Sale, SaleDetail } from "../types/sale";
import ProductSearchPanel from "@/modules/products/components/ProductSearchPanel";
import { cn } from "@/lib/utils";
import type { CartMode } from "@/modules/shoppingCart/types/cart.types";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/atoms/resizable";
import { Button } from "@/components/atoms/button";
import { useTabEffect } from "@/hooks/tabs/useTabEffect";
import type { SelectedItem } from "@/types/windowSelectedItems";
import CartModeConversionModal from "@/modules/shoppingCart/components/CartModeConversionModal";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";
import type { SaleUpdateForm } from "../types/saleUpdate.type";
import { formatDateForSubmission, getTodayDate } from "@/utils/dateFormatters";
import { useSalePaymentTypes } from "../hooks/useSalePaymentTypes";

const SCREEN_PATH = "/dashboard/create-sale"

const CreateSaleScreen = () => {
    const configuraciones = {
        inputs: false,
        formulario: 'top',
        selector_mode: 'window'
    }
    const navigate = useNavigate();
    // const { closeCurrentTab, currentTab } = useTabNavigation();
    const user = authSDK.getCurrentUser()
    const selectedBranchId = useBranchStore((s) => s.selectedBranchId)

    // Estado de modales de conversión
    const DEFAULT_SALE_MODE: CartMode = 'sale-strict' as CartMode;
    const [showModeConversionModal, setShowModeConversionModal] = useState(false);
    const [targetModeForModal, setTargetModeForModal] = useState<CartMode>('sale-strict');
    const [lastProcessedMode, setLastProcessedMode] = useState<CartMode | null>(null);

    const tableRef = useRef<TableShoppingCartRef>(null);

    const {
        data: saleTypesData,
    } = useSaleTypes()

    const {
        data: saleModalitiesData,
    } = useSaleModalities()

    const {
        data: salePaymentTypesData,
    } = useSalePaymentTypes()

    const {
        data: saleResponsiblesData,
    } = useSaleResponsibles()

    const {
        data: saleCustomersData,
        // isLoading: isSaleCustomersLoading
    } = useSaleCustomers()

    const {
        mutate: createSale,
        isPending: isSaving
    } = useCreateSale();

    const { handleError } = useErrorHandler()

    const methods = useForm<Sale>({
        resolver: zodResolver(SaleSchema),
        defaultValues: {
            fecha: getTodayDate(),
            nro_comprobante: "",
            nro_comprobante2: "",
            id_cliente: undefined,
            tipo_venta: "",
            forma_venta: "",
            forma_pago: "",
            comentario: "",
            plazo_pago: "",
            vehiculo: "",
            nro_motor: "",
            cliente_nombre: "",
            cliente_nit: "",
            sucursal: Number(selectedBranchId) || 1,
            id_responsable: Number(user?._id) || undefined,
            detalles: []
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
        mode,
        setCartMode,
        previewConversion,
    } = useCartWithUtils(user?.name || '', selectedBranchId ?? '');

    useTabEffect(SCREEN_PATH, () => {

        if (lastProcessedMode === mode) return;

        // CASO 1: Ya está en un modo de venta
        if (mode === 'sale-strict' || mode === 'sale-permissive') {
            setLastProcessedMode(mode);
            return; // Respetar el modo actual
        }

        // CASO 2: Está en modo quote
        if (mode === 'quote') {
            if (items.length === 0) {
                // Sin items, cambiar directamente al modo por defecto
                setCartMode(DEFAULT_SALE_MODE);
                setLastProcessedMode(DEFAULT_SALE_MODE);
            } else {
                // Hay items en quote
                if (DEFAULT_SALE_MODE === 'sale-permissive') {
                    setCartMode('sale-permissive');
                    setLastProcessedMode('sale-permissive');
                } else {
                    // Verificar si hay cambios
                    const preview = previewConversion('sale-strict');

                    if (preview.willHaveChanges) {
                        setTargetModeForModal('sale-strict');
                        setShowModeConversionModal(true);
                    } else {
                        setCartMode('sale-strict');
                        setLastProcessedMode('sale-strict');
                    }
                }
            }
        }
    }, [mode, items.length, lastProcessedMode, previewConversion, setCartMode]);

    const handleManualModeChange = useCallback((newMode: 'sale-strict' | 'sale-permissive') => {
        if (mode === newMode) return;

        if (newMode === 'sale-strict' && items.length > 0) {
            const preview = previewConversion('sale-strict');

            if (preview.willHaveChanges) {
                setTargetModeForModal('sale-strict');
                setShowModeConversionModal(true);
            } else {
                setCartMode('sale-strict');
                setLastProcessedMode('sale-strict');
            }
        } else {
            setCartMode(newMode);
            setLastProcessedMode(newMode);
        }
    }, [mode, items.length, previewConversion, setCartMode]);

    const handleCloseModal = useCallback(() => {
        setShowModeConversionModal(false);
        if (mode === 'quote') {
            setLastProcessedMode(null);
        } else {
            setLastProcessedMode(mode);
        }
    }, [mode]);

    const subtotal = getCartSubtotal()
    const total = getCartTotal()

    const formValues = watch();
    const { tipo_venta, plazo_pago } = formValues;

    const detalles = useMemo((): SaleDetail[] => {
        return items.map((item, index) => ({
            id_producto: item.product.id,
            cantidad: item.quantity,
            precio: item.customPrice,
            descuento: ((item.customPrice ?? 0) * item.quantity) * ((discountPercent ?? 0) / 100),
            porcentaje_descuento: discountPercent ?? 0,
            orden: index + 1
        }));
    }, [items, discountPercent]);

    useEffect(() => {
        if (detalles.length > 0) {
            setValue("detalles", detalles as [SaleDetail, ...SaleDetail[]]);
            clearErrors("detalles");
        }
    }, [detalles, setValue, clearErrors]);

    const validateBeforeSubmit = (): boolean => {
        let isValid = true;

        if (items.length === 0) {
            setError("detalles", {
                type: "manual",
                message: "Debes agregar al menos un producto para realizar una venta"
            });
            showErrorToast({
                title: "Carrito vacío",
                description: "Debes agregar al menos un producto para realizar una venta",
                duration: 5000
            });
            isValid = false;
        }

        if (!formValues.id_cliente) {
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

        if (!formValues.tipo_venta) {
            setError("tipo_venta", {
                type: "manual",
                message: "Debes seleccionar un tipo de venta"
            });
            isValid = false;
        }

        if (!formValues.forma_venta) {
            setError("forma_venta", {
                type: "manual",
                message: "Debes seleccionar una forma de venta"
            });
            isValid = false;
        }

        if (!formValues.forma_pago) {
            setError("forma_pago", {
                type: "manual",
                message: "Debes seleccionar una forma de pago"
            });
            isValid = false;
        }

        if (formValues.tipo_venta === "VC" && formValues.plazo_pago && formValues.fecha) {
            const fechaVenta = parse(formValues.fecha, "yyyy-MM-dd", new Date());
            fechaVenta.setHours(0, 0, 0, 0);

            const plazoDate = parse(formValues.plazo_pago, "yyyy-MM-dd", new Date());
            plazoDate.setHours(0, 0, 0, 0);

            if (plazoDate <= fechaVenta) {
                setError("plazo_pago", {
                    type: "manual",
                    message: "La fecha de plazo debe ser posterior a la fecha de venta"
                });
                showErrorToast({
                    title: "Fecha inválida",
                    description: "La fecha de plazo debe ser posterior a la fecha de venta",
                    duration: 5000
                });
                isValid = false;
            }
        }

        return isValid;
    };

    // VALIDACIÓN DE FECHA DE PLAZO
    useEffect(() => {
        // Si no es venta a crédito, limpiar y salir
        if (tipo_venta !== "VC") {
            clearErrors("plazo_pago");
            return;
        }

        // Si no hay plazo_pago o no hay fecha de venta, no validar
        if (!plazo_pago || !formValues.fecha) {
            clearErrors("plazo_pago");
            return;
        }

        // Comparar con la fecha de venta, no con hoy
        const fechaVenta = parse(formValues.fecha, "yyyy-MM-dd", new Date());
        fechaVenta.setHours(0, 0, 0, 0);

        const plazoDate = parse(plazo_pago, "yyyy-MM-dd", new Date());
        plazoDate.setHours(0, 0, 0, 0);

        if (plazoDate <= fechaVenta) {
            setError("plazo_pago", {
                type: "manual",
                message: "La fecha de plazo debe ser posterior a la fecha de venta"
            });
        } else {
            clearErrors("plazo_pago");
        }
    }, [tipo_venta, plazo_pago, formValues.fecha, setError, clearErrors]);

    const handleNewSale = useCallback((canClearCart = true) => {
        setLastProcessedMode(null);
        const currentValues = getValues();
        reset({
            fecha: getTodayDate(),
            nro_comprobante: "",
            nro_comprobante2: "",
            id_cliente: currentValues.id_cliente,
            tipo_venta: currentValues.tipo_venta,
            forma_venta: currentValues.forma_venta,
            forma_pago: currentValues.forma_pago,
            comentario: "",
            plazo_pago: "",
            vehiculo: "",
            nro_motor: "",
            cliente_nombre: "",
            cliente_nit: "",
            sucursal: Number(selectedBranchId) || 1,
            id_responsable: currentValues.id_responsable,
            detalles: canClearCart ? [] : currentValues.detalles
        });
        if (canClearCart) {
            clearCart()
        }
    }, [getValues, reset]);

    // Función para agregar un solo producto
    const handleAddProductItem = (product: ProductGet) => {
        addItemToCart(product);
        setTimeout(() => {
            // Enfocar el input del producto agregado
            tableRef.current?.focusQuantityInputByProductId(product.id);
        }, 100);
    };

    // Función para agregar múltiples productos
    const handleAddMultipleProducts = (products: Array<ProductGet & { quantity?: number }>) => {
        addMultipleItemsWithQuantity(products);

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

    // FUNCIÓN onSubmit corregida
    const onSubmit = (data: Sale) => {
        if (!validateBeforeSubmit()) {
            return;
        }

        const dataToSend: Sale = {
            ...data,
            fecha: formatDateForSubmission(data.fecha),
        };

        createSale(dataToSend, {
            onSuccess: (createdSale) => {

                // Preparar datos temporales para la navegación
                const tempFormData: SaleUpdateForm = {
                    fecha: data.fecha,
                    nro_comprobante: data.nro_comprobante,
                    nro_comprobante2: data.nro_comprobante2,
                    id_cliente: data.id_cliente,
                    tipo_venta: data.tipo_venta,
                    forma_venta: data.forma_venta,
                    forma_pago: data.forma_pago,
                    comentario: data.comentario,
                    plazo_pago: data.plazo_pago,
                    vehiculo: data.vehiculo,
                    nro_motor: data.nro_motor,
                    cliente_nombre: data.cliente_nombre,
                    cliente_nit: data.cliente_nit,
                    sucursal: data.sucursal,
                    id_responsable: data.id_responsable,
                    detalles: items.map((item, index) => ({
                        cantidad: item.quantity,
                        descuento: discountAmount ? (item.quantity * item.customPrice) * (discountPercent! / 100) : 0,
                        id_detalle_venta: 0, // temporal
                        id_producto: item.product.id,
                        porcentaje_descuento: discountPercent ?? 0,
                        precio: item.customPrice,
                        orden: index + 1,
                        producto: {
                            id: item.product.id,
                            categoria: null,
                            codigo_oem: item.product.codigo_oem,
                            codigo_upc: item.product.codigo_upc,
                            descripcion: item.product.descripcion,
                            marca: item.product.marca,
                            precio_venta: item.product.precio_venta,
                            stock_actual: item.product.stock_actual
                        }
                    }))
                };

                showSuccessToast({
                    title: "Venta Creada",
                    description: `Venta #${createdSale.id} creada exitosamente`,
                    duration: 2000  // 2 segundos para cerrar más rápido
                });

                // Capturar el ID del tab actual
                // const saleTabId = currentTab?.id;

                // Navegar a edición con estado temporal
                navigate(`/dashboard/sales/${createdSale.id}/update`, {
                    state: {
                        tempFormData,
                        tempCreatedSale: createdSale,
                        fromCreate: true,
                        saleMethod: mode
                    }
                });

                // // Cerrar el tab de creación después de navegar
                setTimeout(() => {
                    handleNewSale(false)
                    // if (saleTabId) {
                    //     closeCurrentTab(saleTabId);
                    // }
                }, 2500);
            },
            onError: (error: unknown) => {
                handleError({ error, customTitle: "No se pudo crear la venta" });
            }
        });
    };

    const onError = (errors: FieldErrors<Sale>) => {
        console.log(errors)
        if (errors.id_cliente || errors.tipo_venta || errors.forma_venta || errors.id_responsable) {
            showErrorToast({
                title: "Error de validación",
                description: "Revisa los campos obligatorios del formulario",
                duration: 5000
            });
            return;
        }
        const firstErrorKey = Object.keys(errors)[0] as keyof Sale;
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
        if (saleTypesData && saleModalitiesData && salePaymentTypesData) {
            if (!getValues("tipo_venta")) {
                setValue("tipo_venta", saleTypesData[0].code)
            }
            if (!getValues("forma_venta")) {
                setValue("forma_venta", saleModalitiesData[0].code)
            }
            if (!getValues("forma_pago")) {
                setValue("forma_pago", salePaymentTypesData[0].code)
            }
        }
    }, [saleTypesData, saleModalitiesData, salePaymentTypesData, getValues, setValue])

    const selectedItems = useMemo<SelectedItem[]>(() => {
        return detalles.map(detail => ({
            productId: detail.id_producto || 0,
            quantity: detail.cantidad, // Solo cantidad actual
        }));
    }, [detalles]);

    // Hook para manejar la ventana secundaria de productos
    const productWindow = useProductSelectorWindow({
        context: 'venta',
        instanceId: 'create-sale',
        onProductSelect: handleAddProductItem,
        onMultiSelect: handleAddMultipleProducts,
        onlyWithStock: true,
        multiSelect: true,
        mode: 'create',
        validateStock: true,
        selectedItems,
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

    const containerRef = useRef<HTMLDivElement>(null);
    useFormEnterNavigation({
        containerRef: containerRef,
        excludeSelectors: [
            '.editable-cell-input',
            '[data-table-cell="true"]',
            '[name="btn-chvron-right"]'
        ], enabled: true,
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
                                        Nueva Venta
                                    </h1>
                                    <p className="text-sm text-gray-500">Registra una nueva venta en el sistema</p>
                                </div>
                            </div >

                            {/* Action Buttons */}
                            < div className="flex items-center justify-end w-full sm:w-auto gap-2" >
                                <Label className="text-sm text-muted-foreground">Modo:</Label>
                                <div className="flex gap-1 border border-border rounded-lg p-1">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={mode === 'sale-strict' ? 'default' : 'ghost'}
                                        onClick={() => handleManualModeChange('sale-strict')}
                                        className="h-7 text-xs"
                                    >
                                        Estricta
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={mode === 'sale-permissive' ? 'default' : 'ghost'}
                                        onClick={() => handleManualModeChange('sale-permissive')}
                                        className="h-7 text-xs"
                                    >
                                        Permisiva
                                    </Button>
                                </div>
                            </div >
                        </div >
                    </header >

                    <div ref={containerRef} className="gap-2 flex-1 min-h-screen md:min-h-0">
                        <div className={cn(
                            "h-full gap-2",
                            configuraciones.formulario === "top" && "flex flex-col",
                            configuraciones.formulario === "left" && "flex flex-col md:grid md:grid-cols-3"
                        )}>
                            {/* Formulario de información de venta*/}
                            <div className={cn(
                                "gap-2 flex-shrink-0",
                                configuraciones.formulario === "top" && "grid",
                                configuraciones.formulario === "left" && "flex flex-col",
                            )}>
                                {/* 1. Datos de la venta */}
                                <Card className={cn(
                                    "shadow-none",
                                    configuraciones.formulario === "top" && "h-full flex-shrink-0",
                                    configuraciones.formulario === "left" && "h-auto md:h-full",
                                )}>

                                    <CardContent className="p-2 sm:p-3">
                                        <div className={cn(
                                            "grid gap-2",
                                            configuraciones.formulario === "top" && "grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 xl:gap-x-2 xl:gap-y-2",
                                            configuraciones.formulario === "left" && "grid-cols-2",
                                        )}>
                                            <div>
                                                <Label htmlFor="fechaVenta">Fecha *</Label>
                                                <Input
                                                    id="fechaVenta"
                                                    type="date"
                                                    {...register("fecha")}
                                                    className="w-full"
                                                    autoFocus
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
                                                            clearOnEmpty={true}
                                                        />
                                                    )}
                                                />
                                                {errors.id_responsable && <p className="text-red-500 text-xs">El campo es requerido</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="cliente">Cliente *</Label>
                                                <Controller
                                                    name="id_cliente"
                                                    control={control}
                                                    render={({ field }) => (
                                                        // <PaginatedCombobox
                                                        //     value={field.value}
                                                        //     onChange={(value) => field.onChange(Number(value))}
                                                        //     optionsData={saleCustomersData?.data || []}
                                                        //     displayField="nombre"
                                                        //     isLoading={isSaleCustomersLoading}
                                                        //     updatePage={(page) => { console.log("Update page:", page) }}
                                                        //     updateSearch={setCustomerSearchTerm}
                                                        //     placeholder="Buscar cliente por nombre"
                                                        //     metaData={
                                                        //         {
                                                        //             current_page: saleCustomersData?.meta.current_page || 1,
                                                        //             last_page: saleCustomersData?.meta.last_page || 1,
                                                        //             total: saleCustomersData?.meta.total || 0,
                                                        //             per_page: saleCustomersData?.meta.per_page || 10,
                                                        //         }
                                                        //     }
                                                        // />
                                                        <ComboboxSelect
                                                            value={field.value}
                                                            onChange={(value) => {
                                                                field.onChange(Number(value));
                                                            }}
                                                            options={saleCustomersData?.data || []}
                                                            optionTag={"nombre"}
                                                            clearOnEmpty={true}
                                                            placeholder="Buscar cliente por nombre"
                                                        />
                                                    )}
                                                />
                                                {errors.id_cliente && <p className="text-red-500 text-xs">El campo es requerido</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="altClie">Cliente Alt.</Label>
                                                <Input
                                                    id="altClie"
                                                    {...register("cliente_nombre")}
                                                    placeholder="Cliente alternativo"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="cliente_nit">Nit Cliente</Label>
                                                <Input
                                                    id="cliente_nit"
                                                    {...register("cliente_nit")}
                                                    placeholder="Nit del Cliente"
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
                                            {
                                                configuraciones.inputs && (
                                                    <div>
                                                        <Label htmlFor="forma">Forma de venta *</Label>
                                                        <Controller
                                                            name="forma_venta"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Select
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
                                                        {errors.forma_venta && <p className="text-red-500 text-xs">{errors.forma_venta.message}</p>}
                                                    </div>
                                                )
                                            }

                                            <div>
                                                <Label htmlFor="forma_pago">Forma de pago *</Label>
                                                <Controller
                                                    name="forma_pago"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select
                                                            onValueChange={field.onChange} value={field.value || salePaymentTypesData?.[0]?.code || ""}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecciona una forma de pago" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {
                                                                    salePaymentTypesData && salePaymentTypesData.map((modality) => (
                                                                        <SelectItem key={modality.code} value={modality.code}>
                                                                            {modality.label}
                                                                        </SelectItem>
                                                                    ))
                                                                }
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                                {errors.forma_pago && <p className="text-red-500 text-xs">{errors.forma_pago.message}</p>}
                                            </div>

                                            <div>
                                                <Label htmlFor="tipo_venta">Tipo de Venta *</Label>
                                                <Controller
                                                    name="tipo_venta"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select
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
                                                {errors.tipo_venta && <p className="text-red-500 text-xs">El campo es requerido</p>}
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
                                                    disabled={formValues.tipo_venta !== "VC"}
                                                />
                                                {errors.plazo_pago && <p className="text-red-500 text-xs">{errors.plazo_pago.message}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="vehiculo">Vehículo/Motor</Label>
                                                <Input
                                                    id="vehiculo"
                                                    {...register("vehiculo")}
                                                    placeholder="Modelo del vehículo"
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
                                                        />
                                                    </div>
                                                )
                                            }
                                            <div className={cn(
                                                configuraciones.formulario === "top" && "",
                                                configuraciones.formulario === "left" && "md:col-span-2",
                                            )}>
                                                <Label htmlFor="comentarios">Comentarios</Label>
                                                <Textarea
                                                    id="comentarios"
                                                    {...register("comentario")}
                                                    placeholder="Comentarios adicionales sobre la venta"
                                                    rows={configuraciones.formulario === "top" ? 1 : 2}
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
                                                            onlySelectWithStock={true}
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
                                                                    disabled={isSaving}
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
                                                        {items.length === 0 ? (
                                                            <div className="text-center py-8 text-gray-500">
                                                                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                                <p>No hay productos agregados</p>
                                                                <p className="text-sm">Haz clic en "Seleccionar Productos" para agregar</p>
                                                            </div>
                                                        ) :
                                                            <TableShoppingCart
                                                                ref={tableRef}
                                                            />
                                                        }
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </ResizablePanel>
                                    </ResizablePanelGroup>

                                    {/* Resumen de venta  */}
                                    <SalesSummary
                                        clearCart={clearCart}
                                        discountAmount={discountAmount}
                                        discountPercent={discountPercent}
                                        subtotal={subtotal}
                                        total={total}
                                        isPending={isSaving}
                                        callback={handleNewSale}
                                        setDiscountAmount={setDiscountAmount}
                                        setDiscountPercent={setDiscountPercent}
                                        hasProducts={items.length > 0}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </FormProvider>

            {/* Modales de Conversión */}
            <CartModeConversionModal
                open={showModeConversionModal}
                onClose={handleCloseModal}
                targetMode={targetModeForModal}
                shouldGoBackOnClose={true}
            />
        </main >
    );
};

export default CreateSaleScreen;