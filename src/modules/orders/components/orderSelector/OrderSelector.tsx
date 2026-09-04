import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { useCommands } from "@/keybindings";
import { useBranchStore } from "@/states/branchStore";
import { Zap } from "lucide-react";
import { useMemo, useState } from "react";

import { ORDER_STATUS_MAP } from "../../constants/orderStatus";
import { useOrdersFilters } from "../../hooks/useOrdersFilters";
import { useOrdersGetAll } from "../../hooks/useOrdersGetAll";
import type { OrderGetAll } from "../../types/orderGet.types";
import OrderSelectorFilters from "./OrderSelectorFilters";
import OrderSelectorTable from "./OrderSelectorTable";

/**
 * Selector de pedidos, AGNÓSTICO AL CONTENEDOR.
 *
 * No sabe si vive en una ventana secundaria del SO o en un diálogo dentro de la
 * misma página: recibe su configuración por props y avisa la selección por
 * callback. El transporte (eventos entre ventanas, estado local, lo que sea) es
 * problema de quien lo monta.
 *
 * Contenedores:
 *  - `screens/OrderSelectorWindow.tsx` — ventana secundaria (escritorio)
 *  - cualquier diálogo que le pase `config` y `onSelectOrder`
 *
 * Ocupa el alto de su contenedor (`h-full`), no el de la pantalla. El
 * contenedor decide cuánto espacio hay.
 */

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

export interface OrderSelectorConfig {
  /** Código de estado que filtra el listado (por defecto 'A' = Almacén). */
  estadoLetra: string;
  /** Desde dónde se abrió. Hoy informativo; útil para telemetría o reglas. */
  context: string;
}

export interface OrderSelectorProps {
  config: OrderSelectorConfig;
  /** Se dispara al elegir un pedido. El contenedor decide qué hacer. */
  onSelectOrder: (order: OrderGetAll) => void;
}

export const OrderSelector = ({ config, onSelectOrder }: OrderSelectorProps) => {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const [searchMode, setSearchMode] = useState<"realtime" | "manual">("manual");

  const estadoNombre = ORDER_STATUS_MAP[config.estadoLetra] ?? "Almacén";

  const { filters, updateFilter, setPage, setPageSize, resetFilters } =
    useOrdersFilters(Number(selectedBranchId) || 1);

  const filtersWithEstado = useMemo(
    () => ({ ...filters, situacion_actual: config.estadoLetra }),
    [filters, config.estadoLetra],
  );

  const {
    data: ordersData,
    isLoading,
    isError,
    isFetching,
  } = useOrdersGetAll(filtersWithEstado);

  const orders = ordersData?.data || [];

  const handleManualSearch = () => {
    // Manual search logic if needed
  };

  const toggleSearchMode = () =>
    setSearchMode((prev) => (prev === "realtime" ? "manual" : "realtime"));

  useCommands(
    {
      "searchFilters.focusSearch": handleManualSearch,
      "forms.reset": resetFilters,
    },
    { enableOnFormTags: true },
  );

  return (
    <main className="h-full flex flex-col p-2 bg-secondary">
      <div className="rounded-lg shadow-sm flex-1 flex flex-col min-h-0">
        <header className="p-2 border-b border-border bg-background rounded-tl-lg rounded-tr-lg">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-bold text-primary">
              Seleccionar Pedido{" "}
              <Badge variant={getStatusBadge(estadoNombre)}>
                {estadoNombre}
              </Badge>
            </h1>

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
        </header>

        <div className="p-2 border-b border-border bg-background">
          <OrderSelectorFilters
            filters={filters}
            updateFilter={updateFilter}
            resetFilters={resetFilters}
            searchMode={searchMode}
            handleManualSearch={handleManualSearch}
          />
        </div>

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
          onSelectOrder={onSelectOrder}
        />
      </div>
    </main>
  );
};

export default OrderSelector;
