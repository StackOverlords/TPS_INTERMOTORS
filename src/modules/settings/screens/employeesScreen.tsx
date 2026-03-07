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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import ConfirmationModal from "@/components/common/confirmationModal";
import TooltipButton from "@/components/common/TooltipButton";
import { showSuccessToast } from "@/hooks/use-toast-enhanced";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useGoBack } from "@/hooks/useGoBack";
import {
  CornerUpLeft,
  Filter,
  FilterX,
  RefreshCcw,
  Search,
  Zap,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useEmployeeFilters } from "../hooks/employee/useEmployeeFilters";
import { useDeleteEmployee } from "../hooks/employee/useDeleteEmployee";
import { useGetAllEmployees } from "../hooks/employee/useGetAllEmployees";
import EmployeeListTable from "../components/employee/employeeListTable";

type SearchMode = "realtime" | "manual";

const EmployeesScreen = () => {
  const [searchMode, setSearchMode] = useState<SearchMode>("manual");

  const {
    filters,
    updateFilter,
    debouncedFilters,
    appliedFilters,
    resetFilters,
    setPage,
    setPageSize,
    applyFilters,
  } = useEmployeeFilters();

  const queryFilters =
    searchMode === "realtime" ? debouncedFilters : appliedFilters;

  const {
    data: employeesData,
    refetch: handleRefetchEmployeesData,
    isFetching: isFetchingEmployeesData,
    isRefetching: isRefetchingEmployeesData,
    isLoading: isLoadingEmployeesData,
    isError: isErrorEmployeesData,
  } = useGetAllEmployees(queryFilters);

  const { handleError } = useErrorHandler();
  const handleGoBack = useGoBack("/dashboard/settings");

  const handleDeleteSuccess = useCallback((_data: unknown, id: number) => {
    showSuccessToast({
      title: "Responsable desactivado",
      description: `El Responsable #${id} fue desactivado. Puede reactivarlo desde la tabla.`,
      duration: 6000,
    });
  }, []);

  const handleDeleteError = useCallback(
    (error: unknown, id: number) => {
      handleError({
        error,
        customTitle: `Error al desactivar el Responsable #${id}`,
      });
    },
    [handleError]
  );

  const { mutate: deleteEmployee, isPending: isDeleting } = useDeleteEmployee();

  const {
    close: handleCloseDeleteAlert,
    confirm: handleConfirmDeleteAlert,
    isOpen: showDeleteAlert,
    open: handleOpenDeleteAlert,
    variables: itemToDelete,
  } = useConfirmMutation(
    deleteEmployee,
    handleDeleteSuccess,
    handleDeleteError
  );

  const totalRecords = useMemo(
    () => employeesData?.meta?.total || 0,
    [employeesData?.meta?.total]
  );

  const isRefreshing = useMemo(
    () => isRefetchingEmployeesData || isFetchingEmployeesData,
    [isRefetchingEmployeesData, isFetchingEmployeesData]
  );

  const toggleSearchMode = useCallback(() => {
    setSearchMode((prev) => (prev === "realtime" ? "manual" : "realtime"));
  }, []);

  useHotkeys(
    "escape",
    (e) => {
      e.preventDefault();
      handleGoBack();
    },
    { scopes: ["esc-key"], enabled: true }
  );

  return (
    <main className="w-full max-w-7xl mx-auto h-full p-2 gap-2 flex flex-col">
      <div className="space-y-2 flex-shrink-0">
        {/* Header */}
        <header className="bg-background rounded-lg p-2 border border-border">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <TooltipButton
                tooltipContentProps={{ align: "start" }}
                onClick={handleGoBack}
                tooltip={
                  <p className="flex items-center gap-1">
                    Presiona <Kbd>esc</Kbd> para volver atrás
                  </p>
                }
                buttonProps={{
                  variant: "default",
                  type: "button",
                  className: "size-9",
                }}
              >
                <CornerUpLeft />
              </TooltipButton>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight">
                  Responsables
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestiona los Responsables de la aplicación
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Filtros */}
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-primary">
                <Filter className="size-5" />
                Filtros
              </CardTitle>

              <Button
                variant="ghost"
                onClick={toggleSearchMode}
                className="text-xs h-7 gap-1.5"
                title={
                  searchMode === "realtime"
                    ? "Cambiar a búsqueda manual"
                    : "Cambiar a búsqueda en tiempo real"
                }
              >
                <Zap
                  className={`h-3 w-3 ${
                    searchMode === "realtime"
                      ? "text-yellow-500 dark:text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
                {searchMode === "realtime" ? "Tiempo real" : "Manual"}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <section className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="nombre">Nombre de responsable</Label>
                  <Input
                    id="nombre"
                    placeholder="Buscar por nombre..."
                    value={filters.nombre ?? ""}
                    onChange={(e) => updateFilter("nombre", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchMode === "manual")
                        applyFilters();
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="apellido">Apellido de responsable</Label>
                  <Input
                    id="apellido"
                    placeholder="Buscar por apellido..."
                    value={filters.apellido ?? ""}
                    onChange={(e) => updateFilter("apellido", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchMode === "manual")
                        applyFilters();
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="activo">Estado</Label>
                  <Select
                    value={
                      filters.activo === undefined
                        ? "all"
                        : String(filters.activo)
                    }
                    onValueChange={(value) =>
                      updateFilter(
                        "activo",
                        value === "all" ? undefined : Number(value)
                      )
                    }
                  >
                    <SelectTrigger id="activo">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="1">Activos</SelectItem>
                      <SelectItem value="0">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end w-full">
                {searchMode === "manual" && (
                  <Button onClick={applyFilters}>
                    <Search className="size-4" />
                    Buscar
                  </Button>
                )}

                <TooltipButton
                  onClick={handleRefetchEmployeesData}
                  buttonProps={{ className: "w-8", disabled: isRefreshing }}
                  tooltip="Recargar datos"
                >
                  <RefreshCcw
                    className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </TooltipButton>

                <Button variant="outline" onClick={resetFilters}>
                  <FilterX className="size-4" />
                  Limpiar
                </Button>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <div className="flex-1 min-h-screen md:min-h-0 overflow-hidden">
        <EmployeeListTable
          employees={employeesData?.data || []}
          handleOpenDeleteAlert={handleOpenDeleteAlert}
          isLoadingEmployeesData={isLoadingEmployeesData}
          isErrorEmployeesData={isErrorEmployeesData}
          isFetchingEmployeesData={isFetchingEmployeesData}
          rows={queryFilters.pagina_registros}
          page={queryFilters.pagina}
          totalRecords={totalRecords}
          handleRowsChange={(rows) => setPageSize(rows)}
          onPageChange={setPage}
        />
      </div>

      {/* Modal desactivar — elimado lógico, no permanente */}
      <ConfirmationModal
        isOpen={showDeleteAlert}
        variant="warning"
        title="Desactivar Responsable"
        message={`¿Deseas desactivar al Responsable #${itemToDelete}?`}
        alertMessage="El responsable no será eliminado. Podrás reactivarlo cuando quieras."
        confirmText="Sí, desactivar"
        onClose={handleCloseDeleteAlert}
        onConfirm={handleConfirmDeleteAlert}
        isLoading={isDeleting}
      />
    </main>
  );
};

export default EmployeesScreen;
