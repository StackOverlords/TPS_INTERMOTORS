import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { useBranchStore } from "@/states/branchStore";
import { getWindowManager } from "@/platform";
import { Zap } from "lucide-react";
import React, { useMemo, useState } from "react";
import OrderSelectorFilters from "../components/orderSelector/OrderSelectorFilters";
import OrderSelectorTable from "../components/orderSelector/OrderSelectorTable";
import { useOrdersFilters } from "../hooks/useOrdersFilters";
import { useOrdersGetAll } from "../hooks/useOrdersGetAll";
import type { OrderGetAll } from "../types/orderGet.types";
import { useCommands } from "@/keybindings";

const getStatusBadge = (estado: string) => {
  switch (estado) {
    case "Preparación":
      return "secondary";
    case "Cotización":
      return "info";
    case "Tránsito":
      return "warning";
    case "Almacén":
      return "accent";
    case "Disponible":
      return "success";
    default:
      return "default";
  }
};

const ESTADO_MAP: Record<string, string> = {
  P: "Preparación",
  C: "Cotización",
  T: "Tránsito",
  A: "Almacén",
  D: "Disponible",
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("OrderSelectorWindow Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-800 border border-border rounded m-4">
          <h2 className="text-lg font-bold mb-2">Algo salió mal</h2>
          <pre className="text-xs overflow-auto p-2 bg-background border border-red-100 rounded">
            {this.state.error?.toString()}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const OrderSelectorWindow = () => {
  return (
    <ErrorBoundary>
      <OrderSelectorWindowContent />
    </ErrorBoundary>
  );
};

const OrderSelectorWindowContent = () => {
  const platformWindows = getWindowManager();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  // Extraer config de URL
  const config = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const estadoParam = params.get("estado") || "A"; // Por defecto 'A' (Almacén)
    return {
      windowId: params.get("windowId") || "order-selector-default",
      context: params.get("context") || "purchase",
      estadoLetra: estadoParam, // Guardar la letra
      estadoNombre: ESTADO_MAP[estadoParam] || "Almacén", // Guardar el nombre
    };
  }, []);

  const [searchMode, setSearchMode] = useState<"realtime" | "manual">("manual");

  const { filters, updateFilter, setPage, setPageSize, resetFilters } =
    useOrdersFilters(Number(selectedBranchId) || 1);

  // Aplicar filtro de estado desde config
  const filtersWithEstado = useMemo(
    () => ({
      ...filters,
      situacion_actual: config.estadoLetra, // Usar la letra/código
    }),
    [filters, config.estadoNombre]
  );

  const {
    data: ordersData,
    isLoading,
    isError,
    isFetching,
  } = useOrdersGetAll(filtersWithEstado);

  const orders = ordersData?.data || [];

  // Manejar selección de pedido
  const handleSelectOrder = async (order: OrderGetAll) => {
    await platformWindows.emitToWindow(config.windowId, "order-selected", { id: order.id });
    await platformWindows.closeCurrentWindow();
  };

  // const handleClose = async () => {
  //   await platformWindows.emitToWindow(config.windowId, 'window-closed', { canceled: true });
  //   await platformWindows.closeCurrentWindow();
  // };

  const handleManualSearch = () => {
    // Manual search logic if needed
  };

  const toggleSearchMode = () => {
    setSearchMode((prev) => (prev === "realtime" ? "manual" : "realtime"));
  };

  useCommands(
    {
      "searchFilters.focusSearch": handleManualSearch,
      "forms.reset": resetFilters,
    },
    {
      enableOnFormTags: true,
    }
  );

  return (
    <main className="h-screen flex flex-col p-2 bg-secondary">
      <div className="rounded-lg shadow-sm flex-1 flex flex-col">
        {/* Header */}
        <header className="p-2 border-b border-border bg-background rounded-tl-lg rounded-tr-lg">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-primary">
                Seleccionar Pedido{" "}
                <Badge variant={getStatusBadge(config.estadoNombre)}>
                  {config.estadoNombre}
                </Badge>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={toggleSearchMode}
                className="text-xs h-7"
              >
                <Zap
                  className={`h-3 w-3 ${searchMode === "realtime" ? "text-yellow-500" : "text-gray-500"}`}
                />
                {searchMode === "realtime" ? "Tiempo real" : "Manual"}
              </Button>
            </div>
          </div>
        </header>

        {/* Filtros */}
        <div className="p-2 border-b border-border bg-background">
          <OrderSelectorFilters
            filters={filters}
            updateFilter={updateFilter}
            resetFilters={resetFilters}
            searchMode={searchMode}
            handleManualSearch={handleManualSearch}
          />
        </div>

        {/* Info y Debug
        <div className="p-2 text-sm border-b border-border space-y-1 bg-background">
          <div className="text-muted-foreground">
            {isLoading && "Cargando pedidos..."}
            {!isLoading &&
              !isError &&
              orders.length > 0 &&
              `Mostrando ${orders.length} pedidos`}
            {!isLoading &&
              !isError &&
              orders.length === 0 &&
              "No se encontraron pedidos con este filtro"}
            {isError && (
              <span className="text-red-600">❌ Error al cargar pedidos</span>
            )}
          </div>
        </div> */}

        {/* Tabla */}
        <OrderSelectorTable
          data={ordersData!}
          orders={orders}
          filters={filters}
          setPage={setPage}
          setPageSize={setPageSize}
          isInfiniteScroll={searchMode === "realtime"}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          onSelectOrder={handleSelectOrder}
        />
      </div>
    </main>
  );
};
export default OrderSelectorWindow;
