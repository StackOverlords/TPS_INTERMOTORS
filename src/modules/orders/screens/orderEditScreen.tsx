import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Kbd } from "@/components/atoms/kbd";
import { Label } from "@/components/atoms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { Textarea } from "@/components/atoms/textarea";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import ShortcutKey from "@/components/common/ShortcutKey";
import TooltipButton from "@/components/common/TooltipButton";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useGoBack } from "@/hooks/useGoBack";
import { cn } from "@/lib/utils";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import { formatCurrency } from "@/utils/formaters";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightLeft,
  CornerUpLeft,
  Loader2,
  Plus,
  Save,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  type FieldErrors,
} from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router";
import type { OrderDetailTableRef } from "../components/OrderDetailTable";
import OrderDetailTable from "../components/OrderDetailTable";
import OrderEditSkeleton from "../components/orderEditSkeleton";
import { useOrderModalities } from "../hooks/commons/useOrderModalities";
import { useOrderProvider } from "../hooks/commons/useOrderProviders";
import { useOrderResponsibles } from "../hooks/commons/useOrderResponsibles";
import { useOrderStatus } from "../hooks/commons/useOrderStatus";
import { useOrderTypes } from "../hooks/commons/useOrderTypes";
import { useGetOrderById } from "../hooks/useGetOrderById";
import { useOrderDetails } from "../hooks/useOrderDetails";
import { useUpdateOrder } from "../hooks/useUpdateOrder";
import { OrderUpdateSchema } from "../schemas/orderUpdateSchema";
import type {
  OrderUpdate,
  UIOrderDetailUpdate,
} from "../types/orderUpdate.types";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/atoms/resizable";
import ProductSearchPanel from "@/modules/products/components/ProductSearchPanel";
import { Button } from "@/components/atoms/button";
import type { SelectedItem } from "@/types/windowSelectedItems";
import { useProductSelectorWindow } from "@/hooks/useSecondaryWindow";
import type { OrderGetById } from "../types/orderGet.types";
import { getTodayDate } from "@/utils/dateFormatters";
import { useTabHotkeys } from "@/hooks/tabs/useTabHotkeys";
import {
  dividePrecise,
  multiplyPrecise,
  roundTo5Decimals,
} from "@/utils/decimalUtils";
import { Switch } from "@/components/atoms/switch";

