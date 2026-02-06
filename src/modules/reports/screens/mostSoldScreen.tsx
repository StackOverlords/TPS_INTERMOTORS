import { useState } from "react";
import { Trophy } from "lucide-react";
import { SalesReportWrapper } from "../components/SalesReportWrapper";
import { useSalesReportFilters } from "../hooks/useSalesReportFilters";
import {
  useReportMasVendido,
  useDownloadReportMasVendido,
} from "../hooks/useReportMasVendido";
import { useBranchStore } from "@/states/branchStore";

const MostSoldScreen = () => {
  const [searchMode, setSearchMode] = useState<"realtime" | "manual">("manual");
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const {
    filters,
    debouncedFilters,
    appliedFilters,
    updateFilter,
    applyFilters,
    chartVisualLimit,
    setChartVisualLimit,
  } = useSalesReportFilters(Number(selectedBranchId));

  // Determinar qué filtros usar según el modo
  const activeFilters =
    searchMode === "realtime" ? debouncedFilters : appliedFilters;

  const { data, isLoading, isFetching, isError, refetch } = useReportMasVendido(
    {
      filters: activeFilters,
      enabled: !!activeFilters.fecha_inicio && !!activeFilters.ranking,
    }
  );

  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadReportMasVendido();

  const handleExport = () => {
    downloadReport(activeFilters);
  };

  const handleManualSearch = () => {
    if (searchMode === "manual") {
      applyFilters();
    }
  };

  const toggleSearchMode = () => {
    setSearchMode((prev) => (prev === "realtime" ? "manual" : "realtime"));
  };

  return (
    <SalesReportWrapper
      // Título e ícono
      title="Productos Más Vendidos"
      description="Ranking de productos por cantidad vendida"
      icon={Trophy}
      iconBgColor="bg-blue-500/10 dark:bg-blue-400/10"
      iconColor="text-blue-600 dark:text-blue-400"
      // Datos
      data={data?.data || []}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      // Filtros y acciones
      filters={filters}
      onFiltersChange={(key: string, value: any) =>
        updateFilter(key as keyof typeof filters, value)
      }
      onRefresh={() => refetch()}
      onExport={handleExport}
      searchMode={searchMode}
      onSearchModeToggle={toggleSearchMode}
      onSearch={handleManualSearch}
      isDownloading={isDownloading}
      // Configuración del gráfico
      chartDataKey="cantidad"
      chartTitle="Ranking por Cantidad Vendida"
      tableTitle="Detalle del Ranking"
      highlightTotalColumn={false}
      reportType="XCantidad"
      colorPreset="blue"
      chartVisualLimit={chartVisualLimit}
      onChartVisualLimitChange={setChartVisualLimit}
    />
  );
};

export default MostSoldScreen;
