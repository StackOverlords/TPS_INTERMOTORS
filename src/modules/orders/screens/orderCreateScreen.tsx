import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { Switch } from "@/components/atoms/switch";
import {
  ArrowRightLeft,
  CornerUpLeft,
  Loader2,
  Plus,
  Save,
  ShoppingCart,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/atoms/button";
import { Kbd } from "@/components/atoms/kbd";
import { Textarea } from "@/components/atoms/textarea";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import ShortcutKey from "@/components/common/ShortcutKey";
import TooltipButton from "@/components/common/TooltipButton";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useProductSelectorWindow } from "@/hooks/useSecondaryWindow";
import { cn } from "@/lib/utils";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  FormProvider,
  useForm,
  type FieldErrors,
} from "react-hook-form";
import { useNavigate } from "react-router";
import OrderDetailTable, {
  type OrderDetailTableRef,
} from "../components/OrderDetailTable";
import { useOrderModalities } from "../hooks/commons/useOrderModalities";
import { useOrderProvider } from "../hooks/commons/useOrderProviders";
import { useOrderResponsibles } from "../hooks/commons/useOrderResponsibles";
import { useOrderStatus } from "../hooks/commons/useOrderStatus";
import { useOrderTypes } from "../hooks/commons/useOrderTypes";
import { useCreateOrder } from "../hooks/useCreateOrder";
import { useOrderDetails } from "../hooks/useOrderDetails";
import { OrderCreateSchema } from "../schemas/orderCreateSchema";
import type { OrderCreate } from "../types/orderCreate.types";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/atoms/resizable";
import ProductSearchPanel from "@/modules/products/components/ProductSearchPanel";
import type { SelectedItem } from "@/types/windowSelectedItems";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";
import { formatDateForSubmission, getTodayDate } from "@/utils/dateFormatters";
import { useTabHotkeys } from "@/hooks/tabs/useTabHotkeys";
import { useTabStore } from "@/states/tabStore";
import {
  dividePrecise,
  multiplyPrecise,
  roundTo5Decimals,
} from "@/utils/decimalUtils";
import { EditableQuantity } from "@/modules/shoppingCart/components/editableQuantity";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { PERMISSIONS } from "@/lib/permissions";

