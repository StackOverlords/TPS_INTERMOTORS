import { Button } from "@/components/atoms/button";
import { Card, CardContent } from "@/components/atoms/card";
import { Kbd } from "@/components/atoms/kbd";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { PERMISSIONS } from "@/lib/permissions";
import ShortcutKey from "@/components/common/ShortcutKey";
import TooltipButton from "@/components/common/TooltipButton";
import { showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import {
  useOrderSelectorWindow,
  useProductSelectorWindow,
} from "@/hooks/useSecondaryWindow";
import { useGetOrderById } from "@/modules/orders/hooks/useGetOrderById";
import { useBranchStore } from "@/states/branchStore";
import { useTabStore } from "@/states/tabStore";
import { formatDateForSubmission, getTodayDate } from "@/utils/dateFormatters";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CornerUpLeft,
  RotateCcw,
  Save,
  ShieldAlert,
  X,
  ArrowRightLeft,
  Package,
  Maximize2,
} from "lucide-react";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useCreatePurchase } from "../hooks/useCreatePurchase";
import {
  PurchaseCreateSchema,
  type PurchaseCreate,
} from "../schemas/purchaseCreate.schema";
import FormCreatePurchase from "../components/FormCreatePurchase";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import type { SelectedItem } from "@/types/windowSelectedItems";
import { Label } from "@/components/atoms/label";
import { Switch } from "@/components/atoms/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { CardHeader, CardTitle } from "@/components/atoms/card";
import type { PurchaseDetailsTableRef } from "../components/PurchaseDetailsTable";
import { usePurchaseDetails } from "../hooks/usePurchaseDetails";
import PurchaseDetailsTable from "../components/PurchaseDetailsTable";
import { EditableQuantity } from "@/modules/shoppingCart/components/editableQuantity";
import type { OrderDetailGetById } from "@/modules/orders/types/orderGet.types";
import type { PurchaseDetailUpdate } from "../schemas/purchaseUpdate.schema";

type CreationMode = "manual" | "order-import";

