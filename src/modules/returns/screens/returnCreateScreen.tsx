import { useEffect, useState, useRef, useMemo } from "react";
import { CornerUpLeft, Loader2, Plus, Save, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Label } from "@/components/atoms/label";
import { Input } from "@/components/atoms/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import authSDK from "@/services/sdk-simple-auth";
import { FormProvider, useForm, Controller, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Kbd } from "@/components/atoms/kbd";
import { useNavigate } from "react-router";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { useBranchStore } from "@/states/branchStore";
import { useHotkeys } from "react-hotkeys-hook";
import TooltipButton from "@/components/common/TooltipButton";
import { format } from "date-fns";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { Textarea } from "@/components/atoms/textarea";
import { Button } from "@/components/atoms/button";
import ShortcutKey from "@/components/common/ShortcutKey";
import { formatCurrency } from "@/utils/formaters";
import type { ReturnDetailTableRef } from "../components/returnDetailTable";
import { useReturnDetails, type ProductChange } from "../hooks/useReturnDetails";
import { useReturnTypes } from "../hooks/commons/useReturnTypes";
import { useReturnResponsibles } from "../hooks/commons/useReturnResponsibles";
import { useCreateReturn } from "../hooks/useCreateReturn";
import type { ReturnCreate, UIReturnDetailCreate } from "../types/returnCreate.types";
import { ReturnCreateSchema } from "../schemas/returnCreateSchema";
import type { SaleGetAll } from "@/modules/sales/types/salesGetResponse";
import ReturnDetailTable from "../components/returnDetailTable";
import SaleReturnList from "../components/SalesReturnList";
import SelectSalesReturnModal from "../components/SelectSalesReturnModal";
import { useSaleDetailSelectorWindow } from "@/hooks/useSecondaryWindow";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/atoms/resizable";
import { cn } from "@/lib/utils";

