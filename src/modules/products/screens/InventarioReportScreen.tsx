import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Label } from "@/components/atoms/label";
import { Slider } from "@/components/atoms/slider";
import { Checkbox } from "@/components/atoms/checkbox";
import VirtualizedCustomizableTable from "@/components/common/VirtualizedCustomizableTable";
import Pagination from "@/components/common/pagination";
import TooltipButton from "@/components/common/TooltipButton";
import { useCustomTable } from "@/hooks/useCustomTable";
import { useBranchStore } from "@/states/branchStore";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Download,
  Package,
  Loader2,
  RefreshCcw,
  Search,
  DollarSign,
  Calendar,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useInventarioReport,
  useDownloadInventarioReport,
} from "../hooks/queries/useInventarioReport";
import type {
  InventarioFilters,
  InventarioItem,
  InventarioStats,
} from "../types/InventarioReport.types";
import { type StockViewMode } from "../components/StockViewToggle";
import { InventarioChart } from "../components/InventarioChart";
import { EditableQuantity } from "@/modules/shoppingCart/components/editableQuantity";
import { cn } from "@/lib/utils";
import { Input } from "@/components/atoms/input";
import { format, subMonths } from "date-fns";
import { showErrorToast } from "@/hooks/use-toast-enhanced";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { useCategoriesWithSubcategories } from "@/modules/shared/hooks/useCategories";
import { REPORT_ROWS_OPTIONS } from "@/modules/shared/constants/tableOptions";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { PERMISSIONS } from "@/lib/permissions";