const CreatePurchase: React.FC = () => {
  const navigate = useNavigate();
  const branchId = useBranchStore((state) => state.selectedBranchId);
  const tableRef = useRef<PurchaseDetailsTableRef>(null);

  // Funciones de tab
  const tabs = useTabStore((state) => state.tabs);
  const activeTabId = useTabStore((state) => state.activeTabId);
  const updateTab = useTabStore((state) => state.updateTab);

  const { handleError } = useErrorHandler();

  // Estados para controlar el modo de creación
  const [creationMode, setCreationMode] = useState<CreationMode>("manual");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Estados para conversión de moneda
  const [isUSD, setIsUSD] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(() => {
    const saved = localStorage.getItem("purchase_exchange_rate");
    return saved ? parseFloat(saved) : 6.96;
  });

  // React Hook Form con Zod
  const methods = useForm<PurchaseCreate>({
    resolver: zodResolver(PurchaseCreateSchema),
    defaultValues: {
      fecha: getTodayDate(),
      nro_comprobante: "",
      nro_comprobante2: "",
      id_proveedor: 0,
      tipo_compra: "",
      forma_compra: "",
      comentario: "",
      sucursal: Number(branchId) || 1,
      id_responsable: 0,
      id_pedido: null,
      detalles: [],
      generar_movimiento_caja: false,
      forma_pago_caja: null,
    },
  });

  const { handleSubmit, watch, setValue, reset } = methods;

  const formData = watch();

  // Hook mejorado para manejar detalles
  const purchaseDetailsHook = usePurchaseDetails(false, exchangeRate);

  // Mutation para crear compra
  const { mutate: createPurchase, isPending: isSaving } = useCreatePurchase();

  // Hook para obtener detalles del pedido seleccionado
  const { data: orderData } = useGetOrderById(selectedOrderId || 0);

  // Sincronizar detalles con el formulario
  useEffect(() => {
    const details = purchaseDetailsHook.details;
    if (details.length > 0) {
      const detailsForForm = purchaseDetailsHook.getDetailsForBackend();
      setValue("detalles", detailsForForm as PurchaseDetailUpdate[]);
    }
  }, [purchaseDetailsHook.details, setValue]);

  // Guardar tipo de cambio en localStorage
  useEffect(() => {
    localStorage.setItem("purchase_exchange_rate", exchangeRate.toString());
  }, [exchangeRate]);

  // Función para convertir entre monedas
  const handleConvertCurrency = () => {
    if (purchaseDetailsHook.details.length === 0) return;

    purchaseDetailsHook.details.forEach((detail) => {
      let newCosto: number;

      if (isUSD) {
        // Convertir de USD a BOB
        newCosto = detail.costo * exchangeRate;
      } else {
        // Convertir de BOB a USD
        newCosto = detail.costo / exchangeRate;
      }

      purchaseDetailsHook.updateCosto(detail.id_producto, newCosto);
    });

    setIsUSD(!isUSD);

    showSuccessToast({
      title: "Conversión completada",
      description: `${purchaseDetailsHook.details.length} producto(s) convertido(s) ${isUSD ? "de USD a BOB" : "de BOB a USD"}`,
      duration: 3000,
    });
  };

  // Efecto para cargar detalles del pedido cuando se selecciona uno
  useEffect(() => {
    if (orderData && selectedOrderId) {
      purchaseDetailsHook.loadFromOrder(
        orderData.detalles,
        orderData.detalles.map((d: OrderDetailGetById) => d.producto)
      );

      setValue("id_pedido", selectedOrderId);
      if (orderData.proveedor?.id) {
        setValue("id_proveedor", orderData.proveedor.id);
      }
      if (orderData.responsable?.id) {
        setValue("id_responsable", orderData.responsable.id);
      }

      setCreationMode("order-import");
    }
  }, [orderData, selectedOrderId, setValue]);

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

  // Función para abrir selector de productos
  const handleOpenProductSelector = () => {
    if (creationMode === "order-import") {
      return;
    }

    if (productWindow.isOpen) {
      productWindow.close();
    }
    productWindow.open();
  };

  // Función para abrir selector de pedidos
  const handleOpenOrderSelector = () => {
    if (creationMode === "manual" && formData.detalles.length > 0) {
      return;
    }

    if (orderWindow.isOpen) {
      orderWindow.close();
    }
    orderWindow.open();
  };

  // Función para cancelar importación de pedido
  const handleCancelOrderImport = () => {
    setCreationMode("manual");
    setSelectedOrderId(null);
    purchaseDetailsHook.clearDetails();
    setValue("id_pedido", null);
  };

  // Reset form
  const handleReset = useCallback(() => {
    reset();
    purchaseDetailsHook.clearDetails();
    setCreationMode("manual");
    setSelectedOrderId(null);
  }, [reset]);

  // Submit
  const onSubmit = (data: PurchaseCreate) => {
    const detailsForBackend = purchaseDetailsHook.getDetailsForBackend();

    const dataToSend = {
      ...data,
      detalles: detailsForBackend,
      fecha: formatDateForSubmission(data.fecha),
    };

    createPurchase(dataToSend, {
      onSuccess: (createdPurchase) => {
        showSuccessToast({
          title: "Compra Creada",
          description: `Compra #${createdPurchase.nro || createdPurchase.id} creada exitosamente`,
          duration: 2000,
        });

        const currentTab = tabs.find((t) => t.id === activeTabId);

        if (currentTab) {
          updateTab(currentTab.id, {
            path: `/dashboard/purchases/${createdPurchase.id}/editar`,
            title: `Editar compra: ${createdPurchase.nro || createdPurchase.id}`,
            createdTempData: {
              createdEntity: createdPurchase,
              fromCreate: true,
              originalPath: currentTab.path,
            },
            metadata: {
              ...currentTab.metadata,
              wasCreated: true,
              originalPath: currentTab.path,
            },
          });

          navigate(`/dashboard/purchases/${createdPurchase.id}/editar`, {
            replace: true,
          });
        }

        setTimeout(() => {
          setCreationMode("manual");
          setSelectedOrderId(null);
        }, 2500);
      },
      onError: (error: unknown) => {
        handleError({ error, customTitle: "No se pudo crear la compra" });
      },
    });
  };

  // Configurar selected items para el selector
  const selectedItems: SelectedItem[] = purchaseDetailsHook.details.map(
    (detail) => ({
      productId: detail.id_producto,
      quantity: detail.cantidad,
    })
  );

  // Hook para manejar la ventana secundaria de productos
  const productWindow = useProductSelectorWindow({
    context: "purchase",
    instanceId: "create",
    onProductSelect: handleAddProduct,
    onMultiSelect: handleAddMultipleProducts,
    onlyWithStock: false,
    multiSelect: true,
    selectedItems,
  });

  // Hook para manejar la ventana secundaria de pedidos
  const orderWindow = useOrderSelectorWindow({
    context: "purchase",
    instanceId: "create",
    estado: "A",
    onOrderSelect: (data: { id: number }) => {
      setSelectedOrderId(data.id);
    },
  });

  const canAddProducts = creationMode === "manual";
  const canImportOrder =
    creationMode === "manual" && formData.detalles.length === 0;

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      <ProtectedAction
        permission={PERMISSIONS.COM.MODULE}
        roles={["Super Admin", "Administrador", "Vendedor"]}
      >
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="h-full flex flex-col gap-2"
          >
            {/* Header */}
            <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex items-center gap-3">
                  <TooltipButton
                    tooltipContentProps={{ align: "start" }}
                    onClick={handleGoBack}
                    tooltip={
                      <p>
                        Presiona <Kbd>esc</Kbd> para volver atrás
                      </p>
                    }
                    buttonProps={{ variant: "default" }}
                  >
                    <CornerUpLeft />
                  </TooltipButton>
                  <div>
                    <h1 className="text-lg font-semibold text-foreground">
                      Registrar Compra
                    </h1>
                    {creationMode === "order-import" && selectedOrderId && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        Importando desde Pedido #{selectedOrderId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <div className="gap-2 flex-1 min-h-screen md:min-h-0">
              <div className="h-full flex flex-col gap-2">
                {/* Formulario superior */}
                <div className="flex-shrink-0">
                  <FormCreatePurchase onSubmit={handleSubmit(onSubmit)} />
                </div>

                {/* Tabla de detalles */}
                <div className="flex-1 min-h-0">
                  <div className="h-full min-h-screen md:min-h-auto flex flex-col gap-2">
                    <div className="flex-1 min-h-0">
                      <Card className="shadow-none flex-1 min-h-0 overflow-hidden flex flex-col bg-background h-full">
                        <CardHeader className="flex-shrink-0">
                          <CardTitle className="flex items-center justify-between gap-3 flex-wrap">
                            {/* Título */}
                            <h2 className="text-primary text-base">
                              Detalle de Compra
                            </h2>

                            {/* Controles de conversión de moneda */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Label
                                  htmlFor="currency-switch"
                                  className="text-xs font-medium text-muted-foreground"
                                >
                                  Moneda:
                                </Label>
                                <div className="flex items-center gap-2 bg-accent/50 rounded-md px-2 py-1 border border-border">
                                  <span
                                    className={`text-xs font-medium ${!isUSD ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/50"}`}
                                  >
                                    BOB
                                  </span>
                                  <Switch
                                    id="currency-switch"
                                    checked={isUSD}
                                    onCheckedChange={setIsUSD}
                                  />
                                  <span
                                    className={`text-xs font-medium ${isUSD ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground/50"}`}
                                  >
                                    USD
                                  </span>
                                </div>
                              </div>

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
                                    purchaseDetailsHook.details.length === 0,
                                  size: "sm",
                                  variant: "default",
                                  type: "button",
                                }}
                              >
                                <ArrowRightLeft className="h-4 w-4" />
                                {isUSD ? "USD → BOB" : "BOB → USD"}
                              </TooltipButton>

                            {formData.tipo_compra === "C" && (
                              <div className="flex items-center gap-3">
                                <Switch
                                  id="generar-movimiento-caja"
                                  checked={formData.generar_movimiento_caja ?? false}
                                  onCheckedChange={(checked) => {
                                    setValue("generar_movimiento_caja", checked);
                                    if (!checked) setValue("forma_pago_caja", null);
                                  }}
                                />
                                <Label htmlFor="generar-movimiento-caja" className="text-sm cursor-pointer whitespace-nowrap">
                                  Registrar en caja
                                </Label>
                                {formData.generar_movimiento_caja && (
                                  <Select
                                    value={formData.forma_pago_caja ?? ""}
                                    onValueChange={(val) => setValue("forma_pago_caja", val)}
                                  >
                                    <SelectTrigger className="w-36 h-8 text-sm">
                                      <SelectValue placeholder="Forma de pago" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                                      <SelectItem value="TRASNF">Transferencia</SelectItem>
                                      <SelectItem value="QR">QR</SelectItem>
                                      <SelectItem value="QR-EFECT">QR + Efectivo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            )}
                            </div>

                            {/* Botones de acción */}
                            <div className="flex items-center gap-2">
                              <TooltipButton
                                tooltip={
                                  !canImportOrder
                                    ? "No puedes importar un pedido si ya hay productos agregados"
                                    : "Importar productos desde un pedido"
                                }
                                buttonProps={{
                                  type: "button",
                                  variant: "outline",
                                  size: "sm",
                                  onClick: handleOpenOrderSelector,
                                  disabled: !canImportOrder,
                                  className: "gap-2",
                                }}
                              >
                                <Maximize2 className="h-4 w-4" />
                                Importar pedido
                              </TooltipButton>

                              <TooltipButton
                                tooltip={
                                  !canAddProducts
                                    ? "No puedes agregar productos mientras importas un pedido"
                                    : "Agregar productos desde el selector"
                                }
                                buttonProps={{
                                  type: "button",
                                  variant: "default",
                                  size: "sm",
                                  onClick: handleOpenProductSelector,
                                  disabled: !canAddProducts,
                                  className: "gap-2",
                                }}
                              >
                                <Maximize2 className="h-4 w-4" />
                                Seleccionar productos
                              </TooltipButton>
                            </div>
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1 min-h-0">
                          <div className="h-full overflow-auto">
                            {purchaseDetailsHook.details.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                <p>No hay productos agregados</p>
                                <p className="text-sm">
                                  Haz clic en "Agregar Producto" para comenzar
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
                                onRemoveProduct={
                                  purchaseDetailsHook.removeProduct
                                }
                                isSaving={isSaving}
                                isUSD={isUSD}
                                totalCosto={purchaseDetailsHook.getTotalCosto()}
                                totalPrecioVenta={purchaseDetailsHook.getTotalPrecioVenta()}
                                totalPrecioVentaAlt={purchaseDetailsHook.getTotalPrecioVentaAlt()}
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Footer con botones */}
                    <Card className="border border-border shadow-none md:flex-shrink-0">
                      <CardContent className="p-2 sm:p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex gap-2">
                            {creationMode === "order-import" && (
                              <TooltipButton
                                buttonProps={{
                                  onClick: handleCancelOrderImport,
                                  disabled: isSaving,
                                  variant: "destructive",
                                }}
                                tooltip="Cancelar importación de pedido"
                              >
                                <X className="mr-2" />
                                Cancelar Importación
                              </TooltipButton>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <TooltipButton
                              buttonProps={{
                                onClick: handleReset,
                                disabled: isSaving,
                              }}
                              tooltip={
                                <span className="flex items-center gap-1">
                                  Limpiar formulario{" "}
                                  <ShortcutKey combo="ctrl+r" />
                                </span>
                              }
                            >
                              <RotateCcw className="mr-2" />
                              Limpiar
                            </TooltipButton>

                            <ProtectedAction
                              permission={PERMISSIONS.COM.CREATE}
                              roles={[
                                "Super Admin",
                                "Administrador",
                                "Vendedor",
                              ]}
                              fallback={
                                <TooltipButton
                                  buttonProps={{
                                    disabled: true,
                                    variant: "destructive",
                                  }}
                                  tooltip={
                                    <span className="flex items-center gap-1">
                                      No tienes permiso para crear compras{" "}
                                      <ShortcutKey combo="alt+s" />
                                    </span>
                                  }
                                >
                                  <ShieldAlert className="mr-2" />
                                  Crear Compra
                                </TooltipButton>
                              }
                            >
                              <Button
                                type="submit"
                                disabled={isSaving}
                                variant="default"
                              >
                                <Save className="mr-2" />
                                {isSaving ? "Guardando..." : "Crear Compra"}
                              </Button>
                            </ProtectedAction>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </FormProvider>
      </ProtectedAction>
    </main>
  );
};

export default CreatePurchase;
