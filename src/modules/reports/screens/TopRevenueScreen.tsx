import { useState } from "react";
import { DollarSign } from "lucide-react";
import { SalesReportWrapper } from "../components/SalesReportWrapper";
import { useSalesReportFilters } from "../hooks/useSalesReportFilters";
import {
  useReportMayorIngreso,
  useDownloadReportMayorIngreso,
} from "../hooks/useReportMayorIngreso";
import { useBranchStore } from "@/states/branchStore";

const TopRevenueScreen = () => {
  const [searchMode, setSearchMode] = useState<"realtime" | "manual">("manual");
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const {
    filters,
    debouncedFilters,
    appliedFilters,
    updateFilter,
    applyFilters,
  } = useSalesReportFilters(Number(selectedBranchId));

  const activeFilters =
    searchMode === "realtime" ? debouncedFilters : appliedFilters;

  const { data, isLoading, isFetching, isError, error, refetch } =
    useReportMayorIngreso({
      filters: activeFilters,
      enabled: !!activeFilters.fecha_inicio && !!activeFilters.ranking,
    });

  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadReportMayorIngreso();

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
      title="Productos con Mayor Ingreso"
      description="Ranking de productos por total generado en ventas"
      icon={DollarSign}
      iconBgColor="bg-green-500/10"
      iconColor="text-green-500"
      // Datos
      data={data?.data || []}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      error={error}
      // Filtros y acciones
      filters={filters}
      onFiltersChange={(key: string, value: any) =>
        updateFilter(key as keyof typeof filters, value)
      }
      onRefresh={() => refetch()}
      onExport={handleExport}
      showRanking
      searchMode={searchMode}
      onSearchModeToggle={toggleSearchMode}
      onSearch={handleManualSearch}
      isDownloading={isDownloading}
      // Configuración del gráfico (por TOTAL en vez de cantidad)
      chartDataKey="total"
      chartColor="#10b981"
      chartTitle="Ranking por Ingresos Generados"
      tableTitle="Detalle de Ingresos"
      highlightTotalColumn={true}
      reportType="XIngreso"
    />
  );
};

export default TopRevenueScreen;
