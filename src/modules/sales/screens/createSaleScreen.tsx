import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Kbd } from "@/components/atoms/kbd";
import { Label } from "@/components/atoms/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { PaginatedCombobox } from "@/components/common/paginatedCombobox";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import TooltipButton from "@/components/common/TooltipButton";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import ProductSelectorModal from "@/modules/products/components/ProductSelectorModal";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import TableShoppingCart from "@/modules/shoppingCart/components/tableShoppingCart";
import { useCartWithUtils } from "@/modules/shoppingCart/hooks/useCartWithUtils";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";
import { CornerUpLeft, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router";
import { useDebounce } from "use-debounce";
import SalesSummary from "../components/salesSummary";
import { useCreateSale } from "../hooks/useCreateSale";
import { useSaleCustomers } from "../hooks/useSaleCustomers";
import { useSaleModalities } from "../hooks/useSaleModalities";
import { useSaleResponsibles } from "../hooks/useSaleResponsibles";
import { useSaleTypes } from "../hooks/useSaleTypes";
import { SaleSchema } from "../schemas/sales.schema";
import type { Sale, SaleDetail } from "../types/sale";

const CreateSaleScreen = () => {
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
        mutate: createSale,
        isPending: isSaving
    } = useCreateSale();

    const { handleError } = useErrorHandler()

    const methods = useForm<Sale>({
        resolver: zodResolver(SaleSchema),
        defaultValues: {
            fecha: format(new Date(), "yyyy-MM-dd"),
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
            id_responsable: Number(user?._id) || undefined,
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
        const detalles: SaleDetail[] = items.map(item => ({
            id_producto: item.product.id,
            cantidad: item.quantity,
            precio: item.customPrice,
            descuento: ((item.customPrice ?? 0) * item.quantity) * ((discountPercent ?? 0) / 100),
            porcentaje_descuento: discountPercent ?? 0
        }));

        if (detalles.length > 0) {
            setValue("detalles", detalles as [SaleDetail, ...SaleDetail[]]);
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
                message: "Debes agregar al menos un producto para realizar una venta"
            });
            showErrorToast({
                title: "Carrito vacío",
                description: "Debes agregar al menos un producto para realizar una venta",
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
            resetField("plazo_pago");
        }
    }, [tipoVenta, plazoPago, resetField, setError, clearErrors, watch]);

    const handleCheckout = () => {
        clearCart();

        const currentValues = getValues();
        reset({
            fecha: format(new Date(), "yyyy-MM-dd"),
            nro_comprobante: "",
            nro_comprobante2: "",
            id_cliente: currentValues.id_cliente,
            tipo_venta: currentValues.tipo_venta,
            forma_venta: currentValues.forma_venta,
            comentario: "",
            plazo_pago: "",
            vehiculo: "",
            nro_motor: "",
            cliente_nombre: currentValues.cliente_nombre,
            cliente_nit: currentValues.cliente_nit,
            usuario: currentValues.usuario,
            sucursal: currentValues.sucursal,
            id_responsable: currentValues.id_responsable,
            detalles: []
        });
    };

    const handleAddProductItem = (product: ProductGet) => {
        addItemToCart(product)
    };

    const handleAddMultipleProducts = (products: ProductGet[]) => {
        addMultipleItems(products);
    };

    // FUNCIÓN onSubmit corregida
    const onSubmit = (data: Sale) => {
        if (!validateBeforeSubmit()) {
            return;
        }

        createSale(data, {
            onSuccess: () => {
                // console.log('Venta creada:', response);
                showSuccessToast({
                    title: "Venta Exitosa",
                    description: `Venta realizada con éxito`,
                    duration: 5000
                });
                handleCheckout();
            },
            onError: (error: unknown) => {
                handleError({ error, customTitle: "No se pudo crear la venta" });
            }
        });
    };

    const onError = (errors: FieldErrors<Sale>) => {
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
            if (!getValues("tipo_venta")) {
                setValue("tipo_venta", saleTypesData[0].code)
            }
            if (!getValues("forma_venta")) {
                setValue("forma_venta", saleModalitiesData[0].code)
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
                <form onSubmit={handleSubmit(onSubmit, onError)} className="w-full flex flex-col gap-3">
                    {/* Header */}
                    <header className="border-gray-200 border bg-white rounded-lg p-2 sm:p-3">
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
                                        Nueva Venta
                                    </h1>
                                    <p className="text-sm text-gray-500">Registra una nueva venta en el sistema</p>
                                </div>
                            </div >

                            {/* Action Buttons */}
                            < div className="flex items-center justify-end w-full sm:w-auto gap-2" >

                            </div >
                        </div >
                    </header >

                    {/* Formulario de información de venta */}
                    <Card className="shadow-none h-full">

                        <CardContent className="py-4">
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
                                    {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha.message}</p>}
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
                                    <Label htmlFor="altClie">Alt. Cliente</Label>
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
                                    <Label htmlFor="forma">Forma de venta *</Label>
                                    <Controller
                                        name="forma_venta"
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
                                    {errors.forma_venta && <p className="text-red-500 text-sm mt-1">{errors.forma_venta.message}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="tipoVenta">Tipo de Venta *</Label>
                                    <Controller
                                        name="tipo_venta"
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
                                    {errors.tipo_venta && <p className="text-red-500 text-sm mt-1">El campo es requerido</p>}
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
                                    <Input
                                        id="comentarios"
                                        {...register("comentario")}
                                        placeholder="Comentarios adicionales sobre la venta"
                                    />
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">* Campos requeridos</span>
                        </CardContent>
                    </Card>

                    {/* 2. Productos */}
                    <Card className="shadow-none">
                        <CardHeader className="pb-4">
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
                                    <TableShoppingCart />
                                }
                            </div>
                        </CardContent>
                    </Card>
                    {/* Resumen de venta - Columna derecha */}
                    <SalesSummary
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

export default CreateSaleScreen;