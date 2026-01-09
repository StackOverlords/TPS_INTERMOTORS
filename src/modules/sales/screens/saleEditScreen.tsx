import ErrorDataComponent from "@/components/common/errorDataComponent";
import { useNavigate, useParams } from "react-router";
import { useSaleGetById } from "../hooks/useSaleGetById";
import TooltipButton from "@/components/common/TooltipButton";
import { CornerUpLeft, Plus, Printer, ShoppingCart } from "lucide-react";
import { Kbd } from "@/components/atoms/kbd";
import {
  Controller,
  FormProvider,
  useForm,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  SaleUpdate,
  SaleUpdateDetailUI,
  SaleUpdateForm,
} from "../types/saleUpdate.type";
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
import { useSaleTypes } from "../hooks/useSaleTypes";
import { useSaleModalities } from "../hooks/useSaleModalities";
import { useSaleResponsibles } from "../hooks/useSaleResponsibles";
import { useSaleCustomers } from "../hooks/useSaleCustomers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { useBranchStore } from "@/states/branchStore";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { parse } from "date-fns";
import SaleDetailsEditingTable, {
  type SaleDetailsEditingTableRef,
} from "../components/saleEdit/saleDetailsEditingTable";
import {
  SaleUpdateFormSchema,
  SaleUpdateSchema,
} from "../schemas/saleUpdate.schema";
import useSaleProductDetailsWithForm from "../hooks/useSaleProductDetails";
import { useUpdateSale } from "../hooks/useUpdateSale";
import { useGoBack } from "@/hooks/useGoBack";
import { Button } from "@/components/atoms/button";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import SaleEditSkeleton from "../components/saleEdit/saleEditSkeleton";
import { Textarea } from "@/components/atoms/textarea";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/atoms/resizable";
import ProductSearchPanel from "@/modules/products/components/ProductSearchPanel";
import { useProductSelectorWindow } from "@/hooks/useSecondaryWindow";
import SalesSummary from "../components/salesSummary";
import type { SaleGetById } from "../types/salesGetResponse";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import type { SelectedItem } from "@/types/windowSelectedItems";
import { useSalePaymentTypes } from "../hooks/useSalePaymentTypes";
import { useTabHotkeys } from "@/hooks/tabs/useTabHotkeys";
import { PDFViewer } from "@/components/common/PDFViewer";
import { useSalePDF } from "../hooks/useSalePDF";
import { useTabStore } from "@/states/tabStore";
import { formatDateForUpdate } from "@/utils/dateFormatters";

const SaleEditScreen = () => {
  const configuraciones = {
    inputs: false,
    formulario: "top",
    selector_mode: "window",
  };

  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const updateTab = useTabStore((s) => s.updateTab);

  const currentTab = tabs.find((t) => t.id === activeTabId);

  const tempCreatedSale = currentTab?.createdTempData
    ?.createdEntity as SaleGetById;
  const fromCreate = currentTab?.createdTempData?.fromCreate;

  const { saleId: saleIdParam } = useParams();
  const effectiveSaleId = useMemo(() => {
    if (fromCreate && tempCreatedSale?.id) {
      return tempCreatedSale.id;
    }
    return saleIdParam ? Number(saleIdParam) : null;
  }, [fromCreate, tempCreatedSale?.id, saleIdParam]);

  const [isReadOnly] = useState<boolean>(false);
  const navigate = useNavigate();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [originalDetails, setOriginalDetails] = useState<SaleUpdateDetailUI[]>(
    []
  );
  const [isUsingTempData, setIsUsingTempData] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const tableRef = useRef<SaleDetailsEditingTableRef>(null);

  const { data: saleTypesData, isLoading: isLoadingSaleTypes } = useSaleTypes();

  const { data: saleModalitiesData, isLoading: isLoadingSaleModalities } =
    useSaleModalities();

  const { data: salePaymentTypesData } = useSalePaymentTypes();

  const { data: saleResponsiblesData, isLoading: isLoadingSaleResponsibles } =
    useSaleResponsibles();

  const {
    data: saleCustomersData,
    // isLoading: isSaleCustomersLoading
  } = useSaleCustomers();

  const { mutate: updateSale, isPending: isSaving } = useUpdateSale();

  const {
    data: saleData,
    isLoading: isLoadingSale,
    isError: isErrorSale,
  } = useSaleGetById(effectiveSaleId ?? 0);

  const {
    data: pdfBlob,
    isLoading: isLoadingPdf,
    isError: isErrorPdf,
  } = useSalePDF(effectiveSaleId || 0, isDialogOpen && !!effectiveSaleId);

  const handleGoBack = useGoBack("/dashboard/sales");
  const { handleError } = useErrorHandler();

  const handleOpenPrintDialog = () => {
    setIsDialogOpen(true);
  };

  const handleClosePrintDialog = () => {
    setIsDialogOpen(false);
  };

  const formMethods = useForm<SaleUpdateForm>({
    resolver: zodResolver(SaleUpdateFormSchema),
    defaultValues: {
      fecha: "",
      nro_comprobante: "",
      nro_comprobante2: "",
      id_cliente: undefined,
      tipo_venta: "",
      forma_venta: "",
      forma_pago: "",
      comentario: "",
      plazo_pago: "",
      vehiculo: "",
      nro_motor: "",
      cliente_nombre: "",
      cliente_nit: "",
      sucursal: Number(selectedBranchId) || 1,
      id_responsable: undefined,
      detalles: [],
    },
  });

  const {
    register,
    watch,
    reset,
    control,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = formMethods;

  const loadFormData = (sale: SaleGetById) => {
    const detallesTransformados: SaleUpdateDetailUI[] = (
      sale.detalles ?? []
    ).map((d, index) => ({
      cantidad: d.cantidad,
      descuento: d.descuento,
      id_detalle_venta: d.id,
      id_producto: d.producto.id,
      porcentaje_descuento: d.porcentaje_descuento,
      precio: d.precio,
      orden: d.orden ?? index + 1,
      producto: {
        id: d.producto.id,
        categoria: d.producto.categoria?.categoria ?? null,
        codigo_oem: d.producto.codigo_oem ?? null,
        codigo_upc: d.producto.codigo_upc ?? null,
        descripcion: d.producto.descripcion,
        marca: d.producto.marca?.marca ?? "",
        precio_venta: d.producto.precio_venta,
        stock_actual: d.producto.stock_actual ?? 0,
      },
    }));
    // Guardar los detalles originales
    setOriginalDetails(detallesTransformados);

    const resetData: SaleUpdateForm = {
      fecha: sale.fecha?.slice(0, 10) ?? "",
      nro_comprobante2: sale.comprobante2 ?? "",
      nro_comprobante: sale.comprobante ?? "",
      id_cliente: sale.cliente?.id ?? 0,
      comentario: sale.comentarios ?? "",
      plazo_pago: sale.plazo_pago?.slice(0, 10) ?? "",
      vehiculo: sale.vehiculo ?? "",
      nro_motor: sale.nmotor ?? "",
      cliente_nombre: sale.cliente_nombre ?? "",
      cliente_nit: sale.cliente_nit ?? "",
      sucursal: Number(selectedBranchId) || 1,
      id_responsable: sale.responsable_venta?.id ?? 0,
      detalles: detallesTransformados,
      tipo_venta: sale.tipo_venta,
      forma_venta: sale.forma_venta,
      forma_pago: sale.forma_pago ?? salePaymentTypesData?.[0]?.code ?? "",
    };
    reset(resetData);
    setHasInitialized(true);
    setIsUsingTempData(false);
  };

  useEffect(() => {
    // Si viene de crear venta, cargar datos temporales primero
    if (fromCreate && !hasInitialized) {
      loadFormData(tempCreatedSale);
      setHasInitialized(true);
      setIsUsingTempData(true);
    }

    // Cuando lleguen los datos reales del backend, reemplazar
    if (
      saleData &&
      saleTypesData &&
      saleModalitiesData &&
      salePaymentTypesData
    ) {
      loadFormData(saleData);
      if (currentTab?.createdTempData) {
        updateTab(currentTab.id, {
          createdTempData: undefined, // Limpiar datos temporales
        });
      }
    }
  }, [
    saleData,
    saleTypesData,
    saleModalitiesData,
    fromCreate,
    hasInitialized,
    salePaymentTypesData,
    reset,
  ]);

  const validateBeforeSubmit = (): boolean => {
    let isValid = true;
    const formData = getValues();

    if (formData.detalles.length === 0) {
      setError("detalles", {
        type: "manual",
        message: "Debes agregar al menos un producto para realizar una venta",
      });
      showErrorToast({
        title: "No hay productos seleccionados",
        description:
          "Debes agregar al menos un producto para realizar una venta",
      });
      isValid = false;
    }

    if (!formData.id_cliente) {
      setError("id_cliente", {
        type: "manual",
        message: "Debes seleccionar un cliente",
      });
      showErrorToast({
        title: "Cliente requerido",
        description: "Debes seleccionar un cliente para la venta",
      });
      isValid = false;
    }

    if (!formData.tipo_venta) {
      setError("tipo_venta", {
        type: "manual",
        message: "Debes seleccionar un tipo de venta",
      });
      isValid = false;
    }

    if (!formData.forma_venta) {
      setError("forma_venta", {
        type: "manual",
        message: "Debes seleccionar una forma de venta",
      });
      isValid = false;
    }

    if (!formData.forma_pago) {
      setError("forma_pago", {
        type: "manual",
        message: "Debes seleccionar una forma de pago",
      });
      isValid = false;
    }

    if (formData.tipo_venta === "VC" && !formData.plazo_pago) {
      setError("plazo_pago", {
        type: "manual",
        message: "Debes especificar la fecha de plazo para venta a crédito",
      });
      showErrorToast({
        title: "Plazo requerido",
        description: "Las ventas a crédito requieren una fecha de plazo",
      });
      isValid = false;
    }

    if (formData.tipo_venta === "VC" && formData.plazo_pago && formData.fecha) {
      const fechaVenta = parse(formData.fecha, "yyyy-MM-dd", new Date());
      fechaVenta.setHours(0, 0, 0, 0);

      const plazoDate = parse(formData.plazo_pago, "yyyy-MM-dd", new Date());
      plazoDate.setHours(0, 0, 0, 0);

      if (plazoDate <= fechaVenta) {
        setError("plazo_pago", {
          type: "manual",
          message: "La fecha de plazo debe ser posterior a la fecha de venta",
        });
        showErrorToast({
          title: "Fecha inválida",
          description:
            "La fecha de plazo debe ser posterior a la fecha de venta",
        });
        isValid = false;
      }
    }

    return isValid;
  };

  const formValues = watch();
  const { tipo_venta, plazo_pago, detalles } = formValues;

  // VALIDACIÓN DE FECHA DE PLAZO
  useEffect(() => {
    if (!hasInitialized) return;

    // Si no es venta a crédito, limpiar y salir
    if (tipo_venta !== "VC") {
      clearErrors("plazo_pago");
      return;
    }

    // Si no hay plazo_pago o no hay fecha de venta, no validar
    if (!plazo_pago || !formValues.fecha) {
      clearErrors("plazo_pago");
      return;
    }

    // Comparar con la fecha de venta, no con hoy
    const fechaVenta = parse(formValues.fecha, "yyyy-MM-dd", new Date());
    fechaVenta.setHours(0, 0, 0, 0);

    const plazoDate = parse(plazo_pago, "yyyy-MM-dd", new Date());
    plazoDate.setHours(0, 0, 0, 0);

    if (plazoDate <= fechaVenta) {
      setError("plazo_pago", {
        type: "manual",
        message: "La fecha de plazo debe ser posterior a la fecha de venta",
      });
    } else {
      clearErrors("plazo_pago");
    }
  }, [
    tipo_venta,
    plazo_pago,
    formValues.fecha,
    setError,
    clearErrors,
    hasInitialized,
  ]);

  const {
    addProduct,
    removeProduct,
    updateQuantity,
    updatePrice,
    updateCustomSubtotal,
    applyGlobalDiscount,
    calculateTotal,
    calculateTotalDiscount,
    calculateTotalBeforeDiscount,
    getDiscountPercentage,
    addMultipleItemsWithQuantity,
  } = useSaleProductDetailsWithForm({
    formMethods,
    originalDetails,
  });

  // Función para agregar un solo producto
  const handleAddProductItem = (product: ProductGet) => {
    addProduct(product);
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

  const onSubmit = (data: SaleUpdate) => {
    if (!validateBeforeSubmit()) return;

    const result = SaleUpdateSchema.safeParse(data);

    if (!result.success) {
      showErrorToast({
        title: "Datos inválidos",
        description: "Revisa los campos antes de continuar.",
      });
      return;
    }

    const transformedData = result.data;

    const fechaOriginal = saleData?.fecha || tempCreatedSale?.fecha || "";
    const fechaFormateada = formatDateForUpdate(
      transformedData.fecha,
      fechaOriginal
    );

    const dataToSend = {
      ...transformedData,
      fecha: fechaFormateada,
    };

    updateSale(
      { saleId: effectiveSaleId ?? 0, data: dataToSend },
      {
        onSuccess: (updatedData) => {
          showSuccessToast({
            title: "Venta Modificada",
            description: `Venta modificada con éxito`,
          });
          loadFormData(updatedData);
        },
        onError: (error: unknown) => {
          handleError({ error, customTitle: "No se pudo modificar la venta" });
        },
      }
    );
  };

  const onError = (errors: FieldErrors<SaleUpdateForm>) => {
    // console.log(errors)
    if (
      errors.id_cliente ||
      errors.tipo_venta ||
      errors.forma_venta ||
      errors.id_responsable
    ) {
      showErrorToast({
        title: "Error de validación",
        description: "Revisa los campos obligatorios del formulario",
      });
      return;
    }
    const firstErrorKey = Object.keys(errors)[0] as keyof SaleUpdateForm;
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

  // Convertir detalles actuales a SelectedItems
  const selectedItems = useMemo<SelectedItem[]>(() => {
    return detalles.map((detail) => ({
      productId: detail.producto?.id || 0,
      quantity: detail.cantidad,
    }));
  }, [detalles]);

  // Hook para manejar la ventana secundaria de productos
  const productWindow = useProductSelectorWindow({
    context: "venta",
    instanceId: "update-sale",
    onProductSelect: handleAddProductItem,
    onMultiSelect: handleAddMultipleProducts,
    onlyWithStock: true,
    multiSelect: true,
    mode: "edit", // Modo edición
    validateStock: true, // ✅ Valida stock
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
    (isLoadingSale ||
      isLoadingSaleTypes ||
      isLoadingSaleModalities ||
      isLoadingSaleResponsibles) &&
    !isUsingTempData
  ) {
    return <SaleEditSkeleton />;
  }

  if ((isErrorSale || !saleData) && !isUsingTempData && !fromCreate) {
    return (
      <div className="h-full flex items-center justify-center p-2 lg:p-8">
        <ErrorDataComponent
          className="h-full w-full"
          errorMessage="No se pudo cargar la venta."
          showButtonIcon={false}
          buttonText="Ir a lista de ventas"
          onRetry={() => {
            navigate("/dashboard/sales");
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
                    Editar venta #
                    {isUsingTempData ? tempCreatedSale?.nro : saleData?.nro}
                  </h1>
                  {saleData && (
                    <p className="text-sm text-gray-600">
                      {saleData.cliente
                        ? `${saleData.cliente?.cliente} - `
                        : ""}
                      {saleData.cantidad_detalles}{" "}
                      {saleData.cantidad_detalles === 1
                        ? "producto"
                        : "productos"}
                    </p>
                  )}
                  {isUsingTempData && (
                    <p className="text-sm text-gray-600">
                      {tempCreatedSale?.cliente
                        ? `${tempCreatedSale.cliente?.cliente} - `
                        : ""}
                      {tempCreatedSale?.cantidad_detalles}{" "}
                      {tempCreatedSale?.cantidad_detalles === 1
                        ? "producto"
                        : "productos"}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end w-full sm:w-auto gap-2">
                <TooltipButton
                  onClick={handleOpenPrintDialog}
                  tooltip={
                    isDirty
                      ? "Los cambios no guardados no se reflejarán en la impresión"
                      : "Imprimir venta"
                  }
                  buttonProps={{
                    variant: isDirty ? "outline" : "default",
                  }}
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                  {isDirty && <span className="text-xs">(sin cambios)</span>}
                </TooltipButton>
              </div>
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
                    "shadow-none",
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
                          "grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 xl:gap-x-2 xl:gap-y-2",
                        configuraciones.formulario === "left" && "grid-cols-2"
                      )}
                    >
                      <div>
                        <Label htmlFor="fechaVenta">Fecha *</Label>
                        <Input
                          id="fechaVenta"
                          type="date"
                          {...register("fecha")}
                          className="w-full"
                          autoFocus
                          disabled={isReadOnly}
                        />
                        {errors.fecha && (
                          <p className="text-red-500 text-xs">
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
                              disabled={isReadOnly}
                            />
                          )}
                        />
                        {errors.id_responsable && (
                          <p className="text-red-500 text-xs">
                            El campo es requerido
                          </p>
                        )}
                      </div>
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
                            //     disabled={isReadOnly}
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
                              onChange={(value) => {
                                field.onChange(Number(value));
                              }}
                              options={saleCustomersData?.data || []}
                              optionTag={"nombre"}
                              disabled={isReadOnly}
                              clearOnEmpty={true}
                              placeholder="Buscar cliente por nombre"
                            />
                          )}
                        />
                        {errors.id_cliente && (
                          <p className="text-red-500 text-xs">
                            El campo es requerido
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="altClie">Cliente Alt.</Label>
                        <Input
                          id="altClie"
                          {...register("cliente_nombre")}
                          placeholder="Cliente alternativo"
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cliente_nit">Nit Cliente</Label>
                        <Input
                          id="cliente_nit"
                          {...register("cliente_nit")}
                          placeholder="Nit del Cliente"
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nroComprobante">N° Comprobante</Label>
                        <Input
                          id="nroComprobante"
                          {...register("nro_comprobante")}
                          placeholder="Número de comprobante"
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nroComprobanteSecundario">
                          N° Comprobante Sec.
                        </Label>
                        <Input
                          id="nroComprobanteSecundario"
                          {...register("nro_comprobante2")}
                          placeholder="Número secundario"
                          disabled={isReadOnly}
                        />
                      </div>
                      {configuraciones.inputs && (
                        <div>
                          <Label htmlFor="forma_venta">Forma de venta *</Label>
                          <Controller
                            name="forma_venta"
                            control={control}
                            render={({ field }) => (
                              <Select
                                disabled={isReadOnly}
                                onValueChange={field.onChange}
                                value={
                                  field.value ||
                                  saleData?.forma_venta ||
                                  tempCreatedSale?.forma_venta ||
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
                          {errors.forma_venta && (
                            <p className="text-red-500 text-xs">
                              {errors.forma_venta.message}
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <Label htmlFor="forma_pago">Forma de pago *</Label>
                        <Controller
                          name="forma_pago"
                          control={control}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={
                                field.value ||
                                saleData?.forma_pago ||
                                tempCreatedSale?.forma_pago ||
                                ""
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una forma de pago" />
                              </SelectTrigger>
                              <SelectContent>
                                {salePaymentTypesData &&
                                  salePaymentTypesData.map((modality) => (
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
                        {errors.forma_pago && (
                          <p className="text-red-500 text-xs">
                            {errors.forma_pago.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="tipo_venta">Tipo de Venta *</Label>
                        <Controller
                          name="tipo_venta"
                          control={control}
                          render={({ field }) => (
                            <Select
                              disabled={isReadOnly}
                              onValueChange={field.onChange}
                              value={
                                field.value ||
                                saleData?.tipo_venta ||
                                tempCreatedSale?.tipo_venta ||
                                ""
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
                        {errors.tipo_venta && (
                          <p className="text-red-500 text-xs">
                            El campo es requerido
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="fechaPlazo">
                          Fecha Plazo
                          <span className="text-xs ml-1 text-gray-500">
                            (Crédito)
                          </span>
                        </Label>
                        <Input
                          id="fechaPlazo"
                          type="date"
                          {...register("plazo_pago")}
                          disabled={
                            formValues.tipo_venta !== "VC" || isReadOnly
                          }
                        />
                        {errors.plazo_pago && (
                          <p className="text-red-500 text-xs">
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
                          disabled={isReadOnly}
                        />
                      </div>
                      {configuraciones.inputs && (
                        <div>
                          <Label htmlFor="motor">Motor</Label>
                          <Input
                            id="motor"
                            {...register("nro_motor")}
                            placeholder="Tipo de motor"
                            disabled={isReadOnly}
                          />
                        </div>
                      )}
                      <div
                        className={cn(
                          configuraciones.formulario === "top" && "",
                          configuraciones.formulario === "left" &&
                            "md:col-span-2"
                        )}
                      >
                        <Label htmlFor="comentarios">Comentarios</Label>
                        <Textarea
                          id="comentarios"
                          {...register("comentario")}
                          placeholder="Comentarios adicionales sobre la venta"
                          rows={configuraciones.formulario === "top" ? 1 : 2}
                          disabled={isReadOnly}
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
                            selectedProducts={detalles}
                            onProductSelect={addProduct}
                            onlySelectWithStock={true}
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
                          <CardTitle className="flex justify-between">
                            <h2 className="text-primary text-base">
                              Detalle de Productos
                            </h2>
                            {configuraciones.selector_mode === "window" && (
                              <Button
                                type="button"
                                onClick={toggleWindowSelector}
                                disabled={isSaving || isReadOnly}
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
                            {saleData?.detalles.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No hay productos agregados</p>
                                <p className="text-sm">
                                  Haz clic en "Seleccionar Productos" para
                                  agregar
                                </p>
                              </div>
                            ) : (
                              <SaleDetailsEditingTable
                                ref={tableRef}
                                isReadOnly={isReadOnly}
                                products={detalles}
                                removeItem={removeProduct}
                                updatePrice={updatePrice}
                                updateQuantity={updateQuantity}
                                updateCustomSubtotal={updateCustomSubtotal}
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </ResizablePanel>
                  </ResizablePanelGroup>

                  {/* Resumen de venta  */}
                  <SalesSummary
                    isReadOnly={isReadOnly}
                    isEditMode={true}
                    discountAmount={calculateTotalDiscount()}
                    discountPercent={getDiscountPercentage()}
                    subtotal={calculateTotalBeforeDiscount()}
                    total={calculateTotal()}
                    isPending={isSaving}
                    callback={() => {
                      navigate("/dashboard/create-sale");
                    }}
                    aplyGlobalDiscount={applyGlobalDiscount}
                    hasProducts={detalles.length > 0}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>

      {/* Modal PDF Viewer */}
      <PDFViewer
        id={effectiveSaleId}
        pdfBlob={pdfBlob}
        isLoading={isLoadingPdf}
        isError={isErrorPdf}
        onClose={handleClosePrintDialog}
        isOpen={isDialogOpen}
        pdfName="venta"
        title={`Venta Nro. ${isUsingTempData ? tempCreatedSale?.nro : saleData?.nro}`}
      />
    </main>
  );
};

export default SaleEditScreen;
