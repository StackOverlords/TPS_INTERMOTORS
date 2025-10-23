import ErrorDataComponent from "@/components/common/errorDataComponent"
import { useNavigate, useParams } from "react-router"
import TooltipButton from "@/components/common/TooltipButton"
import { CornerUpLeft, Loader2, Save, Undo2 } from "lucide-react"
import { Kbd } from "@/components/atoms/kbd"
import { Controller, FormProvider, useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Label } from "@/components/atoms/label"
import { Input } from "@/components/atoms/input"
import { ComboboxSelect } from "@/components/common/SelectCombobox"
import { useEffect, useRef, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select"
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced"
import { format } from "date-fns"
import { useHotkeys } from "react-hotkeys-hook"
import { useGoBack } from "@/hooks/useGoBack"
import { useErrorHandler } from "@/hooks/useErrorHandler"
import ShortcutKey from "@/components/common/ShortcutKey"
import { Textarea } from "@/components/atoms/textarea"
import { formatCurrency } from "@/utils/formaters"
import type { ReturnDetailTableRef } from "../components/returnDetailTable"
import { useReturnDetails } from "../hooks/useReturnDetails"
import type { ReturnUpdate, UIReturnDetailUpdate } from "../types/returnUpdate.types"
import { useReturnTypes } from "../hooks/commons/useReturnTypes"
import { useReturnResponsibles } from "../hooks/commons/useReturnResponsibles"
import { useUpdateReturn } from "../hooks/useUpdateReturn"
import { ReturnUpdateSchema } from "../schemas/returnUpdateSchema"
import { useGetReturnById } from "../hooks/useGetReturnById"
import type { SaleGetAll, SaleItemGetById } from "@/modules/sales/types/salesGetResponse"
import ReturnEditSkeleton from "../components/returnEditSkeleton"
import ResizableBox from "@/components/atoms/resizable-box"
import SaleReturnList from "../components/SalesReturnList"
import ReturnDetailTable from "../components/returnDetailTable"
import { Separator } from "@/components/atoms/separator"
import SelectSalesReturnModal from "../components/SelectSalesReturnModal"

const ReturnEditScreen = () => {
    const navigate = useNavigate()
    const { returnId } = useParams()
    const [hasInitialized, setHasInitialized] = useState<boolean>(false);
    const tableRef = useRef<ReturnDetailTableRef>(null);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
    const [selectedSale, setSelectedSale] = useState<SaleGetAll | null>(null)

    const returnDetailsHook = useReturnDetails<UIReturnDetailUpdate>(true);

    const {
        data: returnTypesData,
        isLoading: isLoadingReturnTypes,
    } = useReturnTypes()

    const {
        data: returnResponsiblesData,
        isLoading: isLoadingReturnResponsibles
    } = useReturnResponsibles()

    const {
        mutate: updateReturn,
        isPending: isSaving
    } = useUpdateReturn();

    const {
        data: returnData,
        isLoading: isLoadingReturn,
        isError: isErrorReturn
    } = useGetReturnById(Number(returnId))

    const handleGoBack = useGoBack("/dashboard/returns");
    const { handleError } = useErrorHandler()

    const formMethods = useForm<ReturnUpdate>({
        resolver: zodResolver(ReturnUpdateSchema),
        defaultValues: {
            fecha: format(new Date(), "yyyy-MM-dd"),
            nro_comprobante: "",
            motivo_devolucion: undefined,
            responsable: 1,
            comentarios: "",
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
    } = formMethods

    useEffect(() => {
        if (returnData && returnTypesData) {
            // Transformar detalles a UIReturnDetailUpdate
            const detallesUI: UIReturnDetailUpdate[] = returnData.detalles.map((detalle) => ({
                almacen_out_det_id: detalle.almacen_out_det_id,
                almacen_out_dev_det_id: detalle.id,
                cantidad: detalle.cantidad,
                precio: detalle.costo ?? 0,
                comentario: detalle.comentario ?? "",
                sale_id: 0,
                product: {
                    id: detalle.id,
                    descripcion: "",
                    codigo_oem: "",
                    codigo_upc: "",
                    precio_venta: 0,
                }
            }));

            // Establecer detalles en el hook
            returnDetailsHook.setReturnDetails(detallesUI);

            const resetData: ReturnUpdate = {
                fecha: format(returnData.fecha, "yyyy-MM-dd") ?? "",
                nro_comprobante: returnData.comprobante ?? "",
                motivo_devolucion: returnData.forma_devolucion,
                comentarios: returnData.comentarios ?? "",
                responsable: returnData.responsable?.id ?? 1,
                detalles: [],
            };
            reset(resetData);
            setHasInitialized(true);
        }
    }, [returnData, returnTypesData, reset]);

    // Sincronizar detalles con el formulario
    useEffect(() => {
        if (hasInitialized) {
            const detalles = returnDetailsHook.getReturnDetails();

            if (detalles.length > 0) {
                setValue("detalles", detalles);
                clearErrors("detalles");
            }
        }
    }, [returnDetailsHook.details, hasInitialized, setValue, clearErrors]);

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

    const onSubmit = (data: ReturnUpdate) => {
        if (!validateBeforeSubmit()) return;

        const result = ReturnUpdateSchema.safeParse(data);

        if (!result.success) {
            showErrorToast({
                title: "Datos inválidos",
                description: "Revisa los campos antes de continuar.",
                duration: 5000,
            });
            return;
        }

        const transformedData = result.data;
        updateReturn(
            { id: Number(returnId), data: transformedData },
            {
                onSuccess: () => {
                    showSuccessToast({
                        title: "Devolución Modificada",
                        description: `Devolución modificada con éxito`,
                        duration: 5000,
                    });
                    setTimeout(handleGoBack, 200);
                },
                onError: (error: unknown) => {
                    handleError({ error, customTitle: "No se pudo modificar la devolución" });
                }
            }
        );
    };

    const onError = (errors: FieldErrors<ReturnUpdate>) => {
        console.log(errors)
        if (errors.motivo_devolucion || errors.responsable) {
            showErrorToast({
                title: "Error de validación",
                description: "Revisa los campos obligatorios del formulario",
                duration: 5000
            });
            return;
        }

        if (errors.detalles) {
            showErrorToast({
                title: "Error de validación",
                description: "Revisa los items de devolución",
                duration: 5000
            });
            return;
        }
        const firstErrorKey = Object.keys(errors)[0] as keyof ReturnUpdate;
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
    })

    if (isLoadingReturn || isLoadingReturnTypes || isLoadingReturnResponsibles) {
        return <ReturnEditSkeleton />;
    }

    if (isErrorReturn || isNaN(Number(returnId))) {
        return <ErrorDataComponent
            errorMessage="No se pudo cargar la devolución."
            showButtonIcon={false}
            buttonText="Ir a lista de devoluciones"
            onRetry={() => {
                navigate("/dashboard/returns")
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
                                            Editar Devolución #{returnData?.nro}
                                        </h1>
                                        {returnData && (
                                            <p className="text-sm text-gray-600">
                                                {returnData.cantidad_detalles} {returnData.cantidad_detalles === 1 ? 'producto' : 'productos'}
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
                                                    value={field.value || returnData?.responsable?.id}
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
                                                <Select onValueChange={field.onChange} value={field.value || returnData?.forma_devolucion || ""}>
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
                    </form >
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
                </FormProvider>
            </div>
            <SelectSalesReturnModal
                isDialogOpen={isDialogOpen}
                onCloseDialog={handleCloseSelectDialog}
                saleId={selectedSale?.id ?? null}
                onProductSelect={handleAddProductItem}
                selectedProducts={returnDetailsHook.getReturnDetails()}
            />
        </main >
    );
}

export default ReturnEditScreen;