const ReturnCreateScreen = () => {
    const configuraciones = {
        inputs: false,
        formulario: 'top',
        selector_mode: 'window',
    }
    const [isReadOnly, setIsReadOnly] = useState<boolean>(false)

    const navigate = useNavigate();
    const user = authSDK.getCurrentUser();
    const { selectedBranchId } = useBranchStore();
    const tableRef = useRef<ReturnDetailTableRef>(null);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
    const [selectedSale, setSelectedSale] = useState<SaleGetAll | null>(null)

    // Hook de detalles de devolución
    const returnDetailsHook = useReturnDetails<UIReturnDetailCreate>(false);

    const {
        data: returnTypesData,
    } = useReturnTypes();

    const {
        data: returnResponsiblesData,
    } = useReturnResponsibles();

    const {
        mutate: createReturn,
        isPending: isSaving
    } = useCreateReturn();

    const { handleError } = useErrorHandler();

    const methods = useForm<ReturnCreate>({
        resolver: zodResolver(ReturnCreateSchema),
        defaultValues: {
            fecha: format(new Date(), "yyyy-MM-dd"),
            nro_comprobante: "",
            motivo_devolucion: "",
            comentarios: "",
            sucursal: Number(selectedBranchId) || 1,
            responsable: Number(user?._id) || undefined,
            detalles: [],
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

    // Sincronizar detalles con el formulario
    useEffect(() => {
        const detalles = returnDetailsHook.getReturnDetails();

        if (detalles.length > 0) {
            setValue("detalles", detalles);
            clearErrors("detalles");
        }
    }, [returnDetailsHook.details, setValue, clearErrors]);

    // Validar si hay errores de cantidad (cantidades que exceden maxQuantity)
    const hasQuantityErrors = useMemo(() => {
        return returnDetailsHook.details.some(detail =>
            detail.cantidad > detail.maxQuantity || detail.cantidad <= 0
        );
    }, [returnDetailsHook.details]);

    // Validar si el formulario está listo para enviar
    const canSubmit = useMemo(() => {
        return (
            !hasQuantityErrors &&
            returnDetailsHook.details.length > 0 &&
            !isReadOnly &&
            !isSaving
        );
    }, [hasQuantityErrors, returnDetailsHook.details.length, isReadOnly, isSaving]);

    const validateBeforeSubmit = (): boolean => {
        let isValid = true;

        if (returnDetailsHook.details.length === 0) {
            setError("detalles", {
                type: "manual",
                message: "Debes agregar al menos un producto para realizar una devolución"
            });
            showErrorToast({
                title: "Sin productos",
                description: "Debes agregar al menos un producto para realizar una devolución",
                duration: 5000
            });
            isValid = false;
        }

        // Validar cantidades
        if (hasQuantityErrors) {
            showErrorToast({
                title: "Cantidades inválidas",
                description: "Algunos productos tienen cantidades que exceden el máximo permitido",
                duration: 5000
            });
            isValid = false;
        }

        const formData = getValues();

        if (!formData.motivo_devolucion) {
            setError("motivo_devolucion", {
                type: "manual",
                message: "Debes seleccionar un motivo de devolución"
            });
            isValid = false;
        }

        return isValid;
    };

    const handleNewReturn = () => {
        returnDetailsHook.clearDetails();
        setIsReadOnly(false)
        const currentValues = getValues();
        reset({
            fecha: format(new Date(), "yyyy-MM-dd"),
            nro_comprobante: "",
            motivo_devolucion: currentValues.motivo_devolucion,
            comentarios: "",
            sucursal: currentValues.sucursal,
            responsable: currentValues.responsable,
            detalles: [],
        });
    };

    const onSubmit = (data: ReturnCreate) => {
        if (!validateBeforeSubmit()) {
            return;
        }

        createReturn(data, {
            onSuccess: () => {
                setIsReadOnly(true)
                showSuccessToast({
                    title: "Devolución Exitosa",
                    description: `Devolución realizada con éxito`,
                    duration: 5000
                });
            },
            onError: (error: unknown) => {
                handleError({ error, customTitle: "No se pudo crear la devolución" });
            }
        });
    };

    const onError = (errors: FieldErrors<ReturnCreate>) => {
        if (errors.motivo_devolucion || errors.responsable) {
            showErrorToast({
                title: "Error de validación",
                description: "Revisa los campos obligatorios del formulario",
                duration: 5000
            });
            return;
        }
        const firstErrorKey = Object.keys(errors)[0] as keyof ReturnCreate;
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
        navigate('/dashboard/returns');
    };

    useEffect(() => {
        if (!user?._id && returnResponsiblesData && returnResponsiblesData.data.length > 0) {
            const firstResponsible = returnResponsiblesData.data[0];
            setValue("responsable", firstResponsible.id);
        }
    }, [returnResponsiblesData, setValue, user?._id]);

    useEffect(() => {
        if (returnTypesData) {
            if (!getValues("motivo_devolucion")) {
                setValue("motivo_devolucion", returnTypesData[0].id);
            }
        }
    }, [returnTypesData, getValues, setValue]);

    const handleSelectSale = (selectedSale: SaleGetAll) => {
        setIsDialogOpen(true)
        setSelectedSale(selectedSale)
    }

    const handleCloseSelectDialog = () => {
        setIsDialogOpen(false)
        setSelectedSale(null)
    }

    const handleConfirmModalSelections = (changes: ProductChange[]) => {
        if (!selectedSale || changes.length === 0) return;

        // Aplicar solo los cambios detectados
        const addedIds = returnDetailsHook.applyModalChanges(changes);

        // Enfocar el primer producto agregado
        setTimeout(() => {
            if (addedIds.length > 0) {
                tableRef.current?.focusQuantityInputByProductId(addedIds[0]);
            }
        }, 100);
    };

    const {
        open: openSaleDetailSelector,
        isOpen: isSaleDetailSelectorOpen,
    } = useSaleDetailSelectorWindow({
        context: 'create-return',
        mode: 'create',
        selectedItems: returnDetailsHook.details,
        onChangesApplied: (changes: ProductChange[]) => {
            // Aplicar solo los cambios detectados
            const addedIds = returnDetailsHook.applyModalChanges(changes);

            // Enfocar el primer producto agregado
            setTimeout(() => {
                if (addedIds.length > 0) {
                    tableRef.current?.focusQuantityInputByProductId(addedIds[0]);
                }
            }, 100);
        }
    });

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
        if (canSubmit) {
            handleSubmit(onSubmit, onError)();
        }
    }, {
        enabled: canSubmit
    });

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
                                    tooltip={<p className="flex items-center gap-1">Presiona <Kbd>esc</Kbd> para volver a la lista de devoluciones</p>}
                                    buttonProps={{
                                        variant: 'default',
                                        type: 'button'
                                    }}
                                >
                                    <CornerUpLeft />
                                </TooltipButton>
                                <div>
                                    <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight">
                                        Nueva Devolución
                                    </h1>
                                    <p className="text-sm text-gray-500">Registra una nueva devolución en el sistema</p>
                                </div>
                            </div >

                        </div >
                    </header >

                    <div className="gap-2 flex-1 min-h-screen md:min-h-0">
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
                                            configuraciones.formulario === "top" && "grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2",
                                            configuraciones.formulario === "left" && "grid-cols-2",
                                        )}>
                                            <div>
                                                <Label htmlFor="fecha">Fecha *</Label>
                                                <Input
                                                    id="fecha"
                                                    type="date"
                                                    {...register("fecha")}
                                                    className="w-full"
                                                    autoFocus
                                                    disabled={isReadOnly || isSaving}
                                                />
                                                {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha.message}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="responsable">Responsable *</Label>
                                                <Controller
                                                    name="responsable"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <ComboboxSelect
                                                            value={field.value}
                                                            onChange={(value) => {
                                                                field.onChange(Number(value));
                                                            }}
                                                            options={returnResponsiblesData?.data || []}
                                                            optionTag={"nombre"}
                                                            disabled={isReadOnly || isSaving}
                                                        />
                                                    )}
                                                />
                                                {errors.responsable && <p className="text-red-500 text-sm mt-1">El campo es requerido</p>}
                                            </div>

                                            <div>
                                                <Label htmlFor="motivo_devolucion">Motivo de devolución *</Label>
                                                <Controller
                                                    name="motivo_devolucion"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select
                                                            disabled={isReadOnly || isSaving}
                                                            onValueChange={field.onChange} value={field.value || returnTypesData?.[0]?.id || ""}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecciona un motivo" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {
                                                                    returnTypesData && returnTypesData.map((type) => (
                                                                        <SelectItem key={type.id} value={type.id}>
                                                                            {type.label}
                                                                        </SelectItem>
                                                                    ))
                                                                }
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                                {errors.motivo_devolucion && <p className="text-red-500 text-sm mt-1">El campo es requerido</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="nroComprobante">N° Comprobante</Label>
                                                <Input
                                                    id="nroComprobante"
                                                    {...register("nro_comprobante")}
                                                    placeholder="Número de comprobante"
                                                    disabled={isReadOnly || isSaving}
                                                />
                                            </div>

                                            <div className={cn(
                                                configuraciones.formulario === "top" && "col-span-2",
                                                configuraciones.formulario === "left" && "md:col-span-2",
                                            )}>
                                                <Label htmlFor="comentarios">Comentarios</Label>
                                                <Textarea
                                                    id="comentarios"
                                                    {...register("comentarios")}
                                                    placeholder="Comentarios adicionales sobre la devolución"
                                                    rows={configuraciones.formulario === "top" ? 1 : 2}
                                                    disabled={isReadOnly || isSaving}
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
                                                        <SaleReturnList
                                                            onSaleSelect={handleSelectSale}
                                                            selectedSales={returnDetailsHook.details}
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
                                                                    onClick={openSaleDetailSelector}
                                                                    disabled={isSaleDetailSelectorOpen || isSaving || isReadOnly}
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                    <span className="hidden sm:block">Agregar Productos</span>
                                                                </Button>
                                                            )
                                                        }
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="flex-1 min-h-0">
                                                    <div className="h-full overflow-auto">
                                                        {returnDetailsHook.details.length === 0 ? (
                                                            <div className="text-center py-8 text-gray-500">
                                                                <Undo2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                                <p>No hay productos agregados</p>
                                                                <p className="text-sm">Haz clic en "Agregar" para añadir productos</p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col h-full">
                                                                <div className="flex-1 min-h-0">
                                                                    <div className="h-full overflow-auto">
                                                                        <ReturnDetailTable
                                                                            ref={tableRef}
                                                                            details={returnDetailsHook.details}
                                                                            onUpdateCantidad={returnDetailsHook.updateCantidad}
                                                                            onUpdatePrecio={returnDetailsHook.updatePrecio}
                                                                            onUpdateComentario={returnDetailsHook.updateComentario}
                                                                            onRemoveProduct={returnDetailsHook.removeProduct}
                                                                            isReadOnly={isReadOnly}
                                                                            isSaving={isSaving}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-end flex-shrink-0 items-center px-2 pt-2 border-t border-border gap-3">
                                                                    <span className="font-medium text-primary">Total:</span>
                                                                    <span className="font-bold text-emerald-600">{formatCurrency(returnDetailsHook.getTotal())}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </ResizablePanel>
                                    </ResizablePanelGroup>

                                    <Card className="border border-border shadow-none pt-3">
                                        <CardContent className="space-y-2">
                                            <footer className="flex gap-2 items-center justify-between">
                                                <span className="text-xs text-gray-500">* Campos requeridos</span>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        size={'sm'}
                                                        variant="outline"
                                                        className="w-full py-3 font-medium"
                                                        onClick={handleNewReturn}
                                                    >
                                                        Nueva Devolución
                                                    </Button>

                                                    <TooltipButton
                                                        buttonProps={{
                                                            type: 'submit',
                                                            disabled: !canSubmit || isSaving,
                                                            variant: 'default',
                                                            className: "w-full"
                                                        }}
                                                        tooltip={
                                                            !canSubmit && hasQuantityErrors ? (
                                                                <span>Corrige las cantidades inválidas</span>
                                                            ) : (
                                                                <span className="flex items-center gap-1">Registrar Devolución <ShortcutKey combo="alt+s" /></span>
                                                            )
                                                        }
                                                    >
                                                        {isSaving ? (
                                                            <>
                                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                                Procesando Devolución...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Save className="mr-2 size-4" />
                                                                Registrar Devolución
                                                            </>
                                                        )}
                                                    </TooltipButton>
                                                </div>
                                            </footer>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </FormProvider>

            <SelectSalesReturnModal
                isDialogOpen={isDialogOpen}
                onCloseDialog={handleCloseSelectDialog}
                saleId={selectedSale?.id ?? null}
                selectedProducts={returnDetailsHook.details.map(d => ({
                    almacen_out_det_id: d.almacen_out_det_id,
                    cantidad: d.cantidad,
                    comentario: d.comentario
                }))}
                onConfirm={handleConfirmModalSelections}
            />
        </main >
    );
};

export default ReturnCreateScreen;