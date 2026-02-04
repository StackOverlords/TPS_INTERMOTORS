import ErrorDataComponent from "@/components/common/errorDataComponent";
import { useNavigate, useParams } from "react-router";
import TooltipButton from "@/components/common/TooltipButton";
import { CornerUpLeft, Loader2, Plus, Save, Undo2 } from "lucide-react";
import { Kbd } from "@/components/atoms/kbd";
import {
  Controller,
  FormProvider,
  useForm,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Label } from "@/components/atoms/label";
import { Input } from "@/components/atoms/input";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "@/hooks/use-toast-enhanced";
import { useGoBack } from "@/hooks/useGoBack";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import ShortcutKey from "@/components/common/ShortcutKey";
import { Textarea } from "@/components/atoms/textarea";
import { formatCurrency } from "@/utils/formaters";
import type { ReturnDetailTableRef } from "../components/returnDetailTable";
import {
  useReturnDetails,
  type ProductChange,
} from "../hooks/useReturnDetails";
import type {
  ReturnUpdate,
  UIReturnDetailUpdate,
} from "../types/returnUpdate.types";
import { useReturnTypes } from "../hooks/commons/useReturnTypes";
import { useReturnResponsibles } from "../hooks/commons/useReturnResponsibles";
import { useUpdateReturn } from "../hooks/useUpdateReturn";
import { ReturnUpdateSchema } from "../schemas/returnUpdateSchema";
import { useGetReturnById } from "../hooks/useGetReturnById";
import type { SaleGetAll } from "@/modules/sales/types/salesGetResponse";
import ReturnEditSkeleton from "../components/returnEditSkeleton";
import SaleReturnList from "../components/SalesReturnList";
import ReturnDetailTable from "../components/returnDetailTable";
import SelectSalesReturnModal from "../components/SelectSalesReturnModal";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/atoms/resizable";
import { Button } from "@/components/atoms/button";
import { useSaleDetailSelectorWindow } from "@/hooks/useSecondaryWindow";
import type { ReturnGetById } from "../types/returnGet.types";
import { formatDateForUpdate, getTodayDate } from "@/utils/dateFormatters";
import { useTabHotkeys } from "@/hooks/tabs/useTabHotkeys";
import { useTabStore } from "@/states/tabStore";