const InventarioReportScreen = () => {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [shouldFetch, setShouldFetch] = useState(false);
  const [viewMode, setViewMode] = useState<StockViewMode>("table");
  const [topLimit, setTopLimit] = useState<number>(20);
  const [pagina, setPagina] = useState(1);
  const [paginaRegistros, setPaginaRegistros] = useState(100);

  // Estados de filtros (UI)
  const [fecha, setFecha] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [fechaInicioCosto, setFechaInicioCosto] = useState<string>("");
  const [fechaFinCosto, setFechaFinCosto] = useState<string>("");
  const [categoria, setCategoria] = useState<number | undefined>(undefined);
  const [incluirTransito, setIncluirTransito] = useState<boolean>(true);
  const [verSoloConMovimiento, setVerSoloConMovimiento] =
    useState<boolean>(true);

  // Obtener categorías/divisiones
  const { data: categoriesData, isLoading: isCategoriesLoading } =
    useCategoriesWithSubcategories();

  // Filtros aplicados (solo se inicializa con fecha requerida)
  const [appliedFilters, setAppliedFilters] = useState<InventarioFilters>({
    fecha: format(new Date(), "yyyy-MM-dd"),
  });

  // Query del reporte
  const {
    data: reportData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useInventarioReport({
    filters: appliedFilters,
    enabled: shouldFetch,
  });

  // Mutation para descargar
  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadInventarioReport();

  const data = reportData?.data ?? [];

  // Calcular estadísticas
  const stats: InventarioStats = useMemo(() => {
    const totalCompras = data.reduce(
      (sum, item) => sum + parseFloat(item.compras.toString()),
      0
    );
    const totalVentas = data.reduce(
      (sum, item) => sum + parseFloat(item.ventas.toString()),
      0
    );
    const totalStock = data.reduce(
      (sum, item) => sum + parseFloat(item.stock.toString()),
      0
    );
    const totalValor = data.reduce(
      (sum, item) => sum + parseFloat(item.valor.toString()),
      0
    );
    const rotacion = totalStock > 0 ? totalVentas / totalStock : 0;
    const productosConStock = data.filter(
      (item) => parseFloat(item.stock.toString()) > 0
    ).length;
    const productosSinStock = data.filter(
      (item) => parseFloat(item.stock.toString()) === 0
    ).length;

    return {
      totalItems: data.length,
      totalCompras,
      totalVentas,
      totalStock,
      totalValor,
      rotacion,
      productosConStock,
      productosSinStock,
    };
  }, [data]);

  // Columnas de la tabla
  const columns = useMemo<ColumnDef<InventarioItem>[]>(
    () => [
      {
        id: "rowNumber",
        header: "Nro",
        size: 60,
        minSize: 40,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="text-center text-xs font-semibold text-muted-foreground">
            {(pagina - 1) * paginaRegistros + row.index + 1}
          </div>
        ),
      },
      {
        accessorKey: "codigo",
        header: "Código",
        size: 150,
        minSize: 100,
        cell: ({ getValue }) => (
          <div className="font-mono font-medium">{getValue<string>()}</div>
        ),
      },
      {
        accessorKey: "producto",
        header: "Producto",
        size: 400,
        minSize: 200,
        cell: ({ getValue }) => (
          <div className="font-medium text-primary">{getValue<string>()}</div>
        ),
      },
      {
        accessorKey: "compras",
        header: "Compras",
        size: 120,
        minSize: 80,
        cell: ({ getValue }) => {
          const compras = parseFloat(getValue<string>());
          return (
            <div className="text-center">
              <Badge variant="info" className="rounded font-bold">
                {compras.toLocaleString("es-BO", { maximumFractionDigits: 0 })}{" "}
                u.
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "ventas",
        header: "Ventas",
        size: 120,
        minSize: 80,
        cell: ({ getValue }) => {
          const ventas = parseFloat(getValue<string>());
          return (
            <div className="text-center">
              <Badge variant="success" className="rounded font-bold">
                {ventas.toLocaleString("es-BO", { maximumFractionDigits: 0 })}{" "}
                u.
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "stock",
        header: "Stock",
        size: 120,
        minSize: 80,
        cell: ({ getValue }) => {
          const stock = parseFloat(getValue<string>());
          return (
            <div className="text-center">
              <Badge
                variant={stock > 0 ? "secondary" : "danger"}
                className="rounded font-bold"
              >
                {stock.toLocaleString("es-BO", { maximumFractionDigits: 0 })} u.
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "valor",
        header: "Valor",
        size: 150,
        minSize: 100,
        cell: ({ getValue }) => {
          const valor = parseFloat(getValue<string>());
          return (
            <div className="text-right">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Bs.{" "}
                {valor.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          );
        },
      },
    ],
    [pagina, paginaRegistros]
  );

  const { table } = useCustomTable({
    data,
    columns,
    enableSorting: true,
    enableColumnResizing: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    columnResizeMode: "onChange",
    persistenceKey: "inventario-report-table",
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleSearch = () => {
    // Validar que haya una sucursal seleccionada
    if (!selectedBranchId) {
      showErrorToast({
        title: "Sucursal requerida",
        description:
          "Por favor selecciona una sucursal para generar el reporte",
      });
      return;
    }

    setPagina(1);

    const filters: InventarioFilters = {
      fecha: fecha,
      sucursal: Number(selectedBranchId),
      incluir_transito: incluirTransito,
      ver_solo_con_movimiento: verSoloConMovimiento,
      pagina: 1,
      pagina_registros: paginaRegistros,
    };

    // Solo agregar fechas de costo si están definidas
    if (fechaInicioCosto) {
      filters.fecha_inicio_costo = fechaInicioCosto;
    }
    if (fechaFinCosto) {
      filters.fecha_fin_costo = fechaFinCosto;
    }
    // Agregar categoría si está seleccionada
    if (categoria) {
      filters.categoria = categoria;
    }

    console.log("🔍 Filtros enviados al API:", filters);
    setAppliedFilters(filters);

    if (!shouldFetch) {
      setShouldFetch(true);
    }
  };

  const handleDownload = () => {
    downloadReport(appliedFilters);
  };

  const onPageChange = (page: number) => {
    setPagina(page);
    setAppliedFilters((prev) => ({ ...prev, pagina: page }));
  };

  const onShowRowsChange = (rows: number) => {
    setPaginaRegistros(rows);
    setPagina(1);
    setAppliedFilters((prev) => ({
      ...prev,
      pagina: 1,
      pagina_registros: rows,
    }));
  };

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      <ProtectedAction
        permission={PERMISSIONS.INV.REPORT_VALORADO}
        roles={["Super Admin", "Administrador", "Vendedor"]}
      >
        {/* Header Compacto */}
        <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                  Reporte General de Inventario
                </h1>
                {/* <p className="text-sm text-muted-foreground">
                Análisis de productos con stock bajo o crítico
              </p> */}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end w-full sm:w-auto gap-2"></div>
          </div>

          {/* Filtros Compactos */}
          <section className="border-t border-border pt-2">
            <div className="space-y-4">
              {/* Primera fila: Fechas */}
              <div className="flex items-end gap-4 flex-wrap">
                {/* Fecha de corte */}
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor="fecha"
                    className="flex items-center gap-2 text-sm font-semibold"
                  >
                    <Calendar className="size-4 text-primary" />
                    Fecha de Corte (hasta cuándo contar)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="fecha"
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-auto"
                      max={format(new Date(), "yyyy-MM-dd")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFecha(format(new Date(), "yyyy-MM-dd"))}
                      className="whitespace-nowrap"
                    >
                      Hoy
                    </Button>
                  </div>
                </div>

                {/* Fecha inicio costo */}
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor="fecha-inicio-costo"
                    className="text-sm text-muted-foreground"
                  >
                    Rango para Costo Promedio (opcional) - Desde:
                  </Label>
                  <Input
                    id="fecha-inicio-costo"
                    type="date"
                    value={fechaInicioCosto}
                    onChange={(e) => setFechaInicioCosto(e.target.value)}
                    className="w-auto"
                    max={fechaFinCosto || format(new Date(), "yyyy-MM-dd")}
                  />
                </div>

                {/* Fecha fin costo */}
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor="fecha-fin-costo"
                    className="text-sm text-muted-foreground"
                  >
                    Hasta:
                  </Label>
                  <Input
                    id="fecha-fin-costo"
                    type="date"
                    value={fechaFinCosto}
                    onChange={(e) => setFechaFinCosto(e.target.value)}
                    className="w-auto"
                    min={fechaInicioCosto}
                    max={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>

                {/* División/Categoría */}
                <div className="flex flex-col gap-1">
                  <Label htmlFor="categoria" className="text-sm font-semibold">
                    División (opcional)
                  </Label>
                  <ComboboxSelect
                    value={categoria?.toString() ?? "all"}
                    onChange={(value) => {
                      if (value === "all" || !value) {
                        setCategoria(undefined);
                      } else {
                        setCategoria(Number(value));
                      }
                    }}
                    options={
                      categoriesData?.map((cat) => ({
                        id: cat.id.toString(),
                        label: cat.categoria,
                      })) || []
                    }
                    optionTag="label"
                    // enableAllOption={true}
                    placeholder="Todas las divisiones"
                    clearOnEmpty={true}
                    className="w-[200px]"
                  />
                </div>
              </div>

              {/* Segunda fila: Opciones y botones */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Checkboxes */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="incluir-transito"
                      checked={incluirTransito}
                      onCheckedChange={(checked) =>
                        setIncluirTransito(checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="incluir-transito"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Incluir tránsito
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="solo-movimiento"
                      checked={verSoloConMovimiento}
                      onCheckedChange={(checked) =>
                        setVerSoloConMovimiento(checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="solo-movimiento"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Solo con movimiento
                    </Label>
                  </div>
                </div>

                <Button
                  variant="default"
                  onClick={handleSearch}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="size-4 mr-2" />
                  )}
                  {isFetching ? "Cargando..." : "Buscar"}
                </Button>

                <div className="ml-auto flex items-center gap-2">
                  <TooltipButton
                    onClick={handleRefresh}
                    buttonProps={{
                      variant: "outline",
                      size: "sm",
                      disabled: isFetching,
                    }}
                    tooltip="Actualizar reporte"
                  >
                    <RefreshCcw
                      className={`size-4 ${isFetching ? "animate-spin" : ""}`}
                    />
                  </TooltipButton>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={data.length === 0 || isDownloading}
                  >
                    <Download
                      className={`size-4 mr-2 ${isDownloading ? "animate-pulse" : ""}`}
                    />
                    {isDownloading ? "Descargando..." : "Exportar"}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </header>

        {/* Selector de Top (solo visible en modo gráfico) */}
        {viewMode === "chart" && data.length > 0 && (
          <div className="bg-background rounded-lg p-3 border border-border flex-shrink-0">
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                <span>Top {topLimit} productos</span>
                <EditableQuantity
                  value={topLimit}
                  className={cn("w-16 h-7 text-xs text-center font-bold")}
                  onSubmit={(value) => {
                    const num = value as number;
                    if (num >= 1 && num <= data.length) {
                      setTopLimit(num);
                    } else if (num > data.length) {
                      setTopLimit(data.length);
                    } else {
                      setTopLimit(1);
                    }
                  }}
                  validate={(val) => {
                    const num = parseInt(val);
                    return !isNaN(num) && num > 0;
                  }}
                />
              </Label>
              <div className="flex-1 max-w-md">
                <Slider
                  value={[topLimit]}
                  onValueChange={(value) => setTopLimit(value[0])}
                  min={1}
                  max={data.length}
                  step={data.length > 100 ? 5 : 1}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                de {data.length} total
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {isError && error && (
          <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/40 rounded-lg p-3 text-destructive text-sm flex-shrink-0">
            <strong>Error:</strong>{" "}
            {(error as Error)?.message || "No se pudo cargar el reporte"}
          </div>
        )}

        {/* Contenido principal - Tabla o Gráfico */}
        <div className="flex-1 min-h-0">
          {viewMode === "chart" ? (
            <InventarioChart data={data} limit={topLimit} />
          ) : (
            <div className="h-full bg-background rounded-lg border border-border flex flex-col">
              {/* Info de resultados */}
              <div className="flex items-center justify-between border-b border-border flex-shrink-0 p-2">
                <div className="text-sm">
                  {!shouldFetch ? (
                    <div className="text-muted-foreground space-y-1">
                      <div>
                        <strong>Tip:</strong> Selecciona la fecha de hoy para
                        ver el inventario actual
                      </div>
                      <div className="text-xs">
                        • Asegúrate de tener una sucursal seleccionada
                        <br />• Si obtienes valores en 0, puede ser que la
                        sucursal seleccionada no tenga movimientos
                      </div>
                    </div>
                  ) : data.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {reportData?.meta
                          ? (() => {
                              const inicio = (pagina - 1) * paginaRegistros + 1;
                              const fin = Math.min(
                                pagina * paginaRegistros,
                                reportData.meta.total_records
                              );
                              return `Mostrando ${inicio} - ${fin} de ${reportData.meta.total_records} productos`;
                            })()
                          : `Mostrando ${data.length} productos`}
                      </span>
                      {selectedBranchId && (
                        <span className="text-xs text-primary">
                          (sucursal ID: {selectedBranchId})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      Sin resultados - Verifica la fecha o la sucursal
                      seleccionada
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm flex-shrink-0">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10">
                    <Package className="size-4 text-primary" />
                    <span className="font-semibold text-primary">
                      {reportData?.meta?.total_records ?? stats.totalItems}
                    </span>
                    <span className="text-primary hidden sm:inline">
                      productos
                    </span>
                  </div>

                  <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
                    <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Bs.{" "}
                      {stats.totalValor.toLocaleString("es-BO", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <span className="text-emerald-600/70 dark:text-emerald-400/70 text-xs">
                      valor
                    </span>
                  </div>

                  <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 dark:bg-orange-500/20">
                    <Package className="size-4 text-orange-600 dark:text-orange-400" />
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {stats.totalStock.toLocaleString("es-BO", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <span className="text-orange-600/70 dark:text-orange-400/70 text-xs">
                      stock
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabla */}
              <div className="flex-1 min-h-0">
                <VirtualizedCustomizableTable
                  table={table}
                  isLoading={isLoading}
                  isFetching={isFetching}
                  isError={isError}
                  errorMessage="Error al cargar el reporte de inventario"
                  noDataMessage="No se encontraron productos en el inventario"
                  rows={20}
                  enableColumnReordering
                  enableSorting
                  estimatedRowHeight={50}
                />
              </div>

              {/* Pagination */}
              {data.length > 0 && reportData?.meta && (
                <Pagination
                  currentPage={pagina}
                  onPageChange={onPageChange}
                  totalData={reportData.meta.total_records}
                  onShowRowsChange={onShowRowsChange}
                  showRows={paginaRegistros}
                  rowsOptions={REPORT_ROWS_OPTIONS}
                />
              )}
            </div>
          )}
        </div>
      </ProtectedAction>
    </main>
  );
};

export default InventarioReportScreen;
