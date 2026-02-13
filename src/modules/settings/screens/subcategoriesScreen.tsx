import { Kbd } from "@/components/atoms/kbd";
import TooltipButton from "@/components/common/TooltipButton";
import { useGoBack } from "@/hooks/useGoBack";
import {
  CornerUpLeft,
  Edit,
  Filter,
  Layers,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { Input } from "@/components/atoms/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Button } from "@/components/atoms/button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useLocation, useNavigate } from "react-router";
import ConfirmationModal from "@/components/common/confirmationModal";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import { useSubcategoryFilters } from "../hooks/subcategory/useSubcategoryFilters";
import { useGetAllSubcategories } from "../hooks/subcategory/useGetAllSubcategories";
import { useDeleteSubcategory } from "../hooks/subcategory/useDeleteSubcategory";
import type { Subcategory } from "../types/subcategory.types";
import { Label } from "@/components/atoms/label";
import SubcategoryFormDialog from "../components/subcategoryFormDialog";
import { useCategoriesWithSubcategories } from "@/modules/shared/hooks/useCategories";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { formatCell } from "@/utils/formatCell";
import { useKeyboardNavigation } from "@/hooks/keyBindings/useKeyboardNavigation";
import authSDK from "@/services/sdk-simple-auth";
import { useCustomTable } from "@/hooks/useCustomTable";

const SubcategoriesScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categorySearch, setCategroySearch] = useState<string>("");
  const user = authSDK.getCurrentUser();
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  const { filters, updateFilter, debouncedFilters, resetFilters, setPage } =
    useSubcategoryFilters();

  const {
    data: subcategoriesData,
    refetch: handleRefetchSubcategoriesData,
    isFetching: isFetchingSubcategoriesData,
    isRefetching: isRefetchingSubcategoriesData,
    isLoading: isLoadingSubcategoriesData,
    isError: isErrorSubcategoriesData,
  } = useGetAllSubcategories(debouncedFilters);

  const {
    data: categoriesData,
    isLoading: isLoadingCategoriesData,
    isFetching: isFetchingCategoriesData,
  } = useCategoriesWithSubcategories(categorySearch);

  const { handleError } = useErrorHandler();

  const handleGoBack = useGoBack("/dashboard/settings");

  const handleDeleteSuccess = useCallback((_data: unknown, id: number) => {
    showSuccessToast({
      title: "Subcategoria eliminada",
      description: `La Subcategoria #${id} se eliminó exitosamente`,
      duration: 5000,
    });
    setEditingId(null);
  }, []);

  const handleDeleteError = useCallback(
    (error: unknown, id: number) => {
      handleError({
        error,
        customTitle: `Error al eliminar la Subcategoria #${id}`,
      });
    },
    [handleError]
  );

  const { mutate: deleteSubcategory, isPending: isDeleting } =
    useDeleteSubcategory();

  const {
    close: handleCloseDeleteAlert,
    confirm: handleConfirmDeleteAlert,
    isOpen: showDeleteAlert,
    open: handleOpenDeleteAlert,
    variables: itemToDelete,
  } = useConfirmMutation(
    deleteSubcategory,
    handleDeleteSuccess,
    handleDeleteError
  );

  const isEditing = useMemo(() => editingId !== null, [editingId]);
  const totalRecords = useMemo(
    () => subcategoriesData?.meta?.total || 0,
    [subcategoriesData?.meta?.total]
  );
  const isRefreshing = useMemo(
    () => isRefetchingSubcategoriesData || isFetchingSubcategoriesData,
    [isRefetchingSubcategoriesData, isFetchingSubcategoriesData]
  );

  useEffect(() => {
    if (location.state?.openModal) {
      handleAddSubcategory();
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleAddSubcategory = useCallback(() => {
    setEditingId(null);
    setIsDialogOpen(true);
  }, []);

  const handleEditSubcategory = useCallback((id: number) => {
    setEditingId(id);
    setIsDialogOpen(true);
  }, []);

  const handleDialogToggle = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingId(null);
    }
  }, []);

  const handleRowsChange = useCallback(
    (rows: number) => {
      updateFilter("pagina_registros", rows);
    },
    [updateFilter]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFilter("subcategoria", e.target.value);
    },
    [updateFilter]
  );

  const columns = useMemo<ColumnDef<Subcategory>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 40,
        minSize: 30,
        cell: ({ getValue }) => (
          <span className="font-medium font-mono text-foreground">
            #{getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: "subcategoria",
        header: "Subcategoria",
        cell: ({ getValue }) => (
          <h3 className="font-medium text-foreground truncate">
            {getValue<string>()}
          </h3>
        ),
      },
      {
        accessorFn: (row) => row.categoria?.categoria,
        id: "categoria",
        header: "Categoria",
        cell: ({ getValue, row }) => {
          const value = getValue<string>();
          const id = row.original.categoria?.id;
          return (
            <div>
              <h3
                className={`truncate ${value ? "font-medium text-foreground" : "italic text-muted-foreground"}`}
              >
                {formatCell(value)}
              </h3>
              {id && (
                <span className="text-xs text-muted-foreground font-mono">
                  ID: {id}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        size: 80,
        minSize: 60,
        cell: ({ row }) => {
          const id = row.original.id;
          return (
            <div className="flex items-center gap-2">
              <Button
                className="w-8 cursor-pointer"
                variant={"outline"}
                onClick={() => handleEditSubcategory(id)}
              >
                <Edit className="size-4" />
              </Button>

              <Button
                className="w-8 cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 bg-transparent hover:border-red-200 dark:hover:border-red-600"
                variant={"outline"}
                onClick={() => handleOpenDeleteAlert(id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleEditSubcategory, handleOpenDeleteAlert]
  );

  const { table } = useCustomTable({
    data: subcategoriesData?.data || [],
    columns,

    // Configuración de características
    enableSorting: false,
    enableColumnResizing: true,
    enableRowSelection: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,

    // Configuración de resize
    columnResizeMode: "onChange",

    // Persistencia con key única por usuario
    persistenceKey: `subcategories-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const {
    selectedIndex,
    setSelectedIndex,
    isFocused,
    // hotkeys
  } = useKeyboardNavigation<Subcategory, HTMLTableElement>({
    items: subcategoriesData?.data || [],
    containerRef: tableRef,
    isDragging: isDraggingColumn,
    onPrimaryAction: (subcategory) => {
      handleEditSubcategory(subcategory.id);
    },
    getItemId: (subcategory) => subcategory.id,
  });
  const handleRowClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleDragStart = useCallback(() => {
    setIsDraggingColumn(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDraggingColumn(false);
  }, []);

  // Shortcuts
  useHotkeys(
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

  return (
    <main className="w-full max-w-5xl mx-auto h-full p-2 gap-2 flex flex-col">
      <div className="space-y-2 flex-shrink-0">
        <header className="bg-background rounded-lg p-2 border border-border">
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
                  className: "size-9",
                }}
              >
                <CornerUpLeft />
              </TooltipButton>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight">
                  Subcategorías
                </h1>
                <p className="text-sm text-muted-foreground">
                  Subcategorías de los productos
                </p>
              </div>
            </div>
          </div>
        </header>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-primary">
              <Filter className="size-5 text-foreground" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <section className="grid gap-2 sm:grid-cols-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="subcategoria">Subcategoría</Label>
                  <div className="flex w-full relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar subcategoria..."
                      value={filters.subcategoria}
                      onChange={handleSearchChange}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <ComboboxSelect
                    value={filters.categoria}
                    onChange={(value) => {
                      const parsedValue =
                        value === "all" ? undefined : Number(value);
                      updateFilter("categoria", parsedValue);
                    }}
                    options={(categoriesData || []).map((cat) => ({
                      id: String(cat.id),
                      categoria: cat.categoria,
                    }))}
                    optionTag={"categoria"}
                    enableAllOption={true}
                    isLoadingData={isLoadingCategoriesData}
                    enableExternalSearch={true}
                    onSearch={(value) => setCategroySearch(value)}
                    isSearching={isFetchingCategoriesData}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end w-full items-end">
                <TooltipButton
                  onClick={handleRefetchSubcategoriesData}
                  buttonProps={{
                    className: "w-8",
                    disabled: isRefreshing,
                  }}
                  tooltip={"Recargar datos"}
                >
                  <RefreshCcw
                    className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </TooltipButton>

                <Button onClick={resetFilters}>
                  <Filter className="size-4" />
                  Limpiar Filtros
                </Button>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-h-screen md:min-h-0 overflow-hidden">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 flex-shrink-0">
            <div>
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-primary">
                <Layers className="size-5 text-foreground" />
                Gestionar Subcategorías
              </CardTitle>
              <CardDescription className="text-sm">
                {totalRecords} elemento{totalRecords !== 1 ? "s" : ""}{" "}
                registrado
                {totalRecords !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <SubcategoryFormDialog
              isOpen={isDialogOpen}
              onOpenChange={handleDialogToggle}
              isEditing={isEditing}
              editingId={editingId}
              categories={categoriesData || []}
              isLoadingCategories={isLoadingCategoriesData}
              isSearching={isFetchingCategoriesData}
              onSearchCategories={(value) => setCategroySearch(value)}
            />
          </CardHeader>
          <CardContent className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0">
              <div className="h-full overflow-auto">
                <CustomizableTable
                  table={table}
                  isLoading={isLoadingSubcategoriesData}
                  isError={isErrorSubcategoriesData}
                  isFetching={isFetchingSubcategoriesData}
                  rows={filters.pagina_registros}
                  errorMessage="Ocurrió un error al cargar las subcategorías."
                  noDataMessage="No se encontraron subcategorías."
                  selectedRowIndex={selectedIndex}
                  onRowClick={handleRowClick}
                  tableRef={tableRef}
                  focused={isFocused}
                  keyboardNavigationEnabled={true}
                  enableColumnReordering={true}
                  enableSorting={false}
                  onDragEnd={handleDragEnd}
                  onDragStart={handleDragStart}
                />
              </div>
            </div>

            {/* Pagination - FIJO en la parte inferior */}
            <div className="flex-shrink-0 border-t border-border bg-background">
              <Pagination
                className="border-0 px-0 pt-2 pb-0"
                currentPage={filters.pagina || 1}
                onPageChange={setPage}
                totalData={totalRecords}
                onShowRowsChange={handleRowsChange}
                showRows={filters.pagina_registros}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmationModal
        isOpen={showDeleteAlert}
        title="Eliminar subcategoria"
        message={`¿Estás seguro de que deseas eliminar la subcategoria #${itemToDelete}?`}
        onClose={handleCloseDeleteAlert}
        onConfirm={handleConfirmDeleteAlert}
        isLoading={isDeleting}
      />
    </main>
  );
};
export default SubcategoriesScreen;
