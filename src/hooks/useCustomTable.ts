import {
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnOrderState,
    type ColumnResizeMode,
    type PaginationState,
    type RowSelectionState,
    type SortingState,
    type VisibilityState,
    type ColumnSizingState,
  } from '@tanstack/react-table';
  import { useEffect, useMemo, useState } from 'react';
  
  interface UseCustomTableOptions<TData> {
      data: TData[];
      columns: ColumnDef<TData>[];
  
      // Configuración de características
      enableSorting?: boolean;
      enableColumnResizing?: boolean;
      enableRowSelection?: boolean;
      enableColumnVisibility?: boolean;
      enableColumnOrdering?: boolean;
      enablePagination?: boolean;
  
      // Paginación del servidor
      manualPagination?: boolean;
      pageCount?: number;
      onPaginationChange?: (pagination: PaginationState) => void;
  
      // Configuración de resize
      columnResizeMode?: ColumnResizeMode;
  
      // Estado inicial - Forma simple
      hiddenColumns?: string[];
      defaultSortBy?: { id: string; desc?: boolean }[];
      defaultSelectedRows?: string[];
  
      // Estado inicial - Forma avanzada
      initialSorting?: SortingState;
      initialColumnVisibility?: VisibilityState;
      initialRowSelection?: RowSelectionState;
      initialColumnOrder?: ColumnOrderState;
      initialPageSize?: number;
  
      // Persistencia
      persistenceKey?: string;
      persistColumnOrder?: boolean;
      persistColumnVisibility?: boolean;
      persistPageSize?: boolean;
      persistColumnSizing?: boolean;
  
      // Callbacks
      onRowSelectionChange?: (selection: RowSelectionState) => void;
      onSortingChange?: (sorting: SortingState) => void;
  }
  
  interface TablePersistence {
      columnOrder?: ColumnOrderState;
      columnVisibility?: VisibilityState;
      pageSize?: number;
      columnSizing?: ColumnSizingState;
      columnIds?: string[]; // Hash de columnas para detectar cambios
  }
  
  // Funciones para manejar localStorage de forma segura
  const loadFromStorage = (key: string): TablePersistence | null => {
      try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
      } catch (error) {
          console.warn(`Error loading from localStorage for key "${key}":`, error);
          return null;
      }
  };
  
  const saveToStorage = (key: string, data: TablePersistence): void => {
      try {
          localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
          console.warn(`Error saving to localStorage for key "${key}":`, error);
      }
  };
  
  /**
   * Detecta si hubo cambios en las columnas comparando los IDs
   */
  const hasColumnsChanged = (
      currentColumnIds: string[],
      persistedColumnIds: string[] | undefined
  ): boolean => {
      if (!persistedColumnIds) return true;
      
      const currentSet = new Set(currentColumnIds);
      const persistedSet = new Set(persistedColumnIds);
      
      // Si hay diferencia en cantidad, hubo cambios
      if (currentSet.size !== persistedSet.size) return true;
      
      // Verificar si hay columnas nuevas o eliminadas
      for (const id of currentColumnIds) {
          if (!persistedSet.has(id)) return true; // Nueva columna
      }
      
      for (const id of persistedColumnIds) {
          if (!currentSet.has(id)) return true; // Columna eliminada
      }
      
      return false;
  };
  
  /**
   * Migra el columnOrder persistido para incluir nuevas columnas y eliminar obsoletas
   * Mantiene el orden de las columnas existentes y agrega las nuevas en sus posiciones naturales
   */
  const migrateColumnOrder = (
      persistedOrder: ColumnOrderState | undefined,
      currentColumns: string[]
  ): ColumnOrderState => {
      if (!persistedOrder || persistedOrder.length === 0) {
          return currentColumns;
      }
  
      const currentColumnsSet = new Set(currentColumns);
      const persistedSet = new Set(persistedOrder);
  
      // Filtrar columnas obsoletas
      const validPersistedOrder = persistedOrder.filter(colId => 
          currentColumnsSet.has(colId)
      );
  
      // Identificar nuevas columnas
      const newColumns = currentColumns.filter(colId => 
          !persistedSet.has(colId)
      );
  
      // Si no hay nuevas columnas, retornar el orden válido
      if (newColumns.length === 0) {
          return validPersistedOrder;
      }
  
      // Insertar nuevas columnas en sus posiciones naturales
      const result: ColumnOrderState = [];
      
      for (const currentCol of currentColumns) {
          if (persistedSet.has(currentCol)) {
              // Columna existente: solo agregar si no está ya en result
              if (!result.includes(currentCol) && validPersistedOrder.includes(currentCol)) {
                  // Agregar todas las columnas válidas hasta este punto
                  for (const persistedCol of validPersistedOrder) {
                      if (!result.includes(persistedCol)) {
                          result.push(persistedCol);
                          if (persistedCol === currentCol) break;
                      }
                  }
              }
          } else {
              // Nueva columna: insertar en su posición natural
              result.push(currentCol);
          }
      }
  
      // Agregar cualquier columna válida restante
      for (const col of validPersistedOrder) {
          if (!result.includes(col)) {
              result.push(col);
          }
      }
  
      return result;
  };
  
  /**
   * Limpia columnVisibility de columnas que ya no existen
   */
  const migrateColumnVisibility = (
      persistedVisibility: VisibilityState | undefined,
      currentColumns: string[]
  ): VisibilityState => {
      if (!persistedVisibility) return {};
  
      const currentColumnsSet = new Set(currentColumns);
      const result: VisibilityState = {};
  
      Object.entries(persistedVisibility).forEach(([colId, isVisible]) => {
          if (currentColumnsSet.has(colId)) {
              result[colId] = isVisible;
          }
      });
  
      return result;
  };
  
  /**
   * Limpia columnSizing de columnas que ya no existen
   */
  const migrateColumnSizing = (
      persistedSizing: ColumnSizingState | undefined,
      currentColumns: string[]
  ): ColumnSizingState => {
      if (!persistedSizing) return {};
  
      const currentColumnsSet = new Set(currentColumns);
      const result: ColumnSizingState = {};
  
      Object.entries(persistedSizing).forEach(([colId, size]) => {
          if (currentColumnsSet.has(colId)) {
              result[colId] = size;
          }
      });
  
      return result;
  };
  
  export function useCustomTable<TData>({
      data,
      columns,
      enableSorting = true,
      enableColumnResizing = true,
      enableRowSelection = false,
      enableColumnVisibility = true,
      enableColumnOrdering = false,
      enablePagination = false,
      columnResizeMode = 'onChange',
      hiddenColumns = [],
      defaultSortBy = [],
      defaultSelectedRows = [],
      initialSorting = [],
      initialColumnVisibility = {},
      initialRowSelection = {},
      initialColumnOrder,
      initialPageSize = 10,
      persistenceKey,
      persistColumnOrder = false,
      persistColumnVisibility = false,
      persistPageSize = false,
      persistColumnSizing = true,
      onRowSelectionChange,
      onSortingChange,
  }: UseCustomTableOptions<TData>) {
  
      // Obtener el orden por defecto de las columnas
      const defaultColumnOrder = useMemo(() =>
          columns.map((col) => {
              // Priorizar 'id' sobre 'accessorKey' para consistencia
              const colId = (col as any).id || (col as any).accessorKey || '';
              return colId;
          }).filter(Boolean), // Eliminar strings vacíos
          [columns]
      );
  
      // Construir el estado inicial de visibilidad de columnas
      const buildInitialColumnVisibility = (): VisibilityState => {
          if (Object.keys(initialColumnVisibility).length > 0) {
              return initialColumnVisibility;
          }
  
          const visibility: VisibilityState = {};
          hiddenColumns.forEach(columnId => {
              visibility[columnId] = false;
          });
  
          return visibility;
      };
  
      // Construir el estado inicial de sorting
      const buildInitialSorting = (): SortingState => {
          if (initialSorting.length > 0) {
              return initialSorting;
          }
  
          return defaultSortBy.map(sort => ({
              id: sort.id,
              desc: sort.desc ?? false,
          }));
      };
  
      // Construir el estado inicial de row selection
      const buildInitialRowSelection = (): RowSelectionState => {
          if (Object.keys(initialRowSelection).length > 0) {
              return initialRowSelection;
          }
  
          const selection: RowSelectionState = {};
          defaultSelectedRows.forEach(rowId => {
              selection[rowId] = true;
          });
  
          return selection;
      };
  
      // AUTOMÁTICO: Cargar y migrar datos persistidos detectando cambios automáticamente
      const loadPersistedData = useMemo((): TablePersistence => {
          if (!persistenceKey) return {};
  
          const stored = loadFromStorage(persistenceKey);
          if (!stored) return {};
  
          // DETECCIÓN MEJORADA: Verificar si las columnas cambiaron
          // Comparar contra columnOrder (no columnIds) porque columnIds puede estar desactualizado
          const columnsToCompare = stored.columnOrder || stored.columnIds;
          const columnsChanged = hasColumnsChanged(defaultColumnOrder, columnsToCompare);
  
          const result: TablePersistence = {
              columnIds: defaultColumnOrder, // Siempre guardar los IDs actuales
          };
  
          if (persistColumnOrder && stored.columnOrder) {
              if (columnsChanged) {
                  // MIGRAR: Limpiar y reordenar columnas automáticamente
                  result.columnOrder = migrateColumnOrder(stored.columnOrder, defaultColumnOrder);
              } else {
                  result.columnOrder = stored.columnOrder;
              }
          }
  
          if (persistColumnVisibility && stored.columnVisibility) {
              if (columnsChanged) {
                  // MIGRAR: Limpiar columnas obsoletas
                  const migratedVisibility = migrateColumnVisibility(stored.columnVisibility, defaultColumnOrder);
                  const initialVis = buildInitialColumnVisibility();
                  result.columnVisibility = { ...initialVis, ...migratedVisibility };
              } else {
                  result.columnVisibility = stored.columnVisibility;
              }
          }
  
          if (persistPageSize && stored.pageSize) {
              result.pageSize = stored.pageSize;
          }
  
          if (persistColumnSizing && stored.columnSizing) {
              if (columnsChanged) {
                  // MIGRAR: Limpiar tamaños de columnas obsoletas
                  result.columnSizing = migrateColumnSizing(stored.columnSizing, defaultColumnOrder);
              } else {
                  result.columnSizing = stored.columnSizing;
              }
          }
  
          // Si hubo migración, guardar inmediatamente el estado migrado
          if (columnsChanged && persistenceKey) {
              saveToStorage(persistenceKey, result);
          }
  
          return result;
      }, [defaultColumnOrder, persistenceKey, persistColumnOrder, persistColumnVisibility, persistPageSize, persistColumnSizing]);
  
      const persistedData = loadPersistedData;
  
      // Estados de la tabla
      const [sorting, setSorting] = useState<SortingState>(buildInitialSorting());
      const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
          persistedData.columnVisibility || buildInitialColumnVisibility()
      );
      const [rowSelection, setRowSelection] = useState<RowSelectionState>(buildInitialRowSelection());
      const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
          persistedData.columnOrder || initialColumnOrder || defaultColumnOrder
      );
      const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(
          persistedData.columnSizing || {}
      );
      const [pagination, setPagination] = useState<PaginationState>({
          pageIndex: 0,
          pageSize: persistedData.pageSize || initialPageSize,
      });
  
      // Persistir cambios en localStorage
      useEffect(() => {
          if (!persistenceKey) return;
  
          const dataToSave: TablePersistence = {
              columnIds: defaultColumnOrder, // Siempre guardar los IDs actuales
          };
  
          if (persistColumnVisibility) {
              dataToSave.columnVisibility = columnVisibility;
          }
          if (persistColumnOrder) {
              dataToSave.columnOrder = columnOrder;
          }
          if (persistPageSize) {
              dataToSave.pageSize = pagination.pageSize;
          }
          if (persistColumnSizing) {
              dataToSave.columnSizing = columnSizing;
          }
  
          saveToStorage(persistenceKey, dataToSave);
      }, [columnVisibility, columnOrder, pagination.pageSize, columnSizing, persistenceKey, persistColumnVisibility, persistColumnOrder, persistPageSize, persistColumnSizing, defaultColumnOrder]);
  
      // Manejar cambios con callbacks
      const handleSortingChange = (updater: any) => {
          setSorting(updater);
          const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
          onSortingChange?.(newSorting);
      };
  
      const handleRowSelectionChange = (updater: any) => {
          setRowSelection(updater);
          const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
          onRowSelectionChange?.(newSelection);
      };
  
      // Configuración de la tabla
      const table = useReactTable({
          data,
          columns,
          state: {
              sorting: enableSorting ? sorting : undefined,
              columnVisibility: enableColumnVisibility ? columnVisibility : undefined,
              rowSelection: enableRowSelection ? rowSelection : undefined,
              columnOrder: enableColumnOrdering ? columnOrder : undefined,
              columnSizing: enableColumnResizing ? columnSizing : undefined,
              pagination: enablePagination ? pagination : undefined,
          },
          onSortingChange: enableSorting ? handleSortingChange : undefined,
          onColumnVisibilityChange: enableColumnVisibility ? setColumnVisibility : undefined,
          onRowSelectionChange: enableRowSelection ? handleRowSelectionChange : undefined,
          onColumnOrderChange: enableColumnOrdering ? setColumnOrder : undefined,
          onColumnSizingChange: enableColumnResizing ? setColumnSizing : undefined,
          onPaginationChange: enablePagination ? setPagination : undefined,
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
          getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
          columnResizeMode: enableColumnResizing ? columnResizeMode : undefined,
          enableColumnResizing,
          enableRowSelection,
          enableSorting,
      });
  
      // Funciones de utilidad
      const resetColumnOrder = () => {
          setColumnOrder(defaultColumnOrder);
      };
  
      const resetColumnVisibility = () => {
          setColumnVisibility(buildInitialColumnVisibility());
      };
  
      const resetRowSelection = () => {
          setRowSelection(buildInitialRowSelection());
      };
  
      const resetSorting = () => {
          setSorting(buildInitialSorting());
      };
  
      const resetColumnSizing = () => {
          setColumnSizing({});
      };
  
      const resetAll = () => {
          resetColumnOrder();
          resetColumnVisibility();
          resetRowSelection();
          resetSorting();
          resetColumnSizing();
          if (enablePagination) {
              setPagination({ pageIndex: 0, pageSize: initialPageSize });
          }
      };
  
      const clearPersistedData = () => {
          if (persistenceKey) {
              try {
                  localStorage.removeItem(persistenceKey);
              } catch (error) {
                  console.warn('Error clearing persisted data:', error);
              }
          }
          resetAll();
      };
  
      return {
          table,
          // Estados
          sorting,
          columnVisibility,
          rowSelection,
          columnOrder,
          columnSizing,
          pagination,
          // Setters
          setSorting,
          setColumnVisibility,
          setRowSelection,
          setColumnOrder,
          setColumnSizing,
          setPagination,
          // Utilidades
          resetColumnOrder,
          resetColumnVisibility,
          resetRowSelection,
          resetSorting,
          resetColumnSizing,
          resetAll,
          clearPersistedData,
      };
  }