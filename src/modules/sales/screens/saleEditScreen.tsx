import ErrorDataComponent from "@/components/common/errorDataComponent";
import { useNavigate } from "react-router";
import { useSaleGetById } from "../hooks/useSaleGetById";
import TooltipButton from "@/components/common/TooltipButton";
import { CornerUpLeft, Plus, Printer, ShoppingCart, Trash2 } from "lucide-react";
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
import type { SalePaymentMethod } from "../types/sale";
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
import { computePaymentBalance } from "../utils/paymentBalance";
import { useTabHotkeys } from "@/hooks/tabs/useTabHotkeys";
import { PDFViewer } from "@/components/common/PDFViewer";
import { useSalePDF } from "../hooks/useSalePDF";
import { useTabStore } from "@/states/tabStore";
import { formatDateForUpdate } from "@/utils/dateFormatters";
import { Badge } from "@/components/atoms/badge";
import { roundTo5Decimals } from "@/utils/decimalUtils";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { PERMISSIONS } from "@/lib/permissions";
import { useValidatedRouteParam } from "@/hooks/useValidatedRouteParam";
import { useViewRendererWithTempData } from "@/hooks/useViewRendererWithTempData";

const SaleEditScreen = () => {
  const configuraciones = {
    inputs: false,
    formulario: "top",
    selector_mode: "window",
  };

  // funciones de tab
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const updateTab = useTabStore((s) => s.updateTab);
  const removeTab = useTabStore((s) => s.removeTab);

  const currentTab = tabs.find((t) => t.id === activeTabId);

  const tempCreatedSale = currentTab?.createdTempData
    ?.createdEntity as SaleGetById;
  const fromCreate = currentTab?.createdTempData?.fromCreate;
  const originalPath = currentTab?.createdTempData?.originalPath;

  const { value: saleIdParam, isValid: isValidSaleId } = useValidatedRouteParam(
    {
      paramName: "saleId",
      minValidValue: 1,
    }
  );

  const effectiveSaleId = useMemo(() => {
    if (fromCreate && tempCreatedSale?.id) {
      return tempCreatedSale.id;
    }
    return saleIdParam;
  }, [fromCreate, tempCreatedSale?.id, saleIdParam]);

  const [isReadOnly] = useState<boolean>(false);
  const [formasPago, setFormasPago] = useState<SalePaymentMethod[]>([]);
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
    refetch: refetchSale,
  } = useSaleGetById(effectiveSaleId ?? 0);

  const {
    data: pdfBlob,
    isLoading: isLoadingPdf,
    isError: isErrorPdf,
  } = useSalePDF(effectiveSaleId || 0, isDialogOpen && !!effectiveSaleId);

  const { renderView } = useViewRendererWithTempData({
    queryState: {
      isLoading: isLoadingSale,
      isError: isErrorSale,
      data: saleData,
    },
    tempDataConfig: {
      tempData: tempCreatedSale,
      isUsingTempData: fromCreate && !!tempCreatedSale && !saleData,
      validateTempData: (data) => !!data?.id && !!data?.detalles,
    },
    isParamValid: isValidSaleId,
    additionalQueryStates: [
      { isLoading: isLoadingSaleTypes, isError: false, data: saleTypesData },
      {
        isLoading: isLoadingSaleModalities,
        isError: false,
        data: saleModalitiesData,
      },
      {
        isLoading: isLoadingSaleResponsibles,
        isError: false,
        data: saleResponsiblesData,
      },
    ],
    SkeletonComponent: SaleEditSkeleton,
    ErrorComponent: ErrorDataComponent,
    errorMessage: "No se pudo cargar la venta.",
    onRetry: refetchSale,
  });

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
      descuento: roundTo5Decimals(d.descuento),
      id_detalle_venta: d.id,
      id_producto: d.producto.id,
      porcentaje_descuento: roundTo5Decimals(d.porcentaje_descuento),
      precio: roundTo5Decimals(d.precio),
      orden: d.orden ?? index + 1,
      cantidad_dev: d.cantidad_dev ?? 0,
      producto: {
        id: d.producto.id,
        categoria: d.producto.categoria?.categoria ?? null,
        codigo_oem: d.producto.codigo_oem ?? null,
        codigo_upc: d.producto.codigo_upc ?? null,
        descripcion: d.producto.descripcion,
        marca: d.producto.marca?.marca ?? "",
        precio_venta: roundTo5Decimals(d.producto.precio_venta),
        stock_actual: d.producto.stock_actual ?? 0,
      },
    }));

    // Guardar los detalles originales
    setOriginalDetails(detallesTransformados);

    // Pre-cargar formas de pago solo si la venta participó en el sistema de caja.
    // Filter out es_saldo rows: buildFormasPago recomputes them fresh on save,
    // so they must never appear as explicit editable rows (avoids duplicate stacking on re-edit).
    if (sale.caja_sesion_id != null && sale.formas_pago_detalle?.length) {
      const nonSaldoRows = sale.formas_pago_detalle.filter(
        (fp) => !fp.es_saldo
      );
      const hasSaldoRow = sale.formas_pago_detalle.some((fp) => fp.es_saldo);

      // Fila base implícita: una sola fila no-saldo, sin fila de saldo, y cuyo
      // forma_pago coincide con el header. El backend la genera SIEMPRE (incluso
      // para ventas sin pago dividido real), por lo que cubre el total entero y
      // espeja el dropdown header. NO debe resucitarse como fila de split editable:
      // si lo hiciéramos, cambiar el dropdown header no tendría efecto (el backend
      // confía en formas_pago) y el movimiento de caja no se actualizaría.
      // Colapsándola, el header vuelve a ser la única fuente de verdad para el pago único.
      const isImplicitBase =
        nonSaldoRows.length === 1 &&
        !hasSaldoRow &&
        nonSaldoRows[0].forma_pago === (sale.forma_pago ?? "");

      setFormasPago(isImplicitBase ? [] : nonSaldoRows);
    } else {
      setFormasPago([]);
    }

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
  };

  useEffect(() => {
    // Si viene de crear venta, cargar datos temporales primero
    if (fromCreate && !hasInitialized && !isUsingTempData && tempCreatedSale) {
      loadFormData(tempCreatedSale);
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
      setIsUsingTempData(false);
      if (currentTab?.createdTempData) {
        // limpiar datos temporales del tab
        updateTab(currentTab.id, {
          createdTempData: {
            ...currentTab.createdTempData,
            createdEntity: undefined,
          },
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
    isUsingTempData,
    tempCreatedSale,
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

    // Payment balance guards (only relevant for split-payment / contado sales)
    const isContadoLocal = formData.tipo_venta !== "VC" && formData.tipo_venta !== "";
    if (isContadoLocal && formasPago.length > 0) {
      const balance = computePaymentBalance(
        formasPago,
        calculateTotal(),
        formData.forma_pago,
        salePaymentTypesData
      );

      if (balance.status === "over") {
        showErrorToast({
          title: "Monto excedido",
          description:
            "El monto ingresado en las formas de pago supera el total de la venta",
        });
        isValid = false;
      }

      if (balance.status === "pending" && !formData.forma_pago) {
        setError("forma_pago", {
          type: "manual",
          message:
            "Seleccioná una forma de pago principal para cubrir el saldo restante",
        });
        showErrorToast({
          title: "Forma de pago requerida",
          description:
            "Hay un saldo pendiente pero no se ha seleccionado la forma de pago principal",
        });
        isValid = false;
      }
    }

    return isValid;
  };

  const formValues = watch();
  const { tipo_venta, plazo_pago, detalles } = formValues;

  const isContado = tipo_venta !== "VC" && tipo_venta !== "";

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

  // formasPago se inicializa en loadFormData según caja_sesion_id

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
    originalDetails: originalDetails || [],
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

    const activeSale = saleData ?? tempCreatedSale;
    const hasCaja = activeSale?.caja_sesion_id != null;

    const dataToSend = {
      ...transformedData,
      fecha: fechaFormateada,
      ...(hasCaja && formasPago.length > 0 ? { formas_pago: formasPago } : {}),
    };

    updateSale(
      { saleId: effectiveSaleId ?? 0, data: dataToSend },
      {
        onSuccess: (updatedData) => {
          showSuccessToast({
            title: "Venta Modificada",
            description: `Venta modificada con éxito`,
          });
          refetchSale();
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

  //   nueva funcion secundaria
  const handleSecondaryAction = () => {
    if (fromCreate && originalPath && currentTab) {
      updateTab(currentTab.id, {
        path: originalPath,
        title: "Registrar venta",
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

  const view = renderView();
  if (view) return view;

  return (
    <main className="p-2 h-full">
      <ProtectedAction
        permission={PERMISSIONS.VEN.MODULE}
        roles={["Super Admin", "Administrador", "Vendedor"]}
      >
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
                      Editar venta #
                      {isUsingTempData ? tempCreatedSale?.nro : saleData?.nro}
                    </h1>
                    {saleData && (
                      <p className="text-sm text-muted-foreground">
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
                      <p className="text-sm text-muted-foreground">
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
                  <Badge
                    className="h-8 rounded-sm font-bold text-xl border border-emerald-500"
                    variant={"success"}
                  >
                    {tempCreatedSale?.nro ?? saleData?.nro ?? "NUEVA"}
                  </Badge>
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
                      "shadow-none bg-background",
                      configuraciones.formulario === "top" &&
                        "h-full flex-shrink-0",
                      configuraciones.formulario === "left" &&
                        "h-auto md:h-full"
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
                                disabled={isReadOnly}
                              />
                            )}
                          />
                          {errors.id_responsable && (
                            <p className="text-destructive text-xs">
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
                            <p className="text-destructive text-xs">
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
                            <Label htmlFor="forma_venta">
                              Forma de venta *
                            </Label>
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
                              <p className="text-destructive text-xs">
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
                            <p className="text-destructive text-xs">
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
                            <p className="text-destructive text-xs">
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

                  {/* Formas de pago dividido — solo para ventas contado */}
                  {isContado && (
                    <Card className="shadow-none bg-background flex-shrink-0">
                      <CardHeader className="p-2 sm:p-3 pb-0">
                        <CardTitle className="text-primary text-base">
                          Formas de pago
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 sm:p-3">
                        <div className="flex flex-col gap-2">
                          {formasPago.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              Sin pago dividido — se usará la forma de pago principal
                            </p>
                          )}

                          {formasPago.map((fp, index) => (
                            <div
                              key={index}
                              className="flex flex-wrap gap-2 items-end"
                            >
                              <div className="flex-1 min-w-[120px]">
                                <Label className="text-xs">Forma de pago</Label>
                                <Select
                                  value={fp.forma_pago}
                                  onValueChange={(value) => {
                                    setFormasPago((prev) =>
                                      prev.map((item, i) =>
                                        i === index
                                          ? {
                                              ...item,
                                              forma_pago: value,
                                              monto_recibido:
                                                value !== "EF"
                                                  ? null
                                                  : item.monto_recibido,
                                            }
                                          : item
                                      )
                                    );
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {salePaymentTypesData &&
                                      salePaymentTypesData.map((pt) => (
                                        <SelectItem key={pt.code} value={pt.code}>
                                          {pt.label}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex-1 min-w-[100px]">
                                <Label className="text-xs">Monto</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  step="any"
                                  value={fp.monto === 0 ? "" : fp.monto}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setFormasPago((prev) =>
                                      prev.map((item, i) =>
                                        i === index ? { ...item, monto: value } : item
                                      )
                                    );
                                  }}
                                  placeholder="0.00"
                                />
                              </div>

                              {fp.forma_pago === "EF" && (
                                <div className="flex-1 min-w-[100px]">
                                  <Label className="text-xs">Monto recibido</Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="any"
                                    value={fp.monto_recibido ?? ""}
                                    onChange={(e) => {
                                      const value =
                                        e.target.value === ""
                                          ? null
                                          : parseFloat(e.target.value) || 0;
                                      setFormasPago((prev) =>
                                        prev.map((item, i) =>
                                          i === index
                                            ? { ...item, monto_recibido: value }
                                            : item
                                        )
                                      );
                                    }}
                                    placeholder="0.00"
                                  />
                                </div>
                              )}

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() =>
                                  setFormasPago((prev) =>
                                    prev
                                      .filter((_, i) => i !== index)
                                      .map((item, i) => ({ ...item, orden: i + 1 }))
                                  )
                                }
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          ))}

                          <div className="flex items-center justify-between pt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() =>
                                setFormasPago((prev) => [
                                  ...prev,
                                  {
                                    forma_pago:
                                      salePaymentTypesData?.[0]?.code ?? "",
                                    monto: 0,
                                    monto_recibido: null,
                                    orden: prev.length + 1,
                                  },
                                ])
                              }
                            >
                              <Plus className="size-4" />
                              Agregar forma de pago
                            </Button>

                            {formasPago.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Total asignado:{" "}
                                <span className="font-medium text-foreground">
                                  {formasPago
                                    .reduce((sum, fp) => sum + (fp.monto || 0), 0)
                                    .toFixed(2)}
                                </span>{" "}
                                / Total venta:{" "}
                                <span className="font-medium text-foreground">
                                  {calculateTotal().toFixed(2)}
                                </span>
                              </p>
                            )}
                          </div>

                          {/* Balance inline feedback — hidden when no split rows */}
                          {formasPago.length > 0 && (() => {
                            const balance = computePaymentBalance(
                              formasPago,
                              calculateTotal(),
                              formValues.forma_pago,
                              salePaymentTypesData
                            );
                            if (balance.status === "pending") {
                              return (
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                  ⚠ Saldo de Bs {balance.saldo.toFixed(2)} se
                                  cobrará con{" "}
                                  {balance.headerLabel || formValues.forma_pago || "—"}
                                </p>
                              );
                            }
                            if (balance.status === "over") {
                              return (
                                <p className="text-xs text-destructive">
                                  El monto ingresado supera el total de la venta
                                  en Bs{" "}
                                  {(balance.assigned - calculateTotal()).toFixed(2)}
                                </p>
                              );
                            }
                            return (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                ✓ Pago completo
                              </p>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  )}
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
                              {detalles.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
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
                      callback={handleSecondaryAction}
                      secondaryButtonText={
                        fromCreate ? "Nueva Venta" : "Cancelar"
                      }
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
      </ProtectedAction>
    </main>
  );
};

export default SaleEditScreen;
