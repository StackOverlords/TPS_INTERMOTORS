import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Switch } from "@/components/atoms/switch";
import CustomizableTable from "@/components/common/CustomizableTable";
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
} from "lucide-react";
import { useMemo, useState } from "react";
import { useStockMinimoReport } from "../hooks/queries/useStockMinimoReport";
import { productsService } from "../services/productService";
import type { StockMinimoFilters, StockMinimoItem } from "../types/StockMinimoReport.types";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";

const ProductoStockReports = () => {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  // Estados para los filtros
  const [verSoloMenorIgual, setVerSoloMenorIgual] = useState(true);
  const [verSoloCercano, setVerSoloCercano] = useState(false);
  const [parametro, setParametro] = useState<number>(5);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);

  // Construir filtros
  const filters: StockMinimoFilters = useMemo(() => ({
    sucursal: Number(selectedBranchId) || 1,
    ver_solo_con_saldo_menorigual_al_minimo: verSoloMenorIgual,
    ver_solo_con_saldo_cercano_al_minimo_segun_parametro: verSoloCercano,
    parametro: verSoloCercano ? parametro : undefined,
  }), [selectedBranchId, verSoloMenorIgual, verSoloCercano, parametro]);

  const {
    data: reportData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useStockMinimoReport(filters, shouldFetch);

  // Log de errores para debugging
  if (isError && error) {
    console.error("[ProductoStockReports] Error:", error);
  }

  const data = reportData?.data ?? [];

  // Columnas de la tabla
  const columns = useMemo<ColumnDef<StockMinimoItem>[]>(
    () => [
      {
        accessorKey: "codigo",
        header: "Codigo",
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
              <span className="font-medium text-orange-600">
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
    enableSorting: true,
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
    setIsDownloading(true);
    try {
      const blob = await productsService.downloadStockMinimoReport(filters);

      // Crear URL y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-stock-minimo-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccessToast({
        title: "Descarga completada",
        description: "El reporte se ha descargado correctamente",
      });
    } catch (error) {
      showErrorToast({
        title: "Error al descargar",
        description: "No se pudo descargar el reporte",
      });
    } finally {
      setIsDownloading(false);
    }
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
      {/* Header */}
      <header className="bg-background rounded-lg p-2 space-y-2 border border-border flex-shrink-0">
        <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
          <div className="flex items-center gap-2 md:gap-4 grow">
            <FileSpreadsheet className="size-6 text-primary" />
            <h1 className="text-lg font-bold text-primary">
              Reporte de Stock Minimo
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Boton Refresh */}
            <TooltipButton
              onClick={handleRefresh}
              buttonProps={{
                className: "w-8",
                disabled: isFetching,
              }}
              tooltip="Actualizar reporte"
            >
              <RefreshCcw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </TooltipButton>

            {/* Boton Descargar */}
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={data.length === 0 || isDownloading}
            >
              <Download className={`size-4 mr-2 ${isDownloading ? "animate-pulse" : ""}`} />
              {isDownloading ? "Descargando..." : "Exportar Excel"}
            </Button>
          </div>
        </section>

        {/* Filtros */}
        <section className="flex items-center gap-4 flex-wrap pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Switch
              id="ver-menor-igual"
              checked={verSoloMenorIgual}
              onCheckedChange={handleVerSoloMenorIgualChange}
            />
            <Label htmlFor="ver-menor-igual" className="text-sm cursor-pointer">
              Ver solo stock menor o igual al minimo
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="ver-cercano"
              checked={verSoloCercano}
              onCheckedChange={handleVerSoloCercanoChange}
            />
            <Label htmlFor="ver-cercano" className="text-sm cursor-pointer">
              Ver cercanos al minimo segun parametro
            </Label>
          </div>

          {verSoloCercano && (
            <div className="flex items-center gap-2">
              <Label htmlFor="parametro" className="text-sm">
                Parametro:
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

          <Button variant="secondary" onClick={handleSearch} disabled={isFetching}>
            {isFetching ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Search className="size-4 mr-2" />
            )}
            {isFetching ? "Buscando..." : "Buscar"}
          </Button>
        </section>
      </header>

      {/* Loading Message */}
      {isFetching && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          <span>Cargando reporte... Este proceso puede tardar hasta 2 minutos dependiendo de la cantidad de productos.</span>
        </div>
      )}

      {/* Error Message */}
      {isError && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          <strong>Error:</strong> {(error as Error)?.message || "No se pudo cargar el reporte. Verifica que el endpoint esté disponible."}
        </div>
      )}

      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="bg-background rounded-lg p-3 border border-border">
          <div className="text-sm text-muted-foreground">Total Productos</div>
          <div className="text-2xl font-bold text-primary">
            {stats.totalItems}
          </div>
        </div>
        <div className="bg-background rounded-lg p-3 border border-border">
          <div className="text-sm text-muted-foreground">Stock Critico (0)</div>
          <div className="text-2xl font-bold text-red-600">
            {stats.itemsConStockCritico}
          </div>
        </div>
        <div className="bg-background rounded-lg p-3 border border-border">
          <div className="text-sm text-muted-foreground">Bajo Minimo</div>
          <div className="text-2xl font-bold text-orange-600">
            {stats.itemsBajoMinimo}
          </div>
        </div>
      </section>

      {/* Tabla */}
      <div className="flex-1 bg-background rounded-lg border border-border min-h-0">
        <div className="h-full flex flex-col">
          {/* Info de resultados */}
          <div className="p-2 text-sm text-muted-foreground border-b border-border flex-shrink-0">
            {!shouldFetch
              ? "Presiona 'Buscar' para cargar el reporte"
              : data.length > 0
                ? `Mostrando ${data.length} productos`
                : "Sin resultados"}
          </div>

          {/* Tabla */}
          <div className="flex-1 min-h-0">
            <CustomizableTable
              table={table}
              isLoading={isLoading}
              isFetching={isFetching}
              isError={isError}
              errorMessage="Error al cargar el reporte de stock"
              noDataMessage="No se encontraron productos con los filtros seleccionados"
              rows={20}
              enableColumnReordering
              enableSorting
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductoStockReports;
