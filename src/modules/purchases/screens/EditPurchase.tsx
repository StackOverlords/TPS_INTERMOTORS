import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Kbd } from "@/components/atoms/kbd";
import { Label } from "@/components/atoms/label";
import { Switch } from "@/components/atoms/switch";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import ShortcutKey from "@/components/common/ShortcutKey";
import TooltipButton from "@/components/common/TooltipButton";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useGoBack } from "@/hooks/useGoBack";
import { useProductSelectorWindow } from "@/hooks/useSecondaryWindow";
import { useTabStore } from "@/states/tabStore";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightLeft,
  CornerUpLeft,
  Loader2,
  Maximize2,
  Package,
  Save,
} from "lucide-react";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { useNavigate } from "react-router";
import FormEditPurchase from "../components/FormEditPurchase";
import type { SelectedItem } from "@/types/windowSelectedItems";
import { useUpdatePurchase } from "../hooks/useUpdatePurchase";
import {
  PurchaseUpdateSchema,
  type PurchaseUpdate,
} from "../schemas/purchaseUpdate.schema";
import { formatDateForUpdate, getTodayDate } from "@/utils/dateFormatters";
import { useTabHotkeys } from "@/hooks/tabs/useTabHotkeys";
import {
  dividePrecise,
  multiplyPrecise,
  roundTo5Decimals,
} from "@/utils/decimalUtils";
import { usePurchaseCommons } from "../hooks/usePurchaseCommons";
import type { PurchaseDetailsTableRef } from "../components/PurchaseDetailsTable";
import type { PurchaseDetail } from "../schemas/purchase.schema";
import {
  usePurchaseDetails,
  type UIPurchaseDetailUpdate,
} from "../hooks/usePurchaseDetails";
import { usePurchaseById } from "../hooks/usePurchaseById";
import PurchaseEditSkeleton from "../components/PurchaseEditSkeleton";
import PurchaseDetailsTable from "../components/PurchaseDetailsTable";
import { useDeletePurchaseDetail } from "./useDeletePurchaseDetail";
import { useValidatedRouteParam } from "@/hooks/useValidatedRouteParam";
import { useViewRendererWithTempData } from "@/hooks/useViewRendererWithTempData";
import { EditableQuantity } from "@/modules/shoppingCart/components/editableQuantity";