const OrderEditScreen = () => {
  const configuraciones = {
    inputs: false,
    formulario: "top",
    selector_mode: "window",
  };

  const location = useLocation();
  const { tempCreatedOrder, fromCreate } =
    (location.state as {
      tempCreatedOrder?: OrderGetById;
      fromCreate?: boolean;
    }) || {};
  const [isUsingTempData, setIsUsingTempData] = useState(false);
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const tableRef = useRef<OrderDetailTableRef>(null);

  // Exchange rate state
  const [exchangeRate, setExchangeRate] = useState(() => {
    const saved = localStorage.getItem("order_exchange_rate");
    return saved ? parseFloat(saved) : 6.96;
  });

  const [isUSD, setIsUSD] = useState(false);

  // Hook de detalles de orden en modo edición
  const orderDetailsHook = useOrderDetails<UIOrderDetailUpdate>(
    true,
    exchangeRate
  );

  const { data: orderTypesData, isLoading: isLoadingOrderTypes } =
    useOrderTypes();

  const { data: orderModalitiesData, isLoading: isLoadingOrderModalities } =
    useOrderModalities();

  const { data: orderResponsiblesData, isLoading: isLoadingOrderResponsibles } =
    useOrderResponsibles();

  const {
    data: orderProvidersData,
    // isLoading: isOrderProvidersLoading
  } = useOrderProvider();

  const { data: orderStatusData, isLoading: isOrderStatusLoading } =
    useOrderStatus();

  const { mutate: updateOrder, isPending: isSaving } = useUpdateOrder();

  const {
    data: orderData,
    isLoading: isLoadingOrder,
    isError: isErrorOrder,
  } = useGetOrderById(Number(orderId));

  const handleGoBack = useGoBack("/dashboard/orders");
  const { handleError } = useErrorHandler();

  const formMethods = useForm<OrderUpdate>({
    resolver: zodResolver(OrderUpdateSchema),
    defaultValues: {
      fecha: getTodayDate(),
      nro_comprobante: "",
      id_proveedor: undefined,
      tipo_pedido: "",
      forma_pedido: "",
      comentario: "",
      id_responsable: 1,
      detalles: [],
      estado_actual: "",
      fecha_inicio_transito: "",
      fecha_llegada: "",
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
    watch,
    formState: { errors },
  } = formMethods;

  const currentStatus = watch("estado_actual");

  const loadFormData = (order: OrderGetById) => {
    // Transformar detalles a UIOrderDetailUpdate
    const detallesUI: UIOrderDetailUpdate[] = order.detalles.map(
      (detalle, index) => {
        // Si precio_venta es null, usar el precio del producto
        const precioVentaFinal =
          detalle.precio_venta !== null
            ? Number(detalle.precio_venta)
            : Number(detalle.producto.precio_venta);

        const precioVentaAltFinal =
          detalle.precio_venta_alt !== null
            ? Number(detalle.precio_venta_alt)
            : Number(detalle.producto.precio_venta_alt);

        return {
          id_detalle_pedido: detalle.id,
          id_producto: detalle.producto.id,
          cantidad: Number(detalle.cantidad),
          costo: Number(detalle.costo),
          inc_p_venta:
            detalle.inc_precio_venta !== null
              ? Number(detalle.inc_precio_venta)
              : 0,
          precio_venta: precioVentaFinal,
          inc_p_venta_alt:
            detalle.inc_precio_venta_alt !== null
              ? Number(detalle.inc_precio_venta_alt)
              : 0,
          precio_venta_alt: precioVentaAltFinal,
          orden: detalle.orden ?? index + 1,
          tc_compra: Number(detalle.tc_compra || exchangeRate),
          product: {
            id: detalle.producto.id,
            descripcion: detalle.producto.descripcion,
            codigo_oem: detalle.producto.codigo_oem,
            codigo_upc: detalle.producto.codigo_upc,
            precio_venta: Number(detalle.producto.precio_venta),
            marca: detalle.producto.marca?.marca ?? "",
            procedencia: detalle.producto?.procedencia?.procedencia ?? "",
          },
        };
      }
    );

    // Establecer detalles en el hook
    orderDetailsHook.setOrderDetails(detallesUI);
    const resetData: OrderUpdate = {
      fecha: order.fecha?.slice(0, 10) ?? "",
      nro_comprobante: order.comprobante ?? "",
      id_proveedor: order.proveedor?.id ?? 0,
      comentario: order.comentarios ?? "",
      id_responsable: order.responsable?.id ?? 1,
      detalles: [],
      tipo_pedido: order.tipo_pedido,
      forma_pedido: order.forma_pedido,
      estado_actual: order.situacion_actual,
      fecha_inicio_transito: order.fecha_transito ?? "",
      fecha_llegada: order.fecha_llegada ?? "",
    };
    reset(resetData);
    setHasInitialized(true);
  };

  useEffect(() => {
    // Si viene de crear venta, cargar datos temporales primero
    if (fromCreate && tempCreatedOrder && !hasInitialized) {
      loadFormData(tempCreatedOrder);
      setIsUsingTempData(true);

      // Limpiar el estado de navegación para evitar recargas
      window.history.replaceState({}, document.title);
    }

    // Cuando lleguen los datos reales del backend, reemplazar
    if (orderData && orderTypesData && orderModalitiesData) {
      loadFormData(orderData);
      setIsUsingTempData(false);
    }
  }, [
    orderData,
    orderTypesData,
    orderModalitiesData,
    reset,
    fromCreate,
    tempCreatedOrder,
    hasInitialized,
  ]);

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
      orderDetailsHook.updateCosto(detail.id_producto, detail.costo);
    });

    setIsUSD(!isUSD); // Cambiar al estado opuesto

    showSuccessToast({
      title: "Conversión completada",
      description: `${orderDetailsHook.details.length} producto(s) convertido(s) ${isUSD ? "de USD a BOB" : "de BOB a USD"} con tipo de cambio ${exchangeRate}`,
      duration: 3000,
    });
  };

  // Sincronizar detalles con el formulario
  useEffect(() => {
    if (hasInitialized) {
      const detalles = orderDetailsHook.getOrderDetails();

      if (detalles.length > 0) {
        setValue("detalles", detalles);
        clearErrors("detalles");
      }
    }
  }, [orderDetailsHook.details, hasInitialized, setValue, clearErrors]);

  // Validaciones de fechas según estado
  const statusesDisablingTransit = ["P", "C"];
  const statusesDisablingArrival = ["P", "C"];

  useEffect(() => {
    if (!currentStatus || !hasInitialized) return;

    // Si el estado no permite fecha de tránsito, limpiarla
    if (statusesDisablingTransit.includes(currentStatus)) {
      setValue("fecha_inicio_transito", "");
    }

    // Si el estado no permite fecha de llegada, limpiarla
    if (statusesDisablingArrival.includes(currentStatus)) {
      setValue("fecha_llegada", "");
    }
  }, [currentStatus, hasInitialized, setValue]);

  const validateBeforeSubmit = (): boolean => {
    let isValid = true;
    const formData = getValues();

    if (formData.detalles.length === 0) {
      setError("detalles", {
        type: "manual",
        message: "Debes agregar al menos un producto para realizar un pedido",
      });
      showErrorToast({
        title: "No hay productos seleccionados",
        description:
          "Debes agregar al menos un producto para realizar un pedido",
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

  const onSubmit = (data: OrderUpdate) => {
    if (!validateBeforeSubmit()) return;

    const result = OrderUpdateSchema.safeParse(data);

    if (!result.success) {
      showErrorToast({
        title: "Datos inválidos",
        description: "Revisa los campos antes de continuar.",
      });
      return;
    }

    const transformedData = result.data;
    if (transformedData.fecha_inicio_transito === "") {
      transformedData.fecha_inicio_transito = undefined;
    }

    if (transformedData.fecha_llegada === "") {
      transformedData.fecha_llegada = undefined;
    }

    updateOrder(
      { id: Number(orderId), data: transformedData },
      {
        onSuccess: () => {
          showSuccessToast({
            title: "Pedido Modificado",
            description: `Pedido modificado con éxito`,
          });
        },
        onError: (error: unknown) => {
          handleError({ error, customTitle: "No se pudo modificar el pedido" });
        },
      }
    );
  };

  const onError = (errors: FieldErrors<OrderUpdate>) => {
    console.log(errors);
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
    const firstErrorKey = Object.keys(errors)[0] as keyof OrderUpdate;
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

  const selectedItems = useMemo<SelectedItem[]>(() => {
    return orderDetailsHook.details.map((detail) => ({
      productId: detail.id_producto || 0,
      quantity: detail.cantidad,
    }));
  }, [orderDetailsHook.details]);

  // Hook para manejar la ventana secundaria de productos
  const productWindow = useProductSelectorWindow({
    context: "pedido",
    instanceId: "update-order",
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

  if (
    (isLoadingOrder ||
      isLoadingOrderTypes ||
      isLoadingOrderModalities ||
      isLoadingOrderResponsibles) &&
    !isUsingTempData
  ) {
    return <OrderEditSkeleton />;
  }

  if ((isErrorOrder || !orderData) && !isUsingTempData) {
    return (
      <div className="h-full flex items-center justify-center p-2 lg:p-8">
        <ErrorDataComponent
          className="h-full w-full"
          errorMessage="No se pudo cargar el pedido."
          showButtonIcon={false}
          buttonText="Ir a lista de pedidos"
          onRetry={() => {
            navigate("/dashboard/orders");
          }}
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
          <header className="border-border flex-shrink-0 border bg-card rounded-lg p-2 sm:px-3">
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
                    Editar pedido #
                    {isUsingTempData ? tempCreatedOrder?.nro : orderData?.nro}
                  </h1>
                  {orderData && (
                    <p className="text-sm text-gray-600">
                      {orderData.proveedor
                        ? `${orderData.proveedor.proveedor} - `
                        : ""}
                      {orderData.cantidad_detalles}{" "}
                      {orderData.cantidad_detalles === 1
                        ? "producto"
                        : "productos"}
                    </p>
                  )}
                  {isUsingTempData && (
                    <p className="text-sm text-gray-600">
                      {tempCreatedOrder?.proveedor
                        ? `${tempCreatedOrder.proveedor?.proveedor} - `
                        : ""}
                      {tempCreatedOrder?.cantidad_detalles}{" "}
                      {tempCreatedOrder?.cantidad_detalles === 1
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
                    "shadow-none",
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
                        <Label htmlFor="fecha">Fecha *</Label>
                        <Input
                          id="fecha"
                          type="date"
                          {...register("fecha")}
                          className="w-full"
                          autoFocus
                        />
                        {errors.fecha && (
                          <p className="text-red-500 text-sm mt-1">
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
                            />
                          )}
                        />
                        {errors.id_responsable && (
                          <p className="text-red-500 text-sm mt-1">
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
                                field.value || orderData?.forma_pedido || ""
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
                          <p className="text-red-500 text-sm mt-1">
                            {errors.forma_pedido.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="tipoPedido">Tipo de Pedido *</Label>
                        <Controller
                          name="tipo_pedido"
                          control={control}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={
                                field.value || orderData?.tipo_pedido || ""
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
                          <p className="text-red-500 text-sm mt-1">
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
                    "shadow-none",
                    configuraciones.formulario === "top" && "h-full",
                    configuraciones.formulario === "left" && "grow"
                  )}
                >
                  <CardContent className="p-2 sm:p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="id_proveedor">Proveedor *</Label>
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
                          <p className="text-red-500 text-sm mt-1">
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
                                field.value || orderData?.situacion_actual || ""
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
                      <Card className="shadow-none flex-1 min-h-0 overflow-hidden flex flex-col">
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
                                  className="text-xs font-medium text-gray-700"
                                >
                                  Moneda:
                                </Label>
                                <div className="flex items-center gap-2 bg-gray-50 rounded-md px-2 py-1 border border-gray-300">
                                  <span
                                    className={`text-xs font-medium ${!isUSD ? "text-green-600" : "text-gray-400"}`}
                                  >
                                    BOB
                                  </span>
                                  <Switch
                                    id="currency-switch"
                                    checked={isUSD}
                                    onCheckedChange={setIsUSD}
                                  />
                                  <span
                                    className={`text-xs font-medium ${isUSD ? "text-blue-600" : "text-gray-400"}`}
                                  >
                                    USD
                                  </span>
                                </div>
                              </div>

                              {/* Input de tipo de cambio */}
                              <div className="flex items-center gap-2">
                                <Label
                                  htmlFor="exchange-rate"
                                  className="text-xs font-medium text-gray-700 whitespace-nowrap"
                                >
                                  T.C:
                                </Label>
                                <Input
                                  id="exchange-rate"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={exchangeRate}
                                  onChange={(e) =>
                                    setExchangeRate(
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-20 h-8 text-sm"
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
                              <div className="text-center py-8 text-gray-500">
                                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No hay productos agregados</p>
                                <p className="text-sm">
                                  Haz clic en "Seleccionar Productos" para
                                  agregar
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col h-full">
                                <div className="flex-1 min-h-0">
                                  <div className="h-full overflow-auto">
                                    <OrderDetailTable
                                      ref={tableRef}
                                      details={orderDetailsHook.details}
                                      onUpdateCantidad={
                                        orderDetailsHook.updateCantidad
                                      }
                                      onUpdateCosto={
                                        orderDetailsHook.updateCosto
                                      }
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
                                      onRemoveProduct={
                                        orderDetailsHook.removeProduct
                                      }
                                      isSaving={isSaving}
                                      isEditMode={true}
                                      isUSD={isUSD}
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end flex-shrink-0 items-center px-2 pt-2 border-t border-border gap-3">
                                  <span className="font-medium text-primary">
                                    Total:
                                  </span>
                                  <span className="font-bold text-emerald-600">
                                    {formatCurrency(
                                      orderDetailsHook.getTotalCosto(),
                                      {
                                        currency: isUSD ? "USD" : "BOB",
                                        locale: isUSD ? "en-US" : "es-BO",
                                      }
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

                  {/* <div className="flex flex-col flex-shrink-0"> */}
                  <Card className="border border-border shadow-none pt-3">
                    <CardContent className="space-y-2">
                      <footer className="flex gap-2 items-center justify-between">
                        <span className="text-xs text-gray-500">
                          * Campos requeridos
                        </span>
                        <div className="flex gap-2">
                          <TooltipButton
                            onClick={handleGoBack}
                            tooltip="Cancelar Edicion"
                            buttonProps={{
                              variant: "outline",
                              size: "sm",
                              type: "button",
                            }}
                          >
                            Cancelar
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
                  {/* </div> */}
                </div>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </main>
  );
};

export default OrderEditScreen;
