import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Kbd } from "@/components/atoms/kbd";
import { Label } from "@/components/atoms/label";
import { Separator } from "@/components/atoms/separator";
import { Textarea } from "@/components/atoms/textarea";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import ShortcutKey from "@/components/common/ShortcutKey";
import TooltipButton from "@/components/common/TooltipButton";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useProductSelectorWindow } from "@/hooks/useSecondaryWindow";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import { formatCurrency } from "@/utils/formaters";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowLeftRight, CornerUpLeft, Loader2, Maximize2, Save } from "lucide-react";
import { useEffect, useRef } from "react";
import { Controller, FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useParams } from "react-router";
import type { TransferDetailTableRef } from "../components/TransferDetailTable";
import TransferDetailTable from "../components/TransferDetailTable";
import TransferDetailSkeleton from "../components/transferDetail/TransferDetailSkeleton";
import { useTransferBranches } from "../hooks/commons/useTransferBranches";
import { useTransferResponsibles } from "../hooks/commons/useTransferResponsibles";
import { useGetBranchById } from "@/modules/settings/hooks/branch/useGetBranchById";
import { useTransferById } from "../hooks/useTransferById";
import { useTransferDetails } from "../hooks/useTransferDetails";
import { useTransferUpdate } from "../hooks/useTransferUpdate";
import { TransferCreateSchema } from "../schemas/transferCreateSchema";
import type { TransferCreate } from "../types/transferCreate.types";

