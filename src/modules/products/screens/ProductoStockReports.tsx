import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Switch } from "@/components/atoms/switch";
import VirtualizedCustomizableTable from "@/components/common/VirtualizedCustomizableTable";
import TooltipButton from "@/components/common/TooltipButton";
import { useCustomTable } from "@/hooks/useCustomTable";
import { useBranchStore } from "@/states/branchStore";
import { type ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCcw,
  Search,
  TrendingDown,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useDownloadStockMinimoReport,
  useStockMinimoReport,
} from "../hooks/queries/useStockMinimoReport";
import type {
  StockMinimoFilters,
  StockMinimoItem,
} from "../types/StockMinimoReport.types";
import { type StockViewMode } from "../components/StockViewToggle";
import { StockDistributionChart } from "../components/StockDistributionChart";
import { ViewToggle } from "@/modules/reports/components/ViewToggle";
import { cn } from "@/lib/utils";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { PERMISSIONS } from "@/lib/permissions";

const ProductoStockReports = () => {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  // Estados para los filtros
  const [verSoloMenorIgual, setVerSoloMenorIgual] = useState(true);
  const [verSoloCercano, setVerSoloCercano] = useState(false);
  const [parametro, setParametro] = useState<number>(5);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [viewMode, setViewMode] = useState<StockViewMode>("table");

  // Construir filtros
  const filters: StockMinimoFilters = useMemo(
    () => ({
      sucursal: Number(selectedBranchId) || 1,
      ver_solo_con_saldo_menorigual_al_minimo: verSoloMenorIgual,
      ver_solo_con_saldo_cercano_al_minimo_segun_parametro: verSoloCercano,
      parametro: verSoloCercano ? parametro : undefined,
    }),
    [selectedBranchId, verSoloMenorIgual, verSoloCercano, parametro]
  );

  const {
    data: reportData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useStockMinimoReport(filters, shouldFetch);

  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadStockMinimoReport();

  // Log de errores para debugging
  if (isError && error) {
    console.error("[ProductoStockReports] Error:", error);
  }

  const data = reportData?.data ?? [];

  // Columnas de la tabla
  const columns = useMemo<ColumnDef<StockMinimoItem>[]>(
    () => [
      {
        id: "rowNumber",
        header: "Nro",
        size: 30,
        minSize: 30,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="text-center text-xs font-semibold text-muted-foreground">
            {row.index + 1}
          </div>
        ),
      },
      {
        accessorKey: "codigo",
        header: "Codigo",
        size: 50,
        minSize: 50,
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
        accessorKey: "stock_actual",
        header: "Stock Actual",
        size: 120,
        minSize: 80,
        cell: ({ getValue }) => {
          const stock = parseFloat(getValue<string>());
          return (
            <div className="text-center">
              <Badge
                variant={stock <= 0 ? "danger" : "secondary"}
                className="rounded font-bold"
              >
                {stock.toFixed(0)}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "stock_minimo",
        header: "Stock Minimo",
        size: 120,
        minSize: 80,
        cell: ({ getValue }) => {
          const stockMin = parseFloat(getValue<string>());
          return (
            <div className="text-center">
              <span className="font-medium text-orange-600 dark:text-orange-400">
                {stockMin.toFixed(0)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "diferencia",
        header: "Diferencia",
        size: 120,
        minSize: 80,
        cell: ({ getValue }) => {
          const diff = getValue<number>();
          const isNegative = diff < 0;
          const isZero = diff === 0;

          return (
            <div className="text-center">
              <Badge
                variant={isNegative ? "danger" : isZero ? "warning" : "success"}
                className="rounded font-bold"
              >
                {isNegative && <AlertTriangle className="size-3 mr-1" />}
                {diff > 0 ? `+${diff}` : diff}
              </Badge>
            </div>
          );
        },
      },
    ],
    []
  );

  const { table } = useCustomTable({
    data,
    columns,
    // enableSorting: true,
    enableColumnResizing: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    columnResizeMode: "onChange",
    persistenceKey: "stock-minimo-report-table",
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleSearch = () => {
    if (!shouldFetch) {
      setShouldFetch(true);
    } else {
      refetch();
    }
  };

  const handleDownload = async () => {
    downloadReport(filters);
  };

  // Manejar cambio de filtros
  const handleVerSoloMenorIgualChange = (checked: boolean) => {
    setVerSoloMenorIgual(checked);
    if (checked) {
      setVerSoloCercano(false);
    }
  };

  const handleVerSoloCercanoChange = (checked: boolean) => {
    setVerSoloCercano(checked);
    if (checked) {
      setVerSoloMenorIgual(false);
    }
  };

  // Calcular estadisticas
  const stats = useMemo(() => {
    const totalItems = data.length;
    const itemsConStockCritico = data.filter(
      (item) => parseFloat(item.stock_actual) <= 0
    ).length;
    const itemsBajoMinimo = data.filter((item) => item.diferencia < 0).length;

    return {
      totalItems,
      itemsConStockCritico,
      itemsBajoMinimo,
    };
  }, [data]);

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      <ProtectedAction
        permission={PERMISSIONS.PRD.REPORT_STOCK}
        roles={["Super Admin", "Administrador", "Vendedor"]}
      >
        {/* Header Compacto */}
        <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                  Reporte de Stock Mínimo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Análisis de productos con stock bajo o crítico
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end w-full sm:w-auto gap-2"></div>
          </div>

          {/* Filtros Compactos */}
          <section className="border-t border-border pt-2">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch
                  id="ver-menor-igual"
                  checked={verSoloMenorIgual}
                  onCheckedChange={handleVerSoloMenorIgualChange}
                />
                <Label
                  htmlFor="ver-menor-igual"
                  className="text-sm cursor-pointer"
                >
                  Stock ≤ Mínimo
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="ver-cercano"
                  checked={verSoloCercano}
                  onCheckedChange={handleVerSoloCercanoChange}
                />
                <Label htmlFor="ver-cercano" className="text-sm cursor-pointer">
                  Cercanos al mínimo
                </Label>
              </div>

              {verSoloCercano && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="parametro" className="text-sm">
                    Parámetro:
                  </Label>
                  <Input
                    id="parametro"
                    type="number"
                    min={1}
                    value={parametro}
                    onChange={(e) => setParametro(Number(e.target.value) || 1)}
                    className="w-20 h-8"
                  />
                </div>
              )}

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
                {isFetching ? "Buscando..." : "Buscar"}
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
          </section>
        </header>

        {/* Error Message */}
        {isError && error && (
          <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/40 rounded-lg p-3 text-destructive text-sm flex-shrink-0">
            <strong>Error:</strong>{" "}
            {(error as Error)?.message ||
              "No se pudo cargar el reporte. Verifica que el endpoint esté disponible."}
          </div>
        )}

        {/* Contenido principal - Tabla o Gráfico */}
        <div className="flex-1 min-h-0">
          <div
            className={cn(
              "bg-background rounded-lg border border-border flex flex-col",
              viewMode === "chart" ? "h-auto" : "h-full"
            )}
          >
            <div className="flex flex-col flex-shrink-0 p-2 gap-2 border-b border-border">
              {/* ViewToggle y Stats integrados */}
              <div className="flex items-center justify-between flex-shrink-0">
                <ViewToggle value={viewMode} onChange={setViewMode} />

                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10">
                    <FileSpreadsheet className="size-4 text-primary" />
                    <span className="font-semibold text-primary">
                      {stats.totalItems}
                    </span>
                    <span className="text-primary hidden sm:inline">
                      productos
                    </span>
                  </div>

                  <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 dark:bg-destructive/20">
                    <AlertTriangle className="size-4 text-destructive" />
                    <span className="font-semibold text-destructive">
                      {stats.itemsConStockCritico}
                    </span>
                    <span className="text-destructive/70 text-xs">
                      críticos
                    </span>
                  </div>

                  <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 dark:bg-orange-500/20">
                    <TrendingDown className="size-4 text-orange-600 dark:text-orange-400" />
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {stats.itemsBajoMinimo}
                    </span>
                    <span className="text-orange-600/70 dark:text-orange-400/70 text-xs">
                      bajo mínimo
                    </span>
                  </div>
                </div>
              </div>

              {/* Info de resultados */}
              {viewMode === "table" && (
                <div className="flex-shrink-0 flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    {!shouldFetch
                      ? "Presiona 'Buscar' para cargar el reporte"
                      : data.length > 0
                        ? `Mostrando ${data.length} productos`
                        : "Sin resultados"}
                  </span>

                  {/* Indicador de carga mientras refetch */}
                  {(isFetching || isLoading) && (
                    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando datos... Este proceso puede tardar.
                    </div>
                  )}
                </div>
              )}
            </div>
            {viewMode === "chart" ? (
              <StockDistributionChart data={data} />
            ) : (
              // Tabla
              <div className="flex-1 min-h-0">
                <VirtualizedCustomizableTable
                  table={table}
                  isLoading={isLoading}
                  isFetching={isFetching}
                  isError={isError}
                  errorMessage="Error al cargar el reporte de stock"
                  noDataMessage="Ajusta los filtros y presiona 'Buscar' para cargar el reporte."
                  rows={20}
                  enableColumnReordering
                  enableSorting
                  estimatedRowHeight={50}
                />
              </div>
            )}
          </div>
        </div>
      </ProtectedAction>
    </main>
  );
};

export default ProductoStockReports;
