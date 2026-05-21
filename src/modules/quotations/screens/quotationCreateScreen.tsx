import { Button } from "@/components/atoms/button";
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
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/atoms/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { Textarea } from "@/components/atoms/textarea";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import TooltipButton from "@/components/common/TooltipButton";
import { useTabEffect } from "@/hooks/tabs/useTabEffect";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useProductSelectorWindow } from "@/hooks/useSecondaryWindow";
import { cn } from "@/lib/utils";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import { useSaleCustomers } from "@/modules/sales/hooks/useSaleCustomers";
import { useSaleModalities } from "@/modules/sales/hooks/useSaleModalities";
import { useSaleResponsibles } from "@/modules/sales/hooks/useSaleResponsibles";
import { useSaleTypes } from "@/modules/sales/hooks/useSaleTypes";
import { useCartWithUtils } from "@/modules/shoppingCart/hooks/useCartWithUtils";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { parse } from "date-fns";
import { CornerUpLeft, Plus, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  type FieldErrors,
} from "react-hook-form";
import { useNavigate } from "react-router";
import ProductDetailTable, {
  type ProductDetailTableRef,
} from "../components/productDetailTable";
import QuotationsSummary from "../components/quotationsSummary";
import { useCreateQuotation } from "../hooks/useCreateQuotation";
import { QuotationCreateSchema } from "../schemas/quotationCreate.schema";
import type {
  QuotationCreate,
  QuotationDetail,
} from "../types/quotationCreate.types";
import ProductSearchPanel from "@/modules/products/components/ProductSearchPanel";
import type { SelectedItem } from "@/types/windowSelectedItems";
import { useClienteVarios } from "../hooks/useClienteVarios";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";
import { formatDateForSubmission, getTodayDate } from "@/utils/dateFormatters";
import { useTabHotkeys } from "@/hooks/tabs/useTabHotkeys";
import { useTabStore } from "@/states/tabStore";
import { convertCartToQuotationDetails } from "@/modules/shoppingCart/utils/cartCalculations";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { PERMISSIONS } from "@/lib/permissions";

const SCREEN_PATH = "/dashboard/create-quotation";