const ReturnEditScreen = () => {
  const configuraciones = {
    inputs: false,
    formulario: "top",
    selector_mode: "window",
  };
  //   obtener funciones de tabstore
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const updateTab = useTabStore((s) => s.updateTab);
  const removeTab = useTabStore((s) => s.removeTab);

  const currentTab = tabs.find((t) => t.id === activeTabId);

  const tempCreatedReturn = currentTab?.createdTempData
    ?.createdEntity as ReturnGetById;
  const fromCreate = currentTab?.createdTempData?.fromCreate;
  const originalPath = currentTab?.createdTempData?.originalPath;

  const { returnId } = useParams();
  const effectiveReturnId = useMemo(() => {
    if (fromCreate && tempCreatedReturn?.id) {
      return tempCreatedReturn.id;
    }
    return returnId ? Number(returnId) : null;
  }, [fromCreate, tempCreatedReturn?.id, returnId]);

  const [isUsingTempData, setIsUsingTempData] = useState(false);
  const navigate = useNavigate();
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const tableRef = useRef<ReturnDetailTableRef>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedSale, setSelectedSale] = useState<SaleGetAll | null>(null);

  const returnDetailsHook = useReturnDetails<UIReturnDetailUpdate>(true);

  const { data: returnTypesData, isLoading: isLoadingReturnTypes } =
    useReturnTypes();

  const {
    data: returnResponsiblesData,
    isLoading: isLoadingReturnResponsibles,
  } = useReturnResponsibles();

  const { mutate: updateReturn, isPending: isSaving } = useUpdateReturn();

  const {
    data: returnData,
    isLoading: isLoadingReturn,
    isError: isErrorReturn,
  } = useGetReturnById(effectiveReturnId ?? 0);

  const handleGoBack = useGoBack("/dashboard/returns");
  const { handleError } = useErrorHandler();

  const formMethods = useForm<ReturnUpdate>({
    resolver: zodResolver(ReturnUpdateSchema),
    defaultValues: {
      fecha: getTodayDate(),
      nro_comprobante: "",
      motivo_devolucion: undefined,
      responsable: 1,
      comentarios: "",
      detalles: [],
    },
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
    formState: { errors },
  } = formMethods;

  const loadFormData = (returnLoadData: ReturnGetById) => {
    // Transformar detalles a UIReturnDetailUpdate
    const detallesUI: UIReturnDetailUpdate[] = returnLoadData.detalles.map(
      (detalle, index) => ({
        almacen_out_det_id: detalle.almacen_out_det_id,
        almacen_out_dev_det_id: detalle.id,
        cantidad: detalle.cantidad,
        precio: detalle.costo ?? 0,
        comentario: detalle.comentario ?? "",
        almacen_out_id: detalle.id_venta ?? 0,
        orden: detalle.orden ?? index + 1,
        sale_id: detalle.id_venta ?? 0,
        product: {
          id: detalle.id,
          descripcion: detalle.producto ?? "",
          codigo_oem: "",
          codigo_upc: "",
          precio_venta: 0,
        },
        maxQuantity: detalle.cantidad_maxima || detalle.cantidad,
      })
    );

    // Establecer detalles en el hook
    returnDetailsHook.setReturnDetails(detallesUI);

    const resetData: ReturnUpdate = {
      fecha: returnLoadData.fecha?.slice(0, 10) ?? "",
      nro_comprobante: returnLoadData.comprobante ?? "",
      motivo_devolucion: returnLoadData.forma_devolucion,
      comentarios: returnLoadData.comentarios ?? "",
      responsable: returnLoadData.responsable?.id ?? 1,
      detalles: [],
    };
    reset(resetData);
    setHasInitialized(true);
  };

  useEffect(() => {
    // Si viene de crear venta, cargar datos temporales primero
    if (
      fromCreate &&
      tempCreatedReturn &&
      !hasInitialized &&
      !isUsingTempData
    ) {
      loadFormData(tempCreatedReturn);
      setIsUsingTempData(true);
    }

    if (returnData && returnTypesData) {
      loadFormData(returnData);
      setIsUsingTempData(false);
      if (currentTab?.createdTempData) {
        updateTab(currentTab.id, {
          createdTempData: {
            ...currentTab.createdTempData,
            createdEntity: undefined,
          },
        });
      }
    }
  }, [
    returnData,
    returnTypesData,
    reset,
    fromCreate,
    tempCreatedReturn,
    hasInitialized,
  ]);

  // Validar si hay errores de cantidad (cantidades que exceden maxQuantity)
  const hasQuantityErrors = useMemo(() => {
    return returnDetailsHook.details.some(
      (detail) => detail.cantidad > detail.maxQuantity || detail.cantidad <= 0
    );
  }, [returnDetailsHook.details]);

  // Validar si el formulario está listo para enviar
  const canSubmit = useMemo(() => {
    return (
      !hasQuantityErrors && returnDetailsHook.details.length > 0 && !isSaving
    );
  }, [hasQuantityErrors, returnDetailsHook.details.length, isSaving]);

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
        message:
          "Debes agregar al menos un producto para realizar una devolución",
      });
      showErrorToast({
        title: "Sin productos",
        description:
          "Debes agregar al menos un producto para realizar una devolución",
      });
      isValid = false;
    }

    // Validar cantidades
    if (hasQuantityErrors) {
      showErrorToast({
        title: "Cantidades inválidas",
        description:
          "Algunos productos tienen cantidades que exceden el máximo permitido",
      });
      isValid = false;
    }

    const formData = getValues();

    if (!formData.motivo_devolucion) {
      setError("motivo_devolucion", {
        type: "manual",
        message: "Debes seleccionar un motivo de devolución",
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
      });
      return;
    }

    const transformedData = result.data;

    const fechaOriginal = returnData?.fecha || tempCreatedReturn?.fecha || "";
    const fechaFormateada = formatDateForUpdate(
      transformedData.fecha,
      fechaOriginal
    );

    const dataToSend = {
      ...transformedData,
      fecha: fechaFormateada,
    };

    updateReturn(
      { id: effectiveReturnId ?? 0, data: dataToSend },
      {
        onSuccess: () => {
          showSuccessToast({
            title: "Devolución Modificada",
            description: `Devolución modificada con éxito`,
          });
        },
        onError: (error: unknown) => {
          handleError({
            error,
            customTitle: "No se pudo modificar la devolución",
          });
        },
      }
    );
  };

  const onError = (errors: FieldErrors<ReturnUpdate>) => {
    if (Array.isArray(errors.detalles)) {
      const hasComentarioError = errors.detalles.some(
        (detail) => detail?.comentario
      );
      if (hasComentarioError) {
        showWarningToast({
          title: "Hay un problema en detalle de devolución",
          description: `El comentario es obligatorio para cada producto devuelto.`,
          duration: 2000,
        });
      }
    }

    if (errors.motivo_devolucion || errors.responsable) {
      showErrorToast({
        title: "Error de validación",
        description: "Revisa los campos obligatorios del formulario",
      });
      return;
    }

    if (errors.detalles) {
      showErrorToast({
        title: "Error de validación",
        description: "Revisa los items de devolución",
      });
      return;
    }
    const firstErrorKey = Object.keys(errors)[0] as keyof ReturnUpdate;
    const firstError = errors[firstErrorKey];

    if (firstError?.message) {
      showErrorToast({
        title: "Error en formulario",
        description: firstError.message,
      });
    }

    if (errors.detalles) {
      validateBeforeSubmit();
    }
  };

  //   nueva funcion secundaria
  const handleSecondaryAction = () => {
    if (fromCreate && originalPath && currentTab) {
      updateTab(currentTab.id, {
        path: originalPath,
        title: "Registrar devolución",
        createdTempData: undefined,
      });

      navigate(originalPath, { replace: true });
    } else {
      if (currentTab) {
        removeTab(currentTab.id);
      }

      // navigate('/dashboard/sales');
    }
  };

  const handleSelectSale = (selectedSale: SaleGetAll) => {
    setIsDialogOpen(true);
    setSelectedSale(selectedSale);
  };

  const handleCloseSelectDialog = () => {
    setIsDialogOpen(false);
    setSelectedSale(null);
  };

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

  const { open: openSaleDetailSelector, isOpen: isSaleDetailSelectorOpen } =
    useSaleDetailSelectorWindow({
      context: "update-return",
      mode: "edit",
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
      },
    });

  // Shortcuts
  useTabHotkeys(
    "escape",
    (e) => {
      e.preventDefault();
      handleGoBack();
    },
    {
      scopes: ["esc-key"],
      enabled: true,
    }
  );

  useTabHotkeys(
    "alt+s",
    (e) => {
      e.preventDefault();
      if (canSubmit) {
        handleSubmit(onSubmit, onError)();
      }
    },
    {
      enabled: canSubmit,
    }
  );

  if (
    (isLoadingReturn || isLoadingReturnTypes || isLoadingReturnResponsibles) &&
    !isUsingTempData
  ) {
    return <ReturnEditSkeleton />;
  }

  if ((isErrorReturn || !returnData) && !isUsingTempData) {
    return (
      <div className="h-full flex items-center justify-center p-2 lg:p-8">
        <ErrorDataComponent
          className="h-full w-full"
          errorMessage="No se pudo cargar la devolución."
          showButtonIcon={false}
          buttonText="Ir a lista de devoluciones"
          onRetry={() => navigate("/dashboard/returns")}
        />
      </div>
    );
  }

  return (
    <main className="p-2 h-full">
      <FormProvider {...formMethods}>
        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          className="h-full flex flex-col gap-2"
        >
          {/* Header */}
          <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex items-center gap-3">
                <TooltipButton
                  tooltipContentProps={{
                    align: "start",
                  }}
                  onClick={handleGoBack}
                  tooltip={
                    <p className="flex items-center gap-1">
                      Presiona <Kbd>esc</Kbd> para volver atrás
                    </p>
                  }
                  buttonProps={{
                    variant: "default",
                    type: "button",
                  }}
                >
                  <CornerUpLeft />
                </TooltipButton>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight">
                    Editar Devolución #
                    {isUsingTempData ? tempCreatedReturn?.nro : returnData?.nro}
                  </h1>
                  {returnData && (
                    <p className="text-sm text-muted-foreground">
                      {returnData.cantidad_detalles}{" "}
                      {returnData.cantidad_detalles === 1
                        ? "producto"
                        : "productos"}
                    </p>
                  )}
                  {isUsingTempData && (
                    <p className="text-sm text-muted-foreground">
                      {tempCreatedReturn?.cantidad_detalles}{" "}
                      {tempCreatedReturn?.cantidad_detalles === 1
                        ? "producto"
                        : "productos"}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end w-full sm:w-auto gap-2"></div>
            </div>
          </header>

          <div className="gap-2 flex-1 min-h-screen md:min-h-0">
            <div
              className={cn(
                "h-full gap-2",
                configuraciones.formulario === "top" && "flex flex-col",
                configuraciones.formulario === "left" &&
                  "flex flex-col md:grid md:grid-cols-3"
              )}
            >
              {/* Formulario de información de venta*/}
              <div
                className={cn(
                  "gap-2 flex-shrink-0",
                  configuraciones.formulario === "top" && "grid",
                  configuraciones.formulario === "left" && "flex flex-col"
                )}
              >
                {/* 1. Datos de la venta */}
                <Card
                  className={cn(
                    "shadow-none bg-background",
                    configuraciones.formulario === "top" &&
                      "h-full flex-shrink-0",
                    configuraciones.formulario === "left" && "h-auto md:h-full"
                  )}
                >
                  <CardContent className="p-2 sm:p-3">
                    <div
                      className={cn(
                        "grid gap-2",
                        configuraciones.formulario === "top" &&
                          "grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2",
                        configuraciones.formulario === "left" && "grid-cols-2"
                      )}
                    >
                      <div>
                        <Label htmlFor="fechaCotizacion">Fecha *</Label>
                        <Input
                          id="fechaCotizacion"
                          type="date"
                          {...register("fecha")}
                          className="w-full"
                          autoFocus
                        />
                        {errors.fecha && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.fecha.message}
                          </p>
                        )}
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
                        {errors.responsable && (
                          <p className="text-destructive text-sm mt-1">
                            El campo es requerido
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="motivo_devolucion">
                          Motivo de devolución *
                        </Label>
                        <Controller
                          name="motivo_devolucion"
                          control={control}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={
                                field.value ||
                                returnData?.forma_devolucion ||
                                ""
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un motivo" />
                              </SelectTrigger>
                              <SelectContent>
                                {returnTypesData &&
                                  returnTypesData.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.motivo_devolucion && (
                          <p className="text-destructive text-sm mt-1">
                            El campo es requerido
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="nroComprobante">N° Comprobante</Label>
                        <Input
                          id="nroComprobante"
                          {...register("nro_comprobante")}
                          placeholder="Número de comprobante"
                        />
                      </div>

                      <div
                        className={cn(
                          configuraciones.formulario === "top" && "col-span-2",
                          configuraciones.formulario === "left" &&
                            "md:col-span-2"
                        )}
                      >
                        <Label htmlFor="comentarios">Comentarios</Label>
                        <Textarea
                          id="comentarios"
                          {...register("comentarios")}
                          placeholder="Comentarios adicionales sobre la devolución"
                          rows={configuraciones.formulario === "top" ? 1 : 2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div
                className={cn(
                  "flex-1 min-h-0",
                  configuraciones.formulario === "top" && "",
                  configuraciones.formulario === "top" &&
                    configuraciones.inputs &&
                    "",
                  configuraciones.formulario === "left" && "col-span-2"
                )}
              >
                <div
                  className={cn(
                    "h-full min-h-screen md:min-h-auto flex flex-col gap-2",
                    configuraciones.selector_mode === "embebed" &&
                      "md:min-h-screen"
                  )}
                >
                  <ResizablePanelGroup
                    className={cn("flex-1 min-h-0")}
                    direction={"vertical"}
                  >
                    {configuraciones.selector_mode === "embebed" && (
                      <>
                        <ResizablePanel defaultSize={50}>
                          <SaleReturnList
                            onSaleSelect={handleSelectSale}
                            selectedSales={returnDetailsHook.details}
                          />
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                      </>
                    )}
                    <ResizablePanel
                      defaultSize={50}
                      className="h-full flex flex-col"
                    >
                      {/* 2. Productos */}
                      <Card className="shadow-none flex-1 min-h-0 overflow-hidden flex flex-col bg-background">
                        <CardHeader className="flex-shrink-0">
                          <CardTitle className="flex justify-between">
                            <h2 className="text-primary text-base">
                              Detalle de Productos
                            </h2>
                            {configuraciones.selector_mode === "window" && (
                              <Button
                                type="button"
                                onClick={openSaleDetailSelector}
                                disabled={isSaleDetailSelectorOpen || isSaving}
                              >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:block">
                                  Agregar Productos
                                </span>
                              </Button>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0">
                          <div className="h-full overflow-auto">
                            {returnDetailsHook.details.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <Undo2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                <p>No hay productos agregados</p>
                                <p className="text-sm">
                                  Haz clic en "Agregar" para añadir productos
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col h-full">
                                <div className="flex-1 min-h-0">
                                  <div className="h-full overflow-auto">
                                    <ReturnDetailTable
                                      ref={tableRef}
                                      details={returnDetailsHook.details}
                                      onUpdateCantidad={
                                        returnDetailsHook.updateCantidad
                                      }
                                      onUpdatePrecio={
                                        returnDetailsHook.updatePrecio
                                      }
                                      onUpdateComentario={
                                        returnDetailsHook.updateComentario
                                      }
                                      onRemoveProduct={
                                        returnDetailsHook.removeProduct
                                      }
                                      isSaving={isSaving}
                                      isEditMode={true}
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end flex-shrink-0 items-center px-2 pt-2 border-t border-border gap-3">
                                  <span className="font-medium text-primary">
                                    Total:
                                  </span>
                                  <span className="font-bold text-emerald-600">
                                    {formatCurrency(
                                      returnDetailsHook.getTotal()
                                    )}
                                  </span>
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
                        <span className="text-xs text-muted-foreground">
                          * Campos requeridos
                        </span>
                        <div className="flex gap-2">
                          <TooltipButton
                            onClick={handleSecondaryAction}
                            tooltip={
                              fromCreate
                                ? "Formulario para registrar devolución"
                                : "Cancelar Edicion"
                            }
                            buttonProps={{
                              variant: "outline",
                              size: "sm",
                              type: "button",
                            }}
                          >
                            {fromCreate ? "Nueva Devolución" : "Cancelar"}
                          </TooltipButton>

                          <TooltipButton
                            tooltip={
                              !canSubmit && hasQuantityErrors ? (
                                <span>Corrige las cantidades inválidas</span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  Guardar Cambios <ShortcutKey combo="alt+s" />
                                </span>
                              )
                            }
                            buttonProps={{
                              variant: "default",
                              size: "sm",
                              type: "submit",
                              disabled: !canSubmit || isSaving,
                            }}
                          >
                            {!isSaving ? (
                              <>
                                <Save className="h-4 w-4" />
                                Guardar Cambios
                              </>
                            ) : (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Guardando...
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
        selectedProducts={returnDetailsHook.details.map((d) => ({
          almacen_out_det_id: d.almacen_out_det_id,
          cantidad: d.cantidad,
          comentario: d.comentario,
        }))}
        onConfirm={handleConfirmModalSelections}
      />
    </main>
  );
};

export default ReturnEditScreen;