const EditPurchase: React.FC = () => {
  // Obtener funciones de tabstore
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const updateTab = useTabStore((s) => s.updateTab);
  const removeTab = useTabStore((s) => s.removeTab);

  const currentTab = tabs.find((t) => t.id === activeTabId);

  const tempCreatedPurchase = currentTab?.createdTempData
    ?.createdEntity as PurchaseDetail;
  const fromCreate = currentTab?.createdTempData?.fromCreate;
  const originalPath = currentTab?.createdTempData?.originalPath;

  const { value: purchaseId, isValid: isValidPurchaseId } =
    useValidatedRouteParam({
      paramName: "purchaseId",
      minValidValue: 1,
    });

  const effectivePurchaseId = useMemo(() => {
    if (fromCreate && tempCreatedPurchase?.id) {
      return tempCreatedPurchase.id;
    }
    return purchaseId ? Number(purchaseId) : null;
  }, [fromCreate, tempCreatedPurchase?.id, purchaseId]);

  const [isUsingTempData, setIsUsingTempData] = useState(false);
  const navigate = useNavigate();
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const tableRef = useRef<PurchaseDetailsTableRef>(null);

  // Exchange rate state
  const [exchangeRate, setExchangeRate] = useState(() => {
    const saved = localStorage.getItem("purchase_exchange_rate");
    return saved ? parseFloat(saved) : 6.96;
  });

  const [isUSD, setIsUSD] = useState(false);

  // Hook de detalles de compra en modo edición
  const purchaseDetailsHook = usePurchaseDetails<UIPurchaseDetailUpdate>(
    true,
    exchangeRate
  );

  // Cargar datos comunes de compras
  const { purchaseTypes, purchaseModalities, loading } = usePurchaseCommons();

  const { mutate: updatePurchase, isPending: isSaving } = useUpdatePurchase();
  const { mutate: deletePurchaseDetail, isPending: isDeleting } =
    useDeletePurchaseDetail();

  const {
    data: purchaseData,
    isLoading: isLoadingPurchase,
    isError: isErrorPurchase,
    refetch: refetchPurchase,
  } = usePurchaseById(effectivePurchaseId ?? 0);

  const { renderView } = useViewRendererWithTempData({
    queryState: {
      isLoading: isLoadingPurchase,
      isError: isErrorPurchase,
      data: purchaseData,
    },
    tempDataConfig: {
      tempData: tempCreatedPurchase,
      isUsingTempData: fromCreate && !!tempCreatedPurchase && !purchaseData,
      validateTempData: (data) => !!data?.id && !!data?.detalles,
    },
    isParamValid: isValidPurchaseId,
    additionalQueryStates: [
      {
        isLoading: loading.types,
        isError: false,
        data: purchaseTypes,
      },
      {
        isLoading: loading.modalities,
        isError: false,
        data: purchaseModalities,
      },
    ],
    SkeletonComponent: PurchaseEditSkeleton,
    ErrorComponent: ErrorDataComponent,
    errorMessage: "No se pudo cargar la compra.",
    onRetry: refetchPurchase,
  });

  const handleGoBack = useGoBack("/dashboard/purchases");
  const { handleError } = useErrorHandler();

  const formMethods = useForm<PurchaseUpdate>({
    resolver: zodResolver(PurchaseUpdateSchema),
    defaultValues: {
      fecha: getTodayDate(),
      nro_comprobante: "",
      nro_comprobante2: "",
      id_proveedor: 0,
      tipo_compra: "",
      forma_compra: "",
      comentario: "",
      id_responsable: 0,
      detalles: [],
    },
  });

  const {
    reset,
    handleSubmit,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: {},
  } = formMethods;

  const loadFormData = (purchase: PurchaseDetail) => {
    // Transformar detalles a UIPurchaseDetailUpdate
    const detallesUI: UIPurchaseDetailUpdate[] = purchase.detalles.map(
      (detalle, index) => ({
        id_detalle_compra: detalle.id,
        id_producto: detalle.producto.id,
        cantidad: Number(detalle.cantidad),
        costo: Number(detalle.costo),
        inc_p_venta: Number(detalle.inc_precio_venta || 0),
        precio_venta: Number(detalle.precio_venta),
        inc_p_venta_alt: Number(detalle.inc_precio_venta_alt || 15),
        precio_venta_alt: Number(detalle.precio_venta_alt),
        tc_compra: Number(detalle.tc_compra || exchangeRate),
        orden: index + 1,
        product: {
          id: detalle.producto.id,
          descripcion: detalle.producto.descripcion,
          codigo_oem: detalle.producto.codigo_oem ?? undefined,
          codigo_interno: detalle.producto.codigo_interno,
          codigo_upc: detalle.producto.codigo_upc ?? undefined,
          marca: detalle.producto.marca?.marca,
          categoria: detalle.producto.categoria?.categoria,
        },
      })
    );

    // Establecer detalles en el hook
    purchaseDetailsHook.setDetailsComplete(detallesUI);

    const resetData: PurchaseUpdate = {
      fecha: purchase.fecha?.slice(0, 10) ?? "",
      nro_comprobante: purchase.comprobante ?? "",
      nro_comprobante2: purchase.comprobante2 ?? "",
      id_proveedor: purchase.proveedor?.id ?? 0,
      tipo_compra: purchase.tipo_compra ?? "",
      forma_compra: purchase.forma_compra ?? "",
      comentario: purchase.comentarios ?? "",
      id_responsable: purchase.responsable?.id ?? 0,
      detalles: [],
    };

    reset(resetData);
    setHasInitialized(true);
  };

  useEffect(() => {
    // Si viene de crear compra, cargar datos temporales primero
    if (
      fromCreate &&
      tempCreatedPurchase &&
      !hasInitialized &&
      !isUsingTempData
    ) {
      loadFormData(tempCreatedPurchase);
      setIsUsingTempData(true);
    }

    // Cuando lleguen los datos reales del backend, reemplazar
    if (
      purchaseData &&
      purchaseTypes.length > 0 &&
      purchaseModalities.length > 0 &&
      !loading.types &&
      !loading.modalities
    ) {
      loadFormData(purchaseData);
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
    purchaseData,
    purchaseTypes,
    purchaseModalities,
    reset,
    fromCreate,
    tempCreatedPurchase,
    hasInitialized,
    isUsingTempData,
    loading.types,
    loading.modalities,
  ]);

  // Guardar tipo de cambio en localStorage
  useEffect(() => {
    localStorage.setItem("purchase_exchange_rate", exchangeRate.toString());
  }, [exchangeRate]);

  // Función para convertir entre monedas
  const handleConvertCurrency = () => {
    if (purchaseDetailsHook.details.length === 0) return;

    const updatedDetails = purchaseDetailsHook.details.map((detail) => {
      let newCosto: number;

      if (isUSD) {
        // Convertir USD → BOB (multiplicar)
        newCosto = roundTo5Decimals(
          multiplyPrecise(detail.costo, exchangeRate)
        );
      } else {
        // Convertir BOB → USD (dividir)
        newCosto = roundTo5Decimals(dividePrecise(detail.costo, exchangeRate));
      }

      return { ...detail, costo: newCosto };
    });

    // Aplicar los costos actualizados uno por uno para que se recalculen los precios
    updatedDetails.forEach((detail) => {
      purchaseDetailsHook.updateCosto(detail.id_producto, detail.costo);
    });

    setIsUSD(!isUSD);

    showSuccessToast({
      title: "Conversión completada",
      description: `${purchaseDetailsHook.details.length} producto(s) convertido(s) ${isUSD ? "de USD a BOB" : "de BOB a USD"} con tipo de cambio ${exchangeRate}`,
      duration: 3000,
    });
  };

  // Sincronizar detalles con el formulario
  useEffect(() => {
    if (hasInitialized) {
      const detalles = purchaseDetailsHook.getDetailsForBackend();

      if (detalles.length > 0) {
        setValue("detalles", detalles as any);
        clearErrors("detalles");
      }
    }
  }, [purchaseDetailsHook.details, hasInitialized, setValue, clearErrors]);

  const validateBeforeSubmit = (): boolean => {
    let isValid = true;
    const formData = getValues();

    if (formData.detalles.length === 0) {
      setError("detalles", {
        type: "manual",
        message: "Debes agregar al menos un producto para la compra",
      });
      showErrorToast({
        title: "No hay productos seleccionados",
        description: "Debes agregar al menos un producto para la compra",
      });
      isValid = false;
    }

    if (!formData.id_proveedor) {
      setError("id_proveedor", {
        type: "manual",
        message: "Debes seleccionar un proveedor",
      });
      showErrorToast({
        title: "Proveedor requerido",
        description: "Debes seleccionar un proveedor para la compra",
      });
      isValid = false;
    }

    return isValid;
  };

  // Función para agregar un solo producto
  const handleAddProduct = (product: ProductGet) => {
    purchaseDetailsHook.addProduct(product);
    setTimeout(() => {
      tableRef.current?.focusQuantityInputByProductId(product.id);
    }, 100);
  };

  // Función para agregar múltiples productos
  const handleAddMultipleProducts = (
    products: Array<ProductGet & { quantity?: number }>
  ) => {
    const addedProductIds = purchaseDetailsHook.addMultipleProducts(products);

    setTimeout(() => {
      if (addedProductIds.length > 0) {
        tableRef.current?.focusQuantityInputByProductId(addedProductIds[0]);
      } else if (products.length > 0) {
        tableRef.current?.focusQuantityInputByProductId(products[0].id);
      }
    }, 100);
  };

  const onSubmit = (data: PurchaseUpdate) => {
    if (!validateBeforeSubmit()) return;

    const result = PurchaseUpdateSchema.safeParse(data);

    if (!result.success) {
      showErrorToast({
        title: "Datos inválidos",
        description: "Revisa los campos antes de continuar.",
      });
      return;
    }

    const transformedData = result.data;

    const fechaOriginal =
      purchaseData?.fecha || tempCreatedPurchase?.fecha || "";
    const fechaFormateada = formatDateForUpdate(
      transformedData.fecha,
      fechaOriginal
    );

    transformedData.fecha = fechaFormateada;

    updatePurchase(
      { purchaseId: effectivePurchaseId ?? 0, data: transformedData },
      {
        onSuccess: () => {
          showSuccessToast({
            title: "Compra Modificada",
            description: `Compra modificada con éxito`,
          });
        },
        onError: (error: unknown) => {
          handleError({
            error,
            customTitle: "No se pudo modificar la compra",
          });
        },
      }
    );
  };

  const onError = (errors: FieldErrors<PurchaseUpdate>) => {
    console.log(errors);
    if (errors.id_proveedor || errors.tipo_compra || errors.forma_compra) {
      showErrorToast({
        title: "Error de validación",
        description: "Revisa los campos obligatorios del formulario",
      });
      return;
    }
    const firstErrorKey = Object.keys(errors)[0] as keyof PurchaseUpdate;
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

  // Nueva función secundaria
  const handleSecondaryAction = () => {
    if (fromCreate && originalPath && currentTab) {
      updateTab(currentTab.id, {
        path: originalPath,
        title: "Registrar Compra",
        createdTempData: undefined,
      });

      navigate(originalPath, { replace: true });
    } else {
      if (currentTab) {
        removeTab(currentTab.id);
      }
    }
  };

  const selectedItems = useMemo<SelectedItem[]>(() => {
    return purchaseDetailsHook.details.map((detail) => ({
      productId: detail.id_producto || 0,
      quantity: detail.cantidad,
    }));
  }, [purchaseDetailsHook.details]);

  // Hook para manejar la ventana secundaria de productos
  const productWindow = useProductSelectorWindow({
    context: "purchase",
    instanceId: "update-purchase",
    onProductSelect: handleAddProduct,
    onMultiSelect: handleAddMultipleProducts,
    onlyWithStock: false,
    multiSelect: true,
    selectedItems,
  });

  const toggleWindowSelector = () => {
    if (productWindow.isOpen) {
      productWindow.close();
    }
    productWindow.open();
  };

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

  useTabHotkeys("alt+s", (e) => {
    e.preventDefault();
    handleSubmit(onSubmit, onError)();
  });

  const view = renderView();
  if (view) return view;

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
                    Editar compra #
                    {isUsingTempData
                      ? tempCreatedPurchase?.nro
                      : purchaseData?.nro}
                  </h1>
                  {purchaseData && (
                    <p className="text-sm text-muted-foreground">
                      {purchaseData.proveedor
                        ? `${purchaseData.proveedor.proveedor} - `
                        : ""}
                      {purchaseData.cantidad_detalles}{" "}
                      {purchaseData.cantidad_detalles === 1
                        ? "producto"
                        : "productos"}
                    </p>
                  )}
                  {isUsingTempData && (
                    <p className="text-sm text-muted-foreground">
                      {tempCreatedPurchase?.proveedor
                        ? `${tempCreatedPurchase.proveedor?.proveedor} - `
                        : ""}
                      {tempCreatedPurchase?.cantidad_detalles}{" "}
                      {tempCreatedPurchase?.cantidad_detalles === 1
                        ? "producto"
                        : "productos"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="gap-2 flex-1 min-h-screen md:min-h-0">
            <div className="h-full gap-2 flex flex-col">
              {/* Formulario de información de compra */}
              <div className="gap-2 flex-shrink-0">
                <FormEditPurchase
                  purchaseData={
                    isUsingTempData ? tempCreatedPurchase : purchaseData
                  }
                  onSubmit={handleSubmit(onSubmit, onError)}
                />
              </div>

              <div className="flex-1 min-h-0">
                <div className="h-full min-h-screen md:min-h-auto flex flex-col gap-2">
                  {/* Tabla de productos */}
                  <Card className="shadow-none flex-1 min-h-0 overflow-hidden flex flex-col bg-background">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="flex items-center justify-between gap-3 flex-wrap">
                        {/* Título */}
                        <h2 className="text-primary text-base">
                          Detalle de Productos
                        </h2>

                        {/* Controles de conversión de moneda */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Switch de moneda */}
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor="currency-switch"
                              className="text-xs font-medium text-muted-foreground"
                            >
                              Moneda:
                            </Label>
                            <div className="flex items-center gap-2 bg-accent/30 rounded-md px-2 py-1 border border-border">
                              <span
                                className={`text-xs font-medium ${!isUSD ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/70"}`}
                              >
                                BOB
                              </span>
                              <Switch
                                id="currency-switch"
                                checked={isUSD}
                                onCheckedChange={setIsUSD}
                              />
                              <span
                                className={`text-xs font-medium ${isUSD ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground/70"}`}
                              >
                                USD
                              </span>
                            </div>
                          </div>

                          {/* Input de tipo de cambio */}
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor="exchange-rate"
                              className="text-xs font-medium text-muted-foreground whitespace-nowrap"
                            >
                              T.C:
                            </Label>
                            <EditableQuantity
                              value={exchangeRate}
                              className="w-20"
                              buttonClassName="w-20"
                              inputClassName="text-center"
                              showEditIcon={false}
                              onSubmit={(value) =>
                                setExchangeRate(
                                  parseFloat(value.toString()) || 0
                                )
                              }
                              validate={(val) => {
                                const num = parseFloat(val);
                                return !isNaN(num) && num >= 0;
                              }}
                              disabled={isSaving}
                              numberProps={{
                                step: 0.01,
                                min: 0,
                              }}
                              placeholder="6.96"
                            />
                          </div>

                          {/* Botón de conversión */}
                          <TooltipButton
                            tooltip={
                              purchaseDetailsHook.details.length === 0
                                ? "Agrega productos para convertir"
                                : isUSD
                                  ? `Convertir ${purchaseDetailsHook.details.length} producto(s) de USD a BOB`
                                  : `Convertir ${purchaseDetailsHook.details.length} producto(s) de BOB a USD`
                            }
                            buttonProps={{
                              onClick: handleConvertCurrency,
                              disabled:
                                purchaseDetailsHook.details.length === 0 ||
                                isSaving,
                              size: "sm",
                              variant: "default",
                              type: "button",
                            }}
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                            {isUSD ? "USD → BOB" : "BOB → USD"}
                          </TooltipButton>
                        </div>

                        {/* Botón de acción */}
                        <Button
                          type="button"
                          onClick={toggleWindowSelector}
                          disabled={isSaving}
                        >
                          <Maximize2 className="size-4" />
                          <span className="hidden sm:block">
                            Seleccionar Productos
                          </span>
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                      <div className="h-full overflow-auto">
                        {purchaseDetailsHook.details.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p>No hay productos agregados</p>
                            <p className="text-sm">
                              Haz clic en "Seleccionar Productos" para agregar
                            </p>
                          </div>
                        ) : (
                          <PurchaseDetailsTable
                            ref={tableRef}
                            details={purchaseDetailsHook.details}
                            onUpdateCantidad={
                              purchaseDetailsHook.updateCantidad
                            }
                            onUpdateCosto={purchaseDetailsHook.updateCosto}
                            onUpdatePrecioVenta={
                              purchaseDetailsHook.updatePrecioVenta
                            }
                            onUpdateIncPVenta={
                              purchaseDetailsHook.updateIncPVenta
                            }
                            onUpdatePrecioVentaAlt={
                              purchaseDetailsHook.updatePrecioVentaAlt
                            }
                            onUpdateIncPVentaAlt={
                              purchaseDetailsHook.updateIncPVentaAlt
                            }
                            onRemoveProduct={purchaseDetailsHook.removeProduct}
                            onDeleteDetail={deletePurchaseDetail}
                            isSaving={isSaving}
                            isDeleting={isDeleting}
                            isEditMode={true}
                            isUSD={isUSD}
                            totalCosto={purchaseDetailsHook.getTotalCosto()}
                            totalPrecioVenta={purchaseDetailsHook.getTotalPrecioVenta()}
                            totalPrecioVentaAlt={purchaseDetailsHook.getTotalPrecioVentaAlt()}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Footer con botones */}
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
                                ? "Formulario para registrar compra"
                                : "Cancelar Edición"
                            }
                            buttonProps={{
                              variant: "outline",
                              size: "sm",
                              type: "button",
                            }}
                          >
                            {fromCreate ? "Nueva Compra" : "Cancelar"}
                          </TooltipButton>

                          <TooltipButton
                            tooltip={
                              <span className="flex items-center gap-1">
                                Guardar Cambios <ShortcutKey combo="alt+s" />
                              </span>
                            }
                            buttonProps={{
                              variant: "default",
                              size: "sm",
                              type: "submit",
                              disabled: isSaving,
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
    </main>
  );
};

export default EditPurchase;
