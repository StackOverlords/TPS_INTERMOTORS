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
  } from '@tanstack/react-table';
  import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
  import { useViewConfig } from './useViewConfig';
  import type { TableState } from '@/view-configs/viewConfigTypes';
  import { shouldPersistTableProperty } from '@/lib/viewConfigUtils';
  
  interface UseCustomTableOptions<TData> {
    data: TData[];
    columns: ColumnDef<TData>[];
    viewId: string;
  
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
  
    // Estado inicial
    hiddenColumns?: string[];
    defaultSortBy?: { id: string; desc?: boolean }[];
    defaultSelectedRows?: string[];
    initialSorting?: SortingState;
    initialColumnVisibility?: VisibilityState;
    initialRowSelection?: RowSelectionState;
    initialColumnOrder?: ColumnOrderState;
    initialPageSize?: number;
  
    // Callbacks
    onRowSelectionChange?: (selection: RowSelectionState) => void;
    onSortingChange?: (sorting: SortingState) => void;
  }
  
  export function useCustomTable<TData>({
    data,
    columns,
    viewId,
    enableSorting = true,
    enableColumnResizing = true,
    enableRowSelection = false,
    enableColumnVisibility = true,
    enableColumnOrdering = false,
    enablePagination = false,
    manualPagination = false,
    pageCount,
    onPaginationChange: externalPaginationChange,
    columnResizeMode = 'onChange',
    hiddenColumns = [],
    defaultSortBy = [],
    defaultSelectedRows = [],
    initialSorting = [],
    initialColumnVisibility = {},
    initialRowSelection = {},
    initialColumnOrder,
    initialPageSize = 10,
    onRowSelectionChange,
    onSortingChange,
  }: UseCustomTableOptions<TData>) {
    
    const { 
      config, 
      isLoading: isLoadingConfig,
      updateTableState: updateTableStateInStore,
    } = useViewConfig(viewId);
  
    // ✅ Ref para rastrear si ya se inicializó
    const isInitializedRef = useRef(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
    const defaultColumnOrder = useMemo(() =>
      columns.map((col) => (col as any).accessorKey || (col as any).id || ''),
      [columns]
    );
  
    // ✅ Construir estado inicial (memoizado)
    const buildInitialState = useCallback(() => {
      const savedTableState = config.table?.state;
      const tableBehaviors = config.table?.behaviors;
  
      return {
        columnVisibility: savedTableState?.columnVisibility || 
          (Object.keys(initialColumnVisibility).length > 0 
            ? initialColumnVisibility 
            : hiddenColumns.reduce((acc, col) => ({ ...acc, [col]: false }), {} as VisibilityState)),
  
        columnOrder: savedTableState?.columnOrder || 
          initialColumnOrder || 
          defaultColumnOrder,
  
        sorting: savedTableState?.sorting || 
          (initialSorting.length > 0 
            ? initialSorting 
            : defaultSortBy.map(s => ({ id: s.id, desc: s.desc ?? false }))),
  
        pagination: {
          pageIndex: savedTableState?.pagination?.pageIndex ?? 0,
          pageSize: savedTableState?.pagination?.pageSize ?? 
            tableBehaviors?.defaultPageSize ?? 
            initialPageSize,
        },
  
        rowSelection: Object.keys(initialRowSelection).length > 0 
          ? initialRowSelection 
          : defaultSelectedRows.reduce((acc, id) => ({ ...acc, [id]: true }), {} as RowSelectionState),
  
        columnSizes: savedTableState?.columnSizes || {},
      };
    }, [
      config.table?.state,
      config.table?.behaviors,
      initialColumnVisibility,
      hiddenColumns,
      initialColumnOrder,
      defaultColumnOrder,
      initialSorting,
      defaultSortBy,
      initialPageSize,
      initialRowSelection,
      defaultSelectedRows,
    ]);
  
    const initialState = useMemo(() => buildInitialState(), [buildInitialState]);
  
    // Estados de la tabla
    const [sorting, setSorting] = useState<SortingState>(initialState.sorting);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
      initialState.columnVisibility
    );
    const [rowSelection, setRowSelection] = useState<RowSelectionState>(
      initialState.rowSelection
    );
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
      initialState.columnOrder
    );
    const [pagination, setPagination] = useState<PaginationState>(
      initialState.pagination
    );
    const [columnSizing, setColumnSizing] = useState<Record<string, number>>(
      initialState.columnSizes
    );
  
    // ✅ Marcar como inicializado después del primer render
    useEffect(() => {
      isInitializedRef.current = true;
    }, []);
  
    // ✅ Función de guardado MEMOIZADA (previene recreación)
    const saveTableState = useCallback(
      (updates: Partial<TableState>) => {
        // No guardar durante la inicialización
        if (!isInitializedRef.current || isLoadingConfig) return;
  
        // Cancelar timeout anterior
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
  
        // Crear nuevo timeout
        saveTimeoutRef.current = setTimeout(async () => {
          try {
            const currentTableState = config.table?.state || {};
            const newTableState: Partial<TableState> = { ...currentTableState };
  
            // Solo guardar propiedades que deben persistirse
            if (updates.columnVisibility !== undefined && 
                shouldPersistTableProperty(config, 'columnVisibility')) {
              newTableState.columnVisibility = updates.columnVisibility;
            }
  
            if (updates.columnOrder !== undefined && 
                shouldPersistTableProperty(config, 'columnOrder')) {
              newTableState.columnOrder = updates.columnOrder;
            }
  
            if (updates.columnSizes !== undefined && 
                shouldPersistTableProperty(config, 'columnSizes')) {
              newTableState.columnSizes = updates.columnSizes;
            }
  
            if (updates.pagination !== undefined && 
                shouldPersistTableProperty(config, 'pagination')) {
              newTableState.pagination = updates.pagination;
            }
  
            if (updates.sorting !== undefined && 
                shouldPersistTableProperty(config, 'sorting')) {
              newTableState.sorting = updates.sorting;
            }
  
            if (updates.filters !== undefined && 
                shouldPersistTableProperty(config, 'filters')) {
              newTableState.filters = updates.filters;
            }
  
            await updateTableStateInStore(newTableState);
          } catch (error) {
            console.error('Error saving table state:', error);
          }
        }, 500);
      },
      [config, isLoadingConfig, updateTableStateInStore]
    );
  
    // ✅ Guardar cambios - CON REFS para valores actuales
    const columnVisibilityRef = useRef(columnVisibility);
    const columnOrderRef = useRef(columnOrder);
    const columnSizingRef = useRef(columnSizing);
    const paginationRef = useRef(pagination);
    const sortingRef = useRef(sorting);
  
    // Actualizar refs cuando cambien los valores
    useEffect(() => {
      columnVisibilityRef.current = columnVisibility;
    }, [columnVisibility]);
  
    useEffect(() => {
      columnOrderRef.current = columnOrder;
    }, [columnOrder]);
  
    useEffect(() => {
      columnSizingRef.current = columnSizing;
    }, [columnSizing]);
  
    useEffect(() => {
      paginationRef.current = pagination;
    }, [pagination]);
  
    useEffect(() => {
      sortingRef.current = sorting;
    }, [sorting]);
  
    // ✅ Efecto único para guardar (sin dependencias circulares)
    useEffect(() => {
      if (!isInitializedRef.current || isLoadingConfig) return;
  
      // Debounce de 800ms para agrupar cambios
      const timeoutId = setTimeout(() => {
        saveTableState({
          columnVisibility: columnVisibilityRef.current,
          columnOrder: columnOrderRef.current,
          columnSizes: columnSizingRef.current,
          pagination: paginationRef.current,
          sorting: sortingRef.current,
        });
      }, 800);
  
      return () => clearTimeout(timeoutId);
    }, [
      // Solo las dependencias necesarias para detectar cambios
      columnVisibility,
      columnOrder,
      columnSizing,
      pagination,
      sorting,
      isLoadingConfig,
      // saveTableState ahora es estable gracias a useCallback
      saveTableState,
    ]);
  
    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }, []);
  
    // Manejar cambios con callbacks
    const handleSortingChange = useCallback((updater: any) => {
      setSorting(updater);
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange?.(newSorting);
    }, [sorting, onSortingChange]);
  
    const handleRowSelectionChange = useCallback((updater: any) => {
      setRowSelection(updater);
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      onRowSelectionChange?.(newSelection);
    }, [rowSelection, onRowSelectionChange]);
  
    const handlePaginationChange = useCallback((updater: any) => {
      setPagination(updater);
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
      externalPaginationChange?.(newPagination);
    }, [pagination, externalPaginationChange]);
  
    // Configuración de la tabla
    const table = useReactTable({
      data,
      columns,
      state: {
        sorting: enableSorting ? sorting : undefined,
        columnVisibility: enableColumnVisibility ? columnVisibility : undefined,
        rowSelection: enableRowSelection ? rowSelection : undefined,
        columnOrder: enableColumnOrdering ? columnOrder : undefined,
        pagination: enablePagination ? pagination : undefined,
        columnSizing: enableColumnResizing ? columnSizing : undefined,
      },
      onSortingChange: enableSorting ? handleSortingChange : undefined,
      onColumnVisibilityChange: enableColumnVisibility ? setColumnVisibility : undefined,
      onRowSelectionChange: enableRowSelection ? handleRowSelectionChange : undefined,
      onColumnOrderChange: enableColumnOrdering ? setColumnOrder : undefined,
      onPaginationChange: enablePagination ? handlePaginationChange : undefined,
      onColumnSizingChange: enableColumnResizing ? setColumnSizing : undefined,
      
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
      getPaginationRowModel: enablePagination && !manualPagination 
        ? getPaginationRowModel() 
        : undefined,
      
      columnResizeMode: enableColumnResizing ? columnResizeMode : undefined,
      enableColumnResizing,
      enableRowSelection,
      enableSorting,
      
      manualPagination,
      pageCount: manualPagination ? pageCount : undefined,
    });
  
    // Funciones de reset
    const resetColumnOrder = useCallback(async () => {
      setColumnOrder(defaultColumnOrder);
      await updateTableStateInStore({
        ...config.table?.state,
        columnOrder: undefined,
      });
    }, [defaultColumnOrder, config.table?.state, updateTableStateInStore]);
  
    const resetColumnVisibility = useCallback(async () => {
      const defaultVisibility = hiddenColumns.reduce(
        (acc, col) => ({ ...acc, [col]: false }), 
        {} as VisibilityState
      );
      setColumnVisibility(defaultVisibility);
      await updateTableStateInStore({
        ...config.table?.state,
        columnVisibility: undefined,
      });
    }, [hiddenColumns, config.table?.state, updateTableStateInStore]);
  
    const resetColumnSizes = useCallback(async () => {
      setColumnSizing({});
      await updateTableStateInStore({
        ...config.table?.state,
        columnSizes: undefined,
      });
    }, [config.table?.state, updateTableStateInStore]);
  
    const resetRowSelection = useCallback(() => {
      const defaultSelection = defaultSelectedRows.reduce(
        (acc, id) => ({ ...acc, [id]: true }), 
        {} as RowSelectionState
      );
      setRowSelection(defaultSelection);
    }, [defaultSelectedRows]);
  
    const resetSorting = useCallback(async () => {
      const defaultSort = defaultSortBy.map(s => ({ 
        id: s.id, 
        desc: s.desc ?? false 
      }));
      setSorting(defaultSort);
      await updateTableStateInStore({
        ...config.table?.state,
        sorting: undefined,
      });
    }, [defaultSortBy, config.table?.state, updateTableStateInStore]);
  
    const resetPagination = useCallback(async () => {
      setPagination({ 
        pageIndex: 0, 
        pageSize: config.table?.behaviors?.defaultPageSize ?? initialPageSize 
      });
      await updateTableStateInStore({
        ...config.table?.state,
        pagination: undefined,
      });
    }, [config.table?.behaviors?.defaultPageSize, initialPageSize, config.table?.state, updateTableStateInStore]);
  
    const resetAll = useCallback(async () => {
      await resetColumnOrder();
      await resetColumnVisibility();
      await resetColumnSizes();
      resetRowSelection();
      await resetSorting();
      await resetPagination();
    }, [
      resetColumnOrder,
      resetColumnVisibility, 
      resetColumnSizes,
      resetRowSelection,
      resetSorting,
      resetPagination,
    ]);
  
    const clearPersistedData = useCallback(async () => {
      await updateTableStateInStore(undefined);
      await resetAll();
    }, [updateTableStateInStore, resetAll]);
  
    return {
      table,
      sorting,
      columnVisibility,
      rowSelection,
      columnOrder,
      pagination,
      columnSizing,
      setSorting,
      setColumnVisibility,
      setRowSelection,
      setColumnOrder,
      setPagination,
      setColumnSizing,
      resetColumnOrder,
      resetColumnVisibility,
      resetColumnSizes,
      resetRowSelection,
      resetSorting,
      resetPagination,
      resetAll,
      clearPersistedData,
      isLoadingConfig,
    };
  }