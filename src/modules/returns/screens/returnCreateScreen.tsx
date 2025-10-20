import { useEffect, useState, useRef } from "react";
import { CornerUpLeft, Loader2, Save, Undo2 } from "lucide-react";
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
import { Separator } from "@/components/atoms/separator";
import type { ReturnDetailTableRef } from "../components/returnDetailTable";
import { useReturnDetails } from "../hooks/useReturnDetails";
import { useReturnTypes } from "../hooks/commons/useReturnTypes";
import { useReturnResponsibles } from "../hooks/commons/useReturnResponsibles";
import { useCreateReturn } from "../hooks/useCreateReturn";
import type { ReturnCreate } from "../types/returnCreate.types";
import { ReturnCreateSchema } from "../schemas/returnCreateSchema";
import type { SaleGetAll, SaleItemGetById } from "@/modules/sales/types/salesGetResponse";
import ReturnDetailTable from "../components/returnDetailTable";
import ResizableBox from "@/components/atoms/resizable-box";
import SaleReturnList from "../components/SalesReturnList";
import SelectSalesReturnModal from "../components/SelectSalesReturnModal";

const ReturnCreateScreen = () => {
    const navigate = useNavigate();
    const user = authSDK.getCurrentUser();
    const { selectedBranchId } = useBranchStore();
    const tableRef = useRef<ReturnDetailTableRef>(null);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
    const [selectedSale, setSelectedSale] = useState<SaleGetAll | null>(null)

    // Hook de detalles de devolución
    const returnDetailsHook = useReturnDetails();

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

    const handleCheckout = () => {
        returnDetailsHook.clearDetails();

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
                showSuccessToast({
                    title: "Devolución Exitosa",
                    description: `Devolución realizada con éxito`,
                    duration: 5000
                });
                handleCheckout();
            },
            onError: (error: unknown) => {
                handleError({ error, customTitle: "No se pudo crear la devolución" });
            }
        });
    };

    const onError = (errors: FieldErrors<ReturnCreate>) => {
        // console.log("Errores de validación:", errors);
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

    const handleNewReturn = () => {
        reset();
        returnDetailsHook.clearDetails();
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

    const handleAddProductItem = (product: SaleItemGetById, saleId: number) => {
        returnDetailsHook.addProduct(product, saleId);
        // Enfocar el primer input de cantidad después de agregar
        setTimeout(() => {
            tableRef.current?.focusFirstQuantityInput();
        }, 100);
    };

    const handleSelectSale = (selectedSale: SaleGetAll) => {
        setIsDialogOpen(true)
        setSelectedSale(selectedSale)
    }

    const handleCloseSelectDialog = () => {
        setIsDialogOpen(false)
        setSelectedSale(null)
    }

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
                <form onSubmit={handleSubmit(onSubmit, onError)} className="w-full mx-auto flex flex-col gap-2">
                    {/* Header */}
                    <header className="border-gray-200 border bg-white rounded-lg p-2 sm:px-3">
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TooltipButton
                                    tooltipContentProps={{
                                        align: 'start'
                                    }}
                                    onClick={handleGoBack}
                                    tooltip={<p className="flex items-center gap-1">Presiona <Kbd>esc</Kbd> para volver a la lista de devoluciones</p>}
                                    buttonProps={{
                                        variant: 'default',
                                        type: 'button',
                                    }}
                                >
                                    <CornerUpLeft />
                                </TooltipButton>
                                <div>
                                    <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                                        Nueva Devolución
                                    </h1>
                                    <p className="text-sm text-gray-500">Registra una nueva devolución en el sistema</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* 1. Datos de la devolucion */}
                    <Card className="shadow-none h-full">
                        <CardContent className="py-3">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-y-3 gap-x-2">
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
                                            <Select onValueChange={field.onChange} value={field.value || returnTypesData?.[0]?.id || ""}>
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
                                    />
                                </div>

                                <div className="col-span-2">
                                    <Label htmlFor="comentarios">Comentarios</Label>
                                    <Textarea
                                        id="comentarios"
                                        {...register("comentarios")}
                                        placeholder="Comentarios adicionales sobre la devolución"
                                        rows={1}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/*sales */}
                    <div className="flex-1 overflow-auto flex flex-col">
                        {/* Panel de búsqueda de productos - Superior (altura para ~5 filas) */}
                        <div className="flex-shrink-0">
                            <ResizableBox
                                direction="vertical"
                                minSize={'100px'}
                                initialSize={'350px'}
                            >
                                <SaleReturnList
                                    onSaleSelect={handleSelectSale}
                                    selectedSales={returnDetailsHook.details}
                                />
                            </ResizableBox>
                        </div>
                    </div>

                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Detalle de Devolución
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {returnDetailsHook.details.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Undo2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p>No hay productos agregados</p>
                                        <p className="text-sm">Haz clic en "Agregar" para añadir productos</p>
                                    </div>
                                ) : (
                                    <div>
                                        <ReturnDetailTable
                                            ref={tableRef}
                                            details={returnDetailsHook.details}
                                            onUpdateCantidad={returnDetailsHook.updateCantidad}
                                            onUpdatePrecio={returnDetailsHook.updatePrecio}
                                            onUpdateComentario={returnDetailsHook.updateComentario}
                                            onRemoveProduct={returnDetailsHook.removeProduct}
                                        />
                                        <Separator className="h-[0.5px]" />
                                        <div className="flex justify-between items-center px-2 pt-2">
                                            <span className="font-medium text-gray-500">Total:</span>
                                            <span className="font-bold text-emerald-600">{formatCurrency(returnDetailsHook.getTotal())}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 shadow-none pt-3">
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
                                            disabled: isSaving,
                                            variant: 'default',
                                            className: "w-full"
                                        }}
                                        tooltip={
                                            <span className="flex items-center gap-1">Registrar Devolución <ShortcutKey combo="alt+s" /></span>
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
                </form>
            </FormProvider>

            <SelectSalesReturnModal
                isDialogOpen={isDialogOpen}
                onCloseDialog={handleCloseSelectDialog}
                saleId={selectedSale?.id ?? null}
                onProductSelect={handleAddProductItem}
                selectedProducts={returnDetailsHook.getReturnDetails()}
            />
        </main>
    );
};

export default ReturnCreateScreen;