const OrderCreateScreen = () => {
  const configuraciones = {
    inputs: false,
    formulario: "top",
    selector_mode: "window",
  };
  const navigate = useNavigate();
  const tabs = useTabStore((state) => state.tabs);
  const activeTabId = useTabStore((state) => state.activeTabId);
  const updateTab = useTabStore((state) => state.updateTab);
  const user = authSDK.getCurrentUser();
  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);
  const tableRef = useRef<OrderDetailTableRef>(null);

  // Estados para conversión de moneda
  const [isUSD, setIsUSD] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(() => {
    const saved = localStorage.getItem("order_exchange_rate");
    return saved ? parseFloat(saved) : 6.96;
  });

  // Hook de detalles de orden (pasar exchangeRate)
  const orderDetailsHook = useOrderDetails(false, exchangeRate);

  const { data: orderTypesData } = useOrderTypes();

  const { data: orderModalitiesData } = useOrderModalities();

  const { data: orderResponsiblesData } = useOrderResponsibles();

  const {
    data: orderProvidersData,
    // isLoading: isOrderProvidersLoading
  } = useOrderProvider();

  const { data: orderStatusData, isLoading: isOrderStatusLoading } =
    useOrderStatus();

  const { mutate: createOrder, isPending: isSaving } = useCreateOrder();

  const { handleError } = useErrorHandler();

  const methods = useForm<OrderCreate>({
    resolver: zodResolver(OrderCreateSchema),
    defaultValues: {
      fecha: getTodayDate(),
      nro_comprobante: "",
      id_proveedor: undefined,
      tipo_pedido: "",
      forma_pedido: "",
      comentario: "",
      sucursal: Number(selectedBranchId) || 1,
      id_responsable: Number(user?._id) || undefined,
      detalles: [],
      fecha_inicio_transito: "",
      fecha_llegada: "",
      estado_actual: "",
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
    watch,
    clearErrors,
    formState: { errors },
  } = methods;

  const currentStatus = watch("estado_actual");

  // Sincronizar detalles con el formulario
  useEffect(() => {
    const detalles = orderDetailsHook.getOrderDetails();

    if (detalles.length > 0) {
      // Agregar tc_compra a cada detalle antes de sincronizar con el formulario
      const detallesWithTC = detalles.map((detalle) => ({
        ...detalle,
        tc_compra: exchangeRate,
      }));
      setValue("detalles", detallesWithTC);
      clearErrors("detalles");
    }
  }, [orderDetailsHook.details, setValue, clearErrors, exchangeRate]);

  // Validaciones de fechas según estado
  const statusesDisablingTransit = ["P", "C"];
  const statusesDisablingArrival = ["P", "C"];

  useEffect(() => {
    if (!currentStatus) return;

    // Si el estado no permite fecha de tránsito, limpiarla
    if (statusesDisablingTransit.includes(currentStatus)) {
      setValue("fecha_inicio_transito", "");
    }

    // Si el estado no permite fecha de llegada, limpiarla
    if (statusesDisablingArrival.includes(currentStatus)) {
      setValue("fecha_llegada", "");
    }
  }, [currentStatus, setValue]);

  const validateBeforeSubmit = (): boolean => {
    let isValid = true;

    if (orderDetailsHook.details.length === 0) {
      setError("detalles", {
        type: "manual",
        message: "Debes agregar al menos un producto para realizar un pedido",
      });
      showErrorToast({
        title: "Sin productos",
        description:
          "Debes agregar al menos un producto para realizar un pedido",
      });
      isValid = false;
    }

    const formData = getValues();

    if (!formData.id_proveedor) {
      setError("id_proveedor", {
        type: "manual",
        message: "Debes seleccionar un proveedor",
      });
      showErrorToast({
        title: "Proveedor requerido",
        description: "Debes seleccionar un proveedor para el pedido",
      });
      isValid = false;
    }

    if (!formData.tipo_pedido) {
      setError("tipo_pedido", {
        type: "manual",
        message: "Debes seleccionar un tipo de pedido",
      });
      isValid = false;
    }

    if (!formData.forma_pedido) {
      setError("forma_pedido", {
        type: "manual",
        message: "Debes seleccionar una forma de pedido",
      });
      isValid = false;
    }

    return isValid;
  };

  // Guardar tipo de cambio en localStorage
  useEffect(() => {
    localStorage.setItem("order_exchange_rate", exchangeRate.toString());
  }, [exchangeRate]);

  // Función para convertir entre monedas
  const handleConvertCurrency = () => {
    if (orderDetailsHook.details.length === 0) return;

    const updatedDetails = orderDetailsHook.details.map((detail) => {
      let newCosto: number;

      if (isUSD) {
        newCosto = roundTo5Decimals(
          multiplyPrecise(detail.costo, exchangeRate)
        );
      } else {
        newCosto = roundTo5Decimals(dividePrecise(detail.costo, exchangeRate));
      }

      return { ...detail, costo: newCosto };
    });

    // Aplicar los costos actualizados uno por uno para que se recalculen los precios
    updatedDetails.forEach((detail) => {
      orderDetailsHook.updateCosto(detail.id_producto, detail.costo);
    });

    setIsUSD(!isUSD); // Cambiar al estado opuesto

    showSuccessToast({
      title: "Conversión completada",
      description: `${orderDetailsHook.details.length} producto(s) convertido(s) ${isUSD ? "de USD a BOB" : "de BOB a USD"} con tipo de cambio ${exchangeRate}`,
      duration: 3000,
    });
  };

  const handleNewOrder = useCallback(
    (canClearDetails = true) => {
      const currentValues = getValues();
      reset({
        fecha: getTodayDate(),
        nro_comprobante: "",
        id_proveedor: orderProvidersData?.data?.[0]?.id || undefined,
        tipo_pedido: orderTypesData?.[0]?.id || "",
        forma_pedido: orderModalitiesData?.[0]?.id || "",
        comentario: "",
        sucursal: currentValues.sucursal,
        id_responsable: orderResponsiblesData?.data?.[0]?.id || undefined,
        detalles: canClearDetails ? [] : currentValues.detalles,
        fecha_inicio_transito: "",
        fecha_llegada: "",
        estado_actual: orderStatusData?.[0]?.id || "",
      });

      if (canClearDetails) {
        orderDetailsHook.clearDetails();
      }
    },
    [getValues, reset]
  );

  // Función para agregar un solo producto
  const handleAddProduct = (product: ProductGet) => {
    orderDetailsHook.addProduct(product);
    setTimeout(() => {
      // Enfocar el input del producto agregado
      tableRef.current?.focusQuantityInputByProductId(product.id);
    }, 100);
  };

  // Función para agregar múltiples productos
  const handleAddMultipleProducts = (
    products: Array<ProductGet & { quantity?: number }>
  ) => {
    const addedProductIds = orderDetailsHook.addMultipleProducts(products);

    setTimeout(() => {
      // Enfocar el primer producto nuevo que se agregó
      if (addedProductIds.length > 0) {
        tableRef.current?.focusQuantityInputByProductId(addedProductIds[0]);
      } else if (products.length > 0) {
        // Si todos ya existían, enfocar el primero de la lista
        tableRef.current?.focusQuantityInputByProductId(products[0].id);
      }
    }, 100);
  };

  const onSubmit = (data: OrderCreate) => {
    if (!validateBeforeSubmit()) {
      return;
    }
    if (data.fecha_inicio_transito === "") {
      data.fecha_inicio_transito = undefined;
    }

    if (data.fecha_llegada === "") {
      data.fecha_llegada = undefined;
    }

    // Agregar tc_compra (tipo de cambio) a cada detalle
    const dataWithTC = {
      ...data,
      fecha: formatDateForSubmission(data.fecha),
      detalles: data.detalles.map((detalle) => ({
        ...detalle,
        tc_compra: exchangeRate,
      })),
    };

    createOrder(dataWithTC, {
      onSuccess: (createdOrder) => {
        showSuccessToast({
          title: "Pedido Exitoso",
          description: `Pedido #${createdOrder.nro} realizado con éxito`,
        });

        const currentTab = tabs.find((t) => t.id === activeTabId);

        if (currentTab) {
          updateTab(currentTab.id, {
            path: `/dashboard/orders/${createdOrder.id}/update`,
            title: `Editar pedido: ${createdOrder.id}`,
            createdTempData: {
              createdEntity: createdOrder,
              fromCreate: true,
              originalPath: currentTab.path,
            },
            metadata: {
              ...currentTab.metadata,
              wasCreated: true,
              originalPath: currentTab.path,
            },
          });

          navigate(`/dashboard/orders/${createdOrder.id}/update`, {
            replace: true,
          });
        }
      },
      onError: (error: unknown) => {
        handleError({ error, customTitle: "No se pudo crear el pedido" });
      },
    });
  };

  const onError = (errors: FieldErrors<OrderCreate>) => {
    console.log("Errores de validación:", errors);
    if (
      errors.id_proveedor ||
      errors.tipo_pedido ||
      errors.forma_pedido ||
      errors.id_responsable
    ) {
      showErrorToast({
        title: "Error de validación",
        description: "Revisa los campos obligatorios del formulario",
      });
      return;
    }
    const firstErrorKey = Object.keys(errors)[0] as keyof OrderCreate;
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

  const handleGoBack = () => {
    navigate("/dashboard/orders");
  };

  useEffect(() => {
    if (
      !user?._id &&
      orderResponsiblesData &&
      orderResponsiblesData.data.length > 0
    ) {
      const firstResponsible = orderResponsiblesData.data[0];
      setValue("id_responsable", firstResponsible.id);
    }
  }, [orderResponsiblesData, setValue, user?._id]);

  useEffect(() => {
    const clientId = getValues("id_proveedor");
    if (clientId) return;
    if (orderProvidersData?.data && orderProvidersData.data.length > 0) {
      const firstCustomer = orderProvidersData.data[0];
      setValue("id_proveedor", firstCustomer.id);
    }
  }, [orderProvidersData, setValue, getValues]);

  useEffect(() => {
    if (orderTypesData && orderModalitiesData && orderStatusData) {
      if (!getValues("tipo_pedido")) {
        setValue("tipo_pedido", orderTypesData[0].id);
      }
      if (!getValues("forma_pedido")) {
        setValue("forma_pedido", orderModalitiesData[0].id);
      }
      if (!getValues("estado_actual")) {
        setValue("estado_actual", orderStatusData[0].id);
      }
    }
  }, [
    orderTypesData,
    orderModalitiesData,
    orderStatusData,
    getValues,
    setValue,
  ]);

  const selectedItems = useMemo<SelectedItem[]>(() => {
    return orderDetailsHook.details.map((detail) => ({
      productId: detail.id_producto || 0,
      quantity: detail.cantidad,
    }));
  }, [orderDetailsHook.details]);

  // Hook para manejar la ventana secundaria de productos
  const productWindow = useProductSelectorWindow({
    context: "pedido",
    instanceId: "create-order",
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

  const containerRef = useRef<HTMLDivElement>(null);
  useFormEnterNavigation({
    containerRef: containerRef,
    excludeSelectors: [
      ".editable-cell-input",
      '[data-table-cell="true"]',
      '[name="btn-chvron-right"]',
      '[type="submit"]',
    ],
  });

  return (
    <main className="p-2 h-full">
      <ProtectedAction
        permission={PERMISSIONS.PED.MODULE}
        roles={["Super Admin", "Administrador", "Vendedor"]}
      >
      <FormProvider {...methods}>
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
                      Presiona <Kbd>esc</Kbd> para volver a la lista de pedidos
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
                    Nuevo Pedido
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Registra un nuevo pedido en el sistema
                  </p>
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
              {/* Formulario de información de cotización*/}
              <div
                className={cn(
                  "gap-2 flex-shrink-0",
                  configuraciones.formulario === "top" && "grid md:grid-cols-3",
                  configuraciones.formulario === "left" && "flex flex-col"
                )}
              >
                {/* 1. Datos de la cotización */}
                <Card
                  className={cn(
                    "shadow-none bg-background",
                    configuraciones.formulario === "top" &&
                      "h-full flex-shrink-0 md:col-span-2",
                    configuraciones.formulario === "left" &&
                      "h-auto md:col-auto"
                  )}
                >
                  <CardContent className="p-2 sm:p-3">
                    <div
                      className={cn(
                        "grid gap-2",
                        configuraciones.formulario === "top" &&
                          "grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
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
                        />
                        {errors.fecha && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.fecha.message}
                          </p>
                        )}
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
                              options={orderResponsiblesData?.data || []}
                              optionTag={"nombre"}
                              clearOnEmpty={true}
                            />
                          )}
                        />
                        {errors.id_responsable && (
                          <p className="text-destructive text-sm mt-1">
                            El campo es requerido
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="forma">Forma de Pedido *</Label>
                        <Controller
                          name="forma_pedido"
                          control={control}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={
                                field.value ||
                                orderModalitiesData?.[0]?.id ||
                                ""
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una forma" />
                              </SelectTrigger>
                              <SelectContent>
                                {orderModalitiesData &&
                                  orderModalitiesData.map((modality) => (
                                    <SelectItem
                                      key={modality.id}
                                      value={modality.id}
                                    >
                                      {modality.label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.forma_pedido && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.forma_pedido.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="tipoCotizacion">Tipo de Pedido *</Label>
                        <Controller
                          name="tipo_pedido"
                          control={control}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={
                                field.value || orderTypesData?.[0]?.id || ""
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {orderTypesData &&
                                  orderTypesData.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.tipo_pedido && (
                          <p className="text-destructive text-sm mt-1">
                            El campo es requerido
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="fechaTransito">Fecha Tránsito</Label>
                        <Input
                          id="fechaTransito"
                          type="date"
                          {...register("fecha_inicio_transito")}
                          disabled={statusesDisablingTransit.includes(
                            currentStatus
                          )}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fechaLlegada">Fecha Llegada</Label>
                        <Input
                          id="fechaLlegada"
                          type="date"
                          {...register("fecha_llegada")}
                          disabled={statusesDisablingArrival.includes(
                            currentStatus
                          )}
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
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    "shadow-none bg-background",
                    configuraciones.formulario === "top" && "h-full",
                    configuraciones.formulario === "left" && "grow"
                  )}
                >
                  <CardContent className="p-2 sm:p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="proveedor">Proveedor *</Label>
                        <Controller
                          name="id_proveedor"
                          control={control}
                          render={({ field }) => (
                            // <PaginatedCombobox
                            //     value={field.value}
                            //     onChange={(value) => field.onChange(Number(value))}
                            //     optionsData={orderProvidersData?.data || []}
                            //     displayField="nombre"
                            //     isLoading={isOrderProvidersLoading}
                            //     updatePage={(page) => { console.log("Update page:", page) }}
                            //     updateSearch={setProviderSearchTerm}
                            //     metaData={
                            //         {
                            //             current_page: orderProvidersData?.meta?.current_page || 1,
                            //             last_page: orderProvidersData?.meta?.last_page || 1,
                            //             total: orderProvidersData?.meta?.total || 0,
                            //             per_page: orderProvidersData?.meta?.per_page || 10,
                            //         }
                            //     }
                            // />
                            <ComboboxSelect
                              value={field.value}
                              onChange={(value) => {
                                field.onChange(Number(value));
                              }}
                              options={orderProvidersData?.data || []}
                              optionTag={"nombre"}
                              clearOnEmpty={true}
                            />
                          )}
                        />
                        {errors.id_proveedor && (
                          <p className="text-destructive text-sm mt-1">
                            El campo es requerido
                          </p>
                        )}
                      </div>

                      <div>
                        <Label>Estado *</Label>
                        <Controller
                          name="estado_actual"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={
                                field.value || orderStatusData?.[0]?.id || ""
                              }
                              disabled={isOrderStatusLoading}
                              onValueChange={(value) => field.onChange(value)}
                            >
                              <SelectTrigger className={cn("space-x-2 w-full")}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className={cn("shadow-lg")}>
                                {orderStatusData
                                  ?.filter((s) => s.id !== "D")
                                  .map(({ id, label }) => (
                                    <SelectItem key={id} value={id}>
                                      {label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="col-span-full">
                        <Label htmlFor="comentario">Comentarios</Label>
                        <Textarea
                          id="comentario"
                          {...register("comentario")}
                          placeholder="Comentarios adicionales sobre el pedido"
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
                          <ProductSearchPanel
                            selectedProducts={orderDetailsHook.details}
                            onProductSelect={handleAddProduct}
                            allowExceedStock={true}
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
                          <CardTitle className="flex items-center justify-between gap-3 flex-wrap">
                            {/* Título */}
                            <h2 className="text-primary text-base">
                              Detalle de Productos
                            </h2>

                            {/* Controles de conversión de moneda - Centro */}
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
                                  orderDetailsHook.details.length === 0
                                    ? "Agrega productos para convertir"
                                    : isUSD
                                      ? `Convertir ${orderDetailsHook.details.length} producto(s) de USD a BOB`
                                      : `Convertir ${orderDetailsHook.details.length} producto(s) de BOB a USD`
                                }
                                buttonProps={{
                                  onClick: handleConvertCurrency,
                                  disabled:
                                    orderDetailsHook.details.length === 0 ||
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

                            {/* Botón de acción - Derecha */}
                            {configuraciones.selector_mode === "window" && (
                              <Button
                                type="button"
                                onClick={toggleWindowSelector}
                                disabled={isSaving}
                              >
                                <Plus className="size-4" />
                                <span className="hidden sm:block">
                                  Seleccionar Productos
                                </span>
                              </Button>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0">
                          <div className="h-full overflow-auto">
                            {orderDetailsHook.details.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                <p>No hay productos agregados</p>
                                <p className="text-sm">
                                  Haz clic en "Seleccionar Productos" para
                                  agregar
                                </p>
                              </div>
                            ) : (
                              <OrderDetailTable
                                ref={tableRef}
                                details={orderDetailsHook.details}
                                onUpdateCantidad={
                                  orderDetailsHook.updateCantidad
                                }
                                onUpdateCosto={orderDetailsHook.updateCosto}
                                onUpdatePrecioVenta={
                                  orderDetailsHook.updatePrecioVenta
                                }
                                onUpdateIncPVenta={
                                  orderDetailsHook.updateIncPVenta
                                }
                                onUpdatePrecioVentaAlt={
                                  orderDetailsHook.updatePrecioVentaAlt
                                }
                                onUpdateIncPVentaAlt={
                                  orderDetailsHook.updateIncPVentaAlt
                                }
                                onRemoveProduct={orderDetailsHook.removeProduct}
                                isSaving={isSaving}
                                isUSD={isUSD}
                                totalAmount={orderDetailsHook.getTotalCosto()}
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </ResizablePanel>
                  </ResizablePanelGroup>

                  {/* <div className="flex flex-col flex-shrink-0"> */}
                  <Card className="border border-border shadow-none pt-3">
                    <CardContent className="space-y-2">
                      <footer className="flex gap-2 items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          * Campos requeridos
                        </span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size={"sm"}
                            variant="outline"
                            className="w-full py-3 font-medium"
                            onClick={() => handleNewOrder()}
                          >
                            Nuevo Pedido
                          </Button>
                          <ProtectedAction
                              permission={PERMISSIONS.PED.CREATE}
                              roles={["Super Admin", "Administrador", "Vendedor"]}
                              fallback={
                                <TooltipButton
                                  buttonProps={{
                                    variant: "destructive",
                                    className: "w-full",
                                    disabled: true
                                  }}
                                  tooltip={
                                    <span className="flex items-center gap-1">
                                      Registrar Pedido <ShortcutKey combo="alt+s" />
                                    </span>
                                  }
                                >
                                  No tienes permisos
                                </TooltipButton>
                              }
                            >
                          <TooltipButton
                            buttonProps={{
                              type: "submit",
                              disabled:
                                isSaving ||
                                orderDetailsHook.details.length === 0,
                              variant: "default",
                              className: "w-full",
                            }}
                            tooltip={
                              <span className="flex items-center gap-1">
                                Registrar Pedido <ShortcutKey combo="alt+s" />
                              </span>
                            }
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Procesando Pedido...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 size-4" />
                                Registrar Pedido
                              </>
                            )}
                          </TooltipButton>
                          </ProtectedAction>
                        </div>
                      </footer>
                    </CardContent>
                  </Card>
                  {/* </div> */}
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

export default OrderCreateScreen;