const EditTransfer = () => {
    const navigate = useNavigate();
    const { id: transferId } = useParams();
    const { closeCurrentTab } = useTabNavigation();
    const user = authSDK.getCurrentUser();
    const { selectedBranchId } = useBranchStore();
    const tableRef = useRef<TransferDetailTableRef>(null);

    // Cargar datos de la transferencia existente
    const {
        data: transferData,
        isLoading: isLoadingTransfer,
        isError: isErrorTransfer
    } = useTransferById(Number(transferId));

    // Hook de detalles de transferencia
    const transferDetailsHook = useTransferDetails();

    const {
        data: transferResponsiblesData,
    } = useTransferResponsibles();

    const {
        data: transferBranchesData,
    } = useTransferBranches(transferData?.sucursal_origen_id || Number(selectedBranchId) || 1);

    const {
        data: originBranchData,
    } = useGetBranchById(transferData?.sucursal_origen_id || Number(selectedBranchId) || 1);

    const {
        mutateAsync: updateTransfer,
        isPending: isSaving
    } = useTransferUpdate();

    const { handleError } = useErrorHandler();

    const methods = useForm<TransferCreate>({
        resolver: zodResolver(TransferCreateSchema),
        defaultValues: {
            fecha: format(new Date(), "yyyy-MM-dd"),
            nro_comprobante: "",
            comentarios: "",
            sucursal_origen: Number(selectedBranchId) || 1,
            sucursal_destino: undefined,
            responsable: Number(user?._id) || undefined,
            detalles: [],
        }
    });

    const {
        register,
        control,
        handleSubmit,
        setValue,
        getValues,
        setError,
        clearErrors,
        watch,
        formState: { errors }
    } = methods;

    // Watch sucursal_origen para actualizar las sucursales destino disponibles
    const sucursalOrigen = watch("sucursal_origen");
    const sucursalDestino = watch("sucursal_destino");

    // Obtener el nombre de la sucursal origen para mostrarlo visualmente
    const sucursalOrigenNombre = originBranchData?.nombre;

    // Cargar datos de la transferencia en el formulario
    useEffect(() => {
        if (transferData && transferData.detalles && transferDetailsHook.details.length === 0) {
            // Cargar campos del formulario
            setValue("fecha", transferData.fecha?.split('T')[0] || format(new Date(), "yyyy-MM-dd"));
            setValue("nro_comprobante", transferData.nro_comprobante || "");
            setValue("comentarios", transferData.comentarios || "");
            setValue("sucursal_origen", transferData.sucursal_origen_id || Number(selectedBranchId) || 1);
            setValue("sucursal_destino", transferData.sucursal_destino_id);
            setValue("responsable", transferData.responsable?.id || Number(user?._id));

            // Transformar detalles del API al formato del hook
            const transformedDetails = transferData.detalles
                .filter(detalle => detalle.producto)
                .map((detalle) => ({
                    producto_id: detalle.producto.id,
                    cantidad_entrada_salida: Number(detalle.cantidad),
                    costo_entrada: parseFloat(detalle.costo_entrada),
                    precio_salida: parseFloat(detalle.precio_salida),
                    precio_entrada_venta: parseFloat(detalle.precio_entrada_venta),
                    precio_entrada_venta_alt: parseFloat(detalle.precio_entrada_venta_alt),
                    incremento_p_entrada_venta: 0,
                    incremento_p_entrada_venta_alt: 0,
                    product: {
                        id: detalle.producto.id,
                        descripcion: detalle.producto.descripcion,
                        codigo_oem: detalle.producto.codigo_oem,
                        codigo_upc: detalle.producto.codigo_upc,
                        costo: parseFloat(detalle.costo_entrada),
                        precio_venta: parseFloat(detalle.precio_entrada_venta),
                        precio_venta_alt: parseFloat(detalle.precio_entrada_venta_alt),
                    },
                    purchase_id: 0,
                    id_detalle_transferencia: detalle.id, // Guardar el id del detalle para el update
                }));

            // Cargar todos los detalles de una vez
            transferDetailsHook.setTransferDetails(transformedDetails as any);
        }
    }, [transferData, transferDetailsHook.details.length]);

    // Sincronizar detalles con el formulario
    useEffect(() => {
        const detalles = transferDetailsHook.getTransferDetails();

        if (detalles.length > 0) {
            setValue("detalles", detalles);
            clearErrors("detalles");
        }
    }, [transferDetailsHook.details, setValue, clearErrors]);

    const validateBeforeSubmit = (): boolean => {
        let isValid = true;

        if (transferDetailsHook.details.length === 0) {
            setError("detalles", {
                type: "manual",
                message: "Debes agregar al menos un producto para realizar una transferencia"
            });
            showErrorToast({
                title: "Sin productos",
                description: "Debes agregar al menos un producto para realizar una transferencia",
                duration: 5000
            });
            isValid = false;
        }

        const formData = getValues();

        if (!formData.sucursal_destino) {
            setError("sucursal_destino", {
                type: "manual",
                message: "Debes seleccionar una sucursal destino"
            });
            isValid = false;
        }

        if (formData.sucursal_origen === formData.sucursal_destino) {
            setError("sucursal_destino", {
                type: "manual",
                message: "La sucursal destino debe ser diferente a la sucursal origen"
            });
            showErrorToast({
                title: "Error de validación",
                description: "La sucursal destino debe ser diferente a la sucursal origen",
                duration: 5000
            });
            isValid = false;
        }

        return isValid;
    };

    const onSubmit = async (data: TransferCreate) => {
        if (!validateBeforeSubmit()) {
            return;
        }

        try {
            // Transformar detalles para enviar al backend
            const transformedDetalles = transferDetailsHook.details.map((detalle: any) => {
                return {
                    id_detalle_transferencia: detalle.id_detalle_transferencia || null,
                    producto_id: detalle.producto_id,
                    cantidad_entrada_salida: Number(detalle.cantidad_entrada_salida),
                    costo_entrada: Number(detalle.costo_entrada),
                    precio_salida: Number(detalle.precio_salida),
                    precio_entrada_venta: Number(detalle.precio_entrada_venta),
                    precio_entrada_venta_alt: Number(detalle.precio_entrada_venta_alt),
                    incremento_p_entrada_venta: Number(detalle.incremento_p_entrada_venta || 0),
                    incremento_p_entrada_venta_alt: Number(detalle.incremento_p_entrada_venta_alt || 0),
                };
            });

            const payload = {
                ...data,
                detalles: transformedDetalles,
            };

            await updateTransfer({ id: Number(transferId), data: payload });

            showSuccessToast({
                title: "Transferencia Actualizada",
                description: `La transferencia se actualizó con éxito`,
                duration: 5000
            });

            // Cerrar tab después de actualizar exitosamente
            closeCurrentTab();
        } catch (error: unknown) {
            handleError({ error, customTitle: "No se pudo actualizar la transferencia" });
        }
    };

    const onError = (errors: FieldErrors<TransferCreate>) => {
        if (errors.sucursal_destino || errors.responsable) {
            showErrorToast({
                title: "Error de validación",
                description: "Revisa los campos obligatorios del formulario",
                duration: 5000
            });
            return;
        }
        const firstErrorKey = Object.keys(errors)[0] as keyof TransferCreate;
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
        navigate(`/dashboard/transfers/${transferId}`);
    };

    useEffect(() => {
        if (!user?._id && transferResponsiblesData && transferResponsiblesData.data.length > 0) {
            const firstResponsible = transferResponsiblesData.data[0];
            setValue("responsable", firstResponsible.id);
        }
    }, [transferResponsiblesData, setValue, user?._id]);

    // Auto-seleccionar la primera sucursal destino disponible
    useEffect(() => {
        // Solo auto-seleccionar si no hay una sucursal destino ya seleccionada
        if (!sucursalDestino && transferBranchesData?.data && transferBranchesData.data.length > 0) {
            const firstActiveBranch = transferBranchesData.data.find(branch => branch.activo === "SI");
            if (firstActiveBranch) {
                setValue("sucursal_destino", firstActiveBranch.id);
            }
        }
    }, [transferBranchesData, setValue, sucursalDestino]);

    const handleAddProductItem = (product: ProductGet) => {
        transferDetailsHook.addProduct(product);
        setTimeout(() => {
            tableRef.current?.focusFirstQuantityInput();
        }, 100);
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
    });

    // Window Purchase Selector
    const purchaseWindow = useProductSelectorWindow({
        context: 'transfer',
        instanceId: `edit-transfer-${transferId}`,
        onProductSelect: (product: any) => {
            handleAddProductItem(product);
        },
        onlyWithStock: false,
    });

    const toggleSelectorMode = () => {
        if (purchaseWindow.isOpen) {
            purchaseWindow.close();
        }
        purchaseWindow.open();
    }

    // Loading state
    if (isLoadingTransfer) {
        return (
            <main className="flex flex-col items-center">
                <TransferDetailSkeleton />
            </main>
        );
    }

    if (isErrorTransfer || !transferData) {
        return (
            <div className="h-full flex items-center justify-center p-2 lg:p-8">
                <ErrorDataComponent
                    className="h-full w-full"
                    errorMessage="No se pudo cargar la transferencia."
                    showButtonIcon={false}
                    buttonText="Ir a lista de transferencias"
                    onRetry={() => navigate("/dashboard/transfers")}
                />
            </div>
        )
    }

    return (
        <main className="h-full flex flex-col">
            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit, onError)} className="h-full flex flex-col gap-2 p-2">
                    {/* Header */}
                    <header className="border-gray-200 border bg-white rounded-lg p-2 sm:px-3 flex-shrink-0">
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TooltipButton
                                    tooltipContentProps={{
                                        align: 'start'
                                    }}
                                    onClick={handleGoBack}
                                    tooltip={<p className="flex items-center gap-1">Presiona <Kbd>esc</Kbd> para volver al detalle</p>}
                                    buttonProps={{
                                        variant: 'default',
                                        type: 'button',
                                    }}
                                >
                                    <CornerUpLeft />
                                </TooltipButton>
                                <div>
                                    <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                                        Editar Transferencia {transferData?.nro_completo}
                                    </h1>
                                    <p className="text-sm text-gray-500">Modifica los datos de la transferencia</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* 1. Datos de la transferencia */}
                    <Card className="shadow-none flex-shrink-0">
                        <CardContent className="py-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                                <div className="w-full">
                                    <Label htmlFor="fecha" className="text-xs">Fecha *</Label>
                                    <Input
                                        id="fecha"
                                        type="date"
                                        {...register("fecha")}
                                        className="w-full text-xs h-8"
                                    />
                                    {errors.fecha && <p className="text-red-500 text-xs mt-0.5">{errors.fecha.message}</p>}
                                </div>
                                <div className="w-full">
                                    <Label htmlFor="responsable" className="text-xs">Responsable *</Label>
                                    <Controller
                                        name="responsable"
                                        control={control}
                                        render={({ field }) => (
                                            <ComboboxSelect
                                                value={field.value}
                                                onChange={(value) => {
                                                    field.onChange(Number(value));
                                                }}
                                                options={transferResponsiblesData?.data || []}
                                                optionTag={"nombre"}
                                            />
                                        )}
                                    />
                                    {errors.responsable && <p className="text-red-500 text-xs mt-0.5">El campo es requerido</p>}
                                </div>

                                <div className="w-full">
                                    <Label htmlFor="sucursal_origen" className="text-xs">Sucursal Origen *</Label>
                                    <Input
                                        id="sucursal_origen"
                                        value={sucursalOrigenNombre}
                                        disabled
                                        className="bg-gray-100 text-xs h-8"
                                    />
                                </div>

                                <div className="w-full">
                                    <Label htmlFor="sucursal_destino" className="text-xs">Sucursal Destino *</Label>
                                    <Controller
                                        name="sucursal_destino"
                                        control={control}
                                        render={({ field }) => (
                                            <ComboboxSelect
                                                value={field.value}
                                                onChange={(value) => {
                                                    field.onChange(Number(value));
                                                }}
                                                options={
                                                    transferBranchesData?.data
                                                        ?.filter(branch => branch.activo === "SI")
                                                        .map(branch => ({
                                                            id: branch.id,
                                                            nombre: branch.nombre,
                                                            sigla: branch.sigla
                                                        })) || []
                                                }
                                                optionTag={"nombre"}
                                                placeholder="Selecciona destino"
                                            />
                                        )}
                                    />
                                    {errors.sucursal_destino && <p className="text-red-500 text-xs mt-0.5">{errors.sucursal_destino.message}</p>}
                                </div>

                                <div className="w-full">
                                    <Label htmlFor="nroComprobante" className="text-xs">N° Comprobante</Label>
                                    <Input
                                        id="nroComprobante"
                                        {...register("nro_comprobante")}
                                        placeholder="N° Comprobante"
                                        className="w-full text-xs h-8"
                                    />
                                </div>

                                <div className="w-full">
                                    <Label htmlFor="comentarios" className="text-xs">Comentarios</Label>
                                    <Textarea
                                        id="comentarios"
                                        {...register("comentarios")}
                                        placeholder="Comentarios adicionales"
                                        rows={1}
                                        className="w-full text-xs min-h-8"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-none flex-1 min-h-0 flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ArrowLeftRight className="size-4" />
                                Detalle de Transferencia
                            </CardTitle>
                            <Button
                                type="button"
                                variant={"default"}
                                size="sm"
                                onClick={toggleSelectorMode}
                                className="gap-2"
                            >
                                <Maximize2 className="h-4 w-4" />
                                Agregar producto
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 flex flex-col">
                            {transferDetailsHook.details.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>No hay productos agregados</p>
                                    <p className="text-sm">Haz clic en "Agregar producto" para añadir productos</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 min-h-0 overflow-auto">
                                        <TransferDetailTable
                                            ref={tableRef}
                                            details={transferDetailsHook.details}
                                            onUpdateCantidad={transferDetailsHook.updateCantidad}
                                            onUpdateCostoEntrada={transferDetailsHook.updateCostoEntrada}
                                            onUpdatePrecioSalida={transferDetailsHook.updatePrecioSalida}
                                            onUpdatePrecioEntradaVenta={transferDetailsHook.updatePrecioEntradaVenta}
                                            onUpdatePrecioEntradaVentaAlt={transferDetailsHook.updatePrecioEntradaVentaAlt}
                                            onUpdateIncrementoPrecioEntradaVenta={transferDetailsHook.updateIncrementoPrecioEntradaVenta}
                                            onUpdateIncrementoPrecioEntradaVentaAlt={transferDetailsHook.updateIncrementoPrecioEntradaVentaAlt}
                                            onRemoveProduct={transferDetailsHook.removeProduct}
                                        />
                                    </div>
                                    <Separator className="h-[0.5px] flex-shrink-0" />
                                    <div className="flex justify-between items-center px-2 pt-2 flex-shrink-0">
                                        <span className="font-medium text-gray-500">Total (Costo Entrada):</span>
                                        <span className="font-bold text-emerald-600">{formatCurrency(transferDetailsHook.getTotal())}</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Footer fijo */}
                    <Card className="border border-gray-200 shadow-none pt-3 flex-shrink-0">
                        <CardContent className="space-y-2">
                            <footer className="flex gap-2 items-center justify-between">
                                <span className="text-xs text-gray-500">* Campos requeridos</span>
                                <div className="flex gap-2">
                                    <TooltipButton
                                        buttonProps={{
                                            type: 'submit',
                                            disabled: isSaving,
                                            variant: 'default',
                                            className: "w-full"
                                        }}
                                        tooltip={
                                            <span className="flex items-center gap-1">Guardar Cambios <ShortcutKey combo="alt+s" /></span>
                                        }
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 size-4" />
                                                Guardar Cambios
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

export default EditTransfer;