const QuotationCreateScreen = () => {
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

  const tableRef = useRef<ProductDetailTableRef>(null);

  const { data: saleTypesData } = useSaleTypes();

  const { data: saleModalitiesData } = useSaleModalities();

  const { data: saleResponsiblesData } = useSaleResponsibles();

  const {
    data: saleCustomersData,
    // isLoading: isSaleCustomersLoading
  } = useSaleCustomers();

  const { mutate: createQuotation, isPending: isSaving } = useCreateQuotation();

  const { handleError } = useErrorHandler();

  const methods = useForm<QuotationCreate>({
    resolver: zodResolver(QuotationCreateSchema),
    defaultValues: {
      fecha: getTodayDate(),
      nro_comprobante: "",
      nro_comprobante2: "",
      id_cliente: undefined,
      tipo_cotizacion: "",
      forma_cotizacion: "",
      comentarios: "",
      plazo_pago: "",
      vehiculo: "",
      nro_motor: "",
      cliente_nombre: "",
      cliente_nit: "",
      sucursal: Number(selectedBranchId) || 1,
      id_responsable: Number(user?._id) || undefined,
      detalles: [],
      cliente_contacto: "",
      cliente_telefono: "",
      anticipo: 0,
      forma_pago_anticipo: null,
      pedido: false,
    },
  });

  const {
    register,
    watch,
    reset,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = methods;

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
    addMultipleItemsWithQuantity,
    setCartMode,
    mode,
  } = useCartWithUtils(user?.name || "", selectedBranchId ?? "");

  useTabEffect(SCREEN_PATH, () => {
    if (mode !== "quote") {
      setCartMode("quote");
    }
  }, [mode, setCartMode]);

  const subtotal = getCartSubtotal();
  const total = getCartTotal();

  const formValues = watch();
  const { tipo_cotizacion, plazo_pago, id_cliente } = formValues;

  const { shouldEnableInputs } = useClienteVarios({
    currentClientId: id_cliente,
    clientes: saleCustomersData?.data,
  });

  const detalles = useMemo((): QuotationDetail[] => {
    return convertCartToQuotationDetails(items, discountPercent ?? 0);
  }, [items, discountPercent]);

  useEffect(() => {
    if (detalles.length > 0) {
      setValue("detalles", detalles);
      clearErrors("detalles");
    }
  }, [detalles, setValue, clearErrors]);

  const validateBeforeSubmit = useCallback((): boolean => {
    let isValid = true;

    if (items.length === 0) {
      setError("detalles", {
        type: "manual",
        message:
          "Debes agregar al menos un producto para realizar una cotización",
      });
      showErrorToast({
        title: "Carrito vacío",
        description:
          "Debes agregar al menos un producto para realizar una cotización",
      });
      isValid = false;
      return isValid;
    }

    if (!formValues.id_cliente) {
      setError("id_cliente", {
        type: "manual",
        message: "Debes seleccionar un cliente",
      });
      showErrorToast({
        title: "Cliente requerido",
        description: "Debes seleccionar un cliente para la cotización",
      });
      isValid = false;
    }

    if (!formValues.tipo_cotizacion) {
      setError("tipo_cotizacion", {
        type: "manual",
        message: "Debes seleccionar un tipo de cotización",
      });
      isValid = false;
    }

    if (!formValues.forma_cotizacion) {
      setError("forma_cotizacion", {
        type: "manual",
        message: "Debes seleccionar una forma de cotización",
      });
      isValid = false;
    }

    // Agregar validación adicional
    if (
      formValues.tipo_cotizacion === "VC" &&
      formValues.plazo_pago &&
      formValues.fecha
    ) {
      const fechaVenta = parse(formValues.fecha, "yyyy-MM-dd", new Date());
      fechaVenta.setHours(0, 0, 0, 0);

      const plazoDate = parse(formValues.plazo_pago, "yyyy-MM-dd", new Date());
      plazoDate.setHours(0, 0, 0, 0);

      if (plazoDate <= fechaVenta) {
        setError("plazo_pago", {
          type: "manual",
          message:
            "La fecha de plazo debe ser posterior a la fecha de cotización",
        });
        showErrorToast({
          title: "Fecha inválida",
          description:
            "La fecha de plazo debe ser posterior a la fecha de cotización",
        });
        isValid = false;
      }
    }

    return isValid;
  }, [items.length, formValues, setError]);

  // VALIDACIÓN DE FECHA DE PLAZO
  useEffect(() => {
    // Si no es cotización a crédito, limpiar y salir
    if (tipo_cotizacion !== "VC") {
      clearErrors("plazo_pago");
      return;
    }

    // Si no hay plazo_pago o no hay fecha de cotización, no validar
    if (!plazo_pago || !formValues.fecha) {
      clearErrors("plazo_pago");
      return;
    }

    // Comparar con la fecha de cotización, no con hoy
    const fechaVenta = parse(formValues.fecha, "yyyy-MM-dd", new Date());
    fechaVenta.setHours(0, 0, 0, 0);

    const plazoDate = parse(plazo_pago, "yyyy-MM-dd", new Date());
    plazoDate.setHours(0, 0, 0, 0);

    if (plazoDate <= fechaVenta) {
      setError("plazo_pago", {
        type: "manual",
        message:
          "La fecha de plazo debe ser posterior a la fecha de cotización",
      });
    } else {
      clearErrors("plazo_pago");
    }
  }, [tipo_cotizacion, plazo_pago, formValues.fecha, setError, clearErrors]);

  const handleNewQuotation = useCallback(
    (canClearCart = true) => {
      const currentValues = getValues();
      reset({
        fecha: getTodayDate(),
        nro_comprobante: "",
        nro_comprobante2: "",
        id_cliente: saleCustomersData?.data?.[0]?.id || undefined,
        tipo_cotizacion: saleTypesData?.[0]?.code || "",
        forma_cotizacion: saleModalitiesData?.[0]?.code || "",
        comentarios: "",
        plazo_pago: "",
        vehiculo: "",
        nro_motor: "",
        cliente_nombre: "",
        cliente_nit: "",
        sucursal: Number(selectedBranchId) || 1,
        id_responsable: saleResponsiblesData?.[0]?.id || undefined,
        detalles: canClearCart ? [] : currentValues.detalles,
        cliente_contacto: "",
        cliente_telefono: "",
        anticipo: 0,
        forma_pago_anticipo: null,
        pedido: false,
      });

      if (canClearCart) {
        clearCart();
      }
    },
    [getValues, reset]
  );

  // Función para agregar un solo producto
  const handleAddProductItem = (product: ProductGet) => {
    addItemToCart(product);
    setTimeout(() => {
      // Enfocar el input del producto agregado
      tableRef.current?.focusQuantityInputByProductId(product.id);
    }, 100);
  };

  // Función para agregar múltiples productos
  const handleAddMultipleProducts = (
    products: Array<ProductGet & { quantity?: number }>
  ) => {
    addMultipleItemsWithQuantity(products);

    setTimeout(() => {
      // Enfocar el primer producto nuevo que se agregó
      if (products.length > 0) {
        tableRef.current?.focusQuantityInputByProductId(products[0].id);
      } else if (products.length > 0) {
        // Si todos ya existían, enfocar el primero de la lista
        tableRef.current?.focusQuantityInputByProductId(products[0].id);
      }
    }, 100);
  };

  const onSubmit = useCallback(
    (data: QuotationCreate) => {
      if (!validateBeforeSubmit()) {
        return;
      }

      const dataToSend: QuotationCreate = {
        ...data,
        fecha: formatDateForSubmission(data.fecha),
      };

      createQuotation(dataToSend, {
        onSuccess: (createdQuotation) => {
          showSuccessToast({
            title: "Cotización Creada",
            description: `Cotización #${createdQuotation.nro} creada exitosamente`,
          });

          //   editar tab con la cotización creada
          const currentTab = tabs.find((t) => t.id === activeTabId);

          if (currentTab) {
            updateTab(currentTab.id, {
              path: `/dashboard/quotations/${createdQuotation.id}/update`,
              title: `Editar cotización: ${createdQuotation.id}`,
              createdTempData: {
                createdEntity: createdQuotation,
                fromCreate: true,
                mode: mode,
                originalPath: currentTab.path,
              },
              metadata: {
                ...currentTab.metadata,
                wasCreated: true,
                originalPath: currentTab.path,
              },
            });

            navigate(`/dashboard/quotations/${createdQuotation.id}/update`, {
              replace: true,
            });
          }
        },
        onError: (error: unknown) => {
          handleError({ error, customTitle: "No se pudo crear la cotización" });
        },
      });
    },
    [validateBeforeSubmit, createQuotation, handleError]
  );

  const onError = useCallback(
    (errors: FieldErrors<QuotationCreate>) => {
      console.log("Errores de validación:", errors);
      if (
        errors.id_cliente ||
        errors.tipo_cotizacion ||
        errors.forma_cotizacion ||
        errors.id_responsable
      ) {
        showErrorToast({
          title: "Error de validación",
          description: "Revisa los campos obligatorios del formulario",
        });
        return;
      }
      const firstErrorKey = Object.keys(errors)[0] as keyof QuotationCreate;
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
    },
    [validateBeforeSubmit]
  );

  const handleGoBack = useCallback(() => {
    navigate("/dashboard/productos");
  }, [navigate]);

  useEffect(() => {
    if (!user?._id && saleResponsiblesData && saleResponsiblesData.length > 0) {
      const firstResponsible = saleResponsiblesData[0];
      setValue("id_responsable", firstResponsible.id);
    }
  }, [saleResponsiblesData, setValue, user?._id]);

  useEffect(() => {
    const clientId = getValues("id_cliente");
    if (clientId) return;
    if (saleCustomersData?.data && saleCustomersData.data.length > 0) {
      const firstCustomer = saleCustomersData.data[0];
      setValue("id_cliente", firstCustomer.id);
    }
  }, [saleCustomersData, setValue, getValues]);

  useEffect(() => {
    if (saleTypesData && saleModalitiesData) {
      if (!getValues("tipo_cotizacion")) {
        setValue("tipo_cotizacion", saleTypesData[0].code);
      }
      if (!getValues("forma_cotizacion")) {
        setValue("forma_cotizacion", saleModalitiesData[0].code);
      }
    }
  }, [saleTypesData, saleModalitiesData, getValues, setValue]);

  const selectedItems = useMemo<SelectedItem[]>(() => {
    return detalles.map((detail) => ({
      productId: detail.id_producto || 0,
      quantity: detail.cantidad,
    }));
  }, [detalles]);

  // Hook para manejar la ventana secundaria de productos
  const productWindow = useProductSelectorWindow({
    context: "cotizacion",
    instanceId: "create-quotation",
    onProductSelect: handleAddProductItem,
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
    ],
    enabled: true,
  });
  return (
    <main className="p-2 h-full">
      <ProtectedAction
        permission={PERMISSIONS.COT.CREATE}
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
                      Presiona <Kbd>esc</Kbd> para volver a la lista de
                      productos
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
                    Nueva Cotización
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Registra una nueva cotización en el sistema
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end w-full sm:w-auto gap-2"></div>
            </div>
          </header>

          <div
            ref={containerRef}
            className="gap-2 flex-1 min-h-screen md:min-h-0"
          >
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
                  configuraciones.formulario === "top" && "grid md:grid-cols-2",
                  configuraciones.formulario === "left" && "flex flex-col"
                )}
              >
                {/* 1. Datos de la cotización */}
                <Card
                  className={cn(
                    "shadow-none bg-background",
                    configuraciones.formulario === "top" &&
                      "h-full flex-shrink-0",
                    configuraciones.formulario === "left" &&
                      "h-auto md:col-auto"
                  )}
                >
                  <CardContent className="p-2 sm:p-3">
                    <div
                      className={cn(
                        "grid gap-2",
                        configuraciones.formulario === "top" &&
                          "grid-cols-2 xl:grid-cols-3",
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
                          <p className="text-destructive text-xs">
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
                              options={saleResponsiblesData || []}
                              optionTag={"nombre"}
                              clearOnEmpty={true}
                            />
                          )}
                        />
                        {errors.id_responsable && (
                          <p className="text-destructive text-xs">
                            El campo es requerido
                          </p>
                        )}
                      </div>

                      {configuraciones.inputs && (
                        <div>
                          <Label htmlFor="forma">Forma de Cotización *</Label>
                          <Controller
                            name="forma_cotizacion"
                            control={control}
                            render={({ field }) => (
                              <Select
                                onValueChange={field.onChange}
                                value={
                                  field.value ||
                                  saleModalitiesData?.[0]?.code ||
                                  ""
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una forma" />
                                </SelectTrigger>
                                <SelectContent>
                                  {saleModalitiesData &&
                                    saleModalitiesData.map((modality) => (
                                      <SelectItem
                                        key={modality.code}
                                        value={modality.code}
                                      >
                                        {modality.label}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.forma_cotizacion && (
                            <p className="text-destructive text-xs">
                              {errors.forma_cotizacion.message}
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <Label htmlFor="tipo_cotizacion">
                          Tipo de Cotización *
                        </Label>
                        <Controller
                          name="tipo_cotizacion"
                          control={control}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={
                                field.value || saleTypesData?.[0]?.code || ""
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {saleTypesData &&
                                  saleTypesData.map((type) => (
                                    <SelectItem
                                      key={type.code}
                                      value={type.code}
                                    >
                                      {type.label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.tipo_cotizacion && (
                          <p className="text-destructive text-xs">
                            El campo es requerido
                          </p>
                        )}
                      </div>
                      {configuraciones.inputs && (
                        <div>
                          <Label htmlFor="nroComprobante">N° Comprobante</Label>
                          <Input
                            id="nroComprobante"
                            {...register("nro_comprobante")}
                            placeholder="Número de comprobante"
                          />
                        </div>
                      )}
                      {configuraciones.inputs && (
                        <div>
                          <Label htmlFor="nroComprobanteSecundario">
                            N° Comprobante Sec.
                          </Label>
                          <Input
                            id="nroComprobanteSecundario"
                            {...register("nro_comprobante2")}
                            placeholder="Comprobante secundario"
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="fechaPlazo">
                          Fecha Plazo
                          <span className="text-xs ml-1 text-muted-foreground">
                            (Crédito)
                          </span>
                        </Label>
                        <Input
                          id="fechaPlazo"
                          type="date"
                          {...register("plazo_pago")}
                          disabled={formValues.tipo_cotizacion !== "VC"}
                        />
                        {errors.plazo_pago && (
                          <p className="text-destructive text-xs">
                            {errors.plazo_pago.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="vehiculo">Vehículo/Motor</Label>
                        <Input
                          id="vehiculo"
                          {...register("vehiculo")}
                          placeholder="Modelo del vehículo"
                        />
                      </div>
                      {configuraciones.inputs && (
                        <div>
                          <Label htmlFor="motor">Motor</Label>
                          <Input
                            id="motor"
                            {...register("nro_motor")}
                            placeholder="Tipo de motor"
                          />
                        </div>
                      )}
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
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="cliente">Cliente *</Label>
                        <Controller
                          name="id_cliente"
                          control={control}
                          render={({ field }) => (
                            // <PaginatedCombobox
                            //     value={field.value}
                            //     onChange={(value) => field.onChange(Number(value))}
                            //     optionsData={saleCustomersData?.data || []}
                            //     displayField="nombre"
                            //     isLoading={isSaleCustomersLoading}
                            //     updatePage={(page) => { console.log("Update page:", page) }}
                            //     updateSearch={setCustomerSearchTerm}
                            //     placeholder="Buscar cliente por nombre"
                            //     metaData={
                            //         {
                            //             current_page: saleCustomersData?.meta.current_page || 1,
                            //             last_page: saleCustomersData?.meta.last_page || 1,
                            //             total: saleCustomersData?.meta.total || 0,
                            //             per_page: saleCustomersData?.meta.per_page || 10,
                            //         }
                            //     }
                            // />
                            <ComboboxSelect
                              value={field.value}
                              onChange={(value) =>
                                field.onChange(Number(value))
                              }
                              options={saleCustomersData?.data || []}
                              optionTag={"nombre"}
                              placeholder="Buscar cliente por nombre"
                              clearOnEmpty={true}
                            />
                          )}
                        />
                        {errors.id_cliente && (
                          <p className="text-destructive text-xs">
                            El campo es requerido
                          </p>
                        )}
                      </div>
                      {(shouldEnableInputs || configuraciones.inputs) && (
                        <div>
                          <Label htmlFor="altClie">Cliente Alt.</Label>
                          <Input
                            id="altClie"
                            {...register("cliente_nombre")}
                            placeholder="Cliente alternativo"
                          />
                        </div>
                      )}
                      {(shouldEnableInputs || configuraciones.inputs) && (
                        <div>
                          <Label htmlFor="contacto">Contacto</Label>
                          <Input
                            id="contacto"
                            {...register("cliente_contacto")}
                            placeholder="Nombre de contacto"
                          />
                        </div>
                      )}
                      {configuraciones.inputs && (
                        <div>
                          <Label htmlFor="nit">Nit</Label>
                          <Input
                            id="nit"
                            {...register("cliente_nit")}
                            placeholder="Nro de nit del cliente"
                          />
                        </div>
                      )}
                      {!configuraciones.inputs && (
                        <div>
                          <Label htmlFor="telefono">Teléfono</Label>
                          <Input
                            id="telefono"
                            {...register("cliente_telefono")}
                            placeholder="Teléfono del cliente"
                          />
                        </div>
                      )}

                      <div
                        className={cn(
                          "col-span-2",
                          (!shouldEnableInputs || configuraciones.inputs) &&
                            "col-span-full"
                        )}
                      >
                        <Label htmlFor="comentarios">Comentarios</Label>
                        <Textarea
                          id="comentarios"
                          {...register("comentarios")}
                          placeholder="Comentarios adicionales sobre la Cotización"
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
                            selectedProducts={items}
                            onProductSelect={handleAddProductItem}
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
                          <CardTitle className="flex justify-between">
                            <h2 className="text-primary text-base">
                              Detalle de Productos
                            </h2>
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
                            {items.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                <p>No hay productos agregados</p>
                                <p className="text-sm">
                                  Haz clic en "Seleccionar Productos" para
                                  agregar
                                </p>
                              </div>
                            ) : (
                              <ProductDetailTable ref={tableRef} />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </ResizablePanel>
                  </ResizablePanelGroup>

                  {/* <div className="flex flex-col flex-shrink-0"> */}
                  {/* Resumen de Cotización  */}
                  <QuotationsSummary
                    clearCart={clearCart}
                    discountAmount={discountAmount}
                    discountPercent={discountPercent}
                    subtotal={subtotal}
                    total={total}
                    isPending={isSaving}
                    callback={handleNewQuotation}
                    setDiscountAmount={setDiscountAmount}
                    setDiscountPercent={setDiscountPercent}
                    hasProducts={items.length > 0}
                  />
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

export default QuotationCreateScreen;
