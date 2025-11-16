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
    enablePagination?: boolean; // Paginación del lado del cliente

    // Paginación del servidor (controlada externamente)
    manualPagination?: boolean; // Si true, TÚ manejas la paginación
    pageCount?: number; // Total de páginas (para paginación manual)
    onPaginationChange?: (pagination: PaginationState) => void; // Callback cuando cambia página

    // Configuración de resize
    columnResizeMode?: ColumnResizeMode;

    // Estado inicial - Forma simple
    hiddenColumns?: string[]; // Array de IDs de columnas a ocultar por defecto
    defaultSortBy?: { id: string; desc?: boolean }[]; // Ordenamiento por defecto
    defaultSelectedRows?: string[]; // IDs de filas seleccionadas por defecto

    // Estado inicial - Forma avanzada (si necesitas más control)
    initialSorting?: SortingState;
    initialColumnVisibility?: VisibilityState;
    initialRowSelection?: RowSelectionState;
    initialColumnOrder?: ColumnOrderState;
    initialPageSize?: number;

    // Persistencia (usar una key única para cada tabla)
    persistenceKey?: string;
    persistColumnOrder?: boolean;
    persistColumnVisibility?: boolean;
    persistPageSize?: boolean;

    // Callbacks
    onRowSelectionChange?: (selection: RowSelectionState) => void;
    onSortingChange?: (sorting: SortingState) => void;
}

interface TablePersistence {
    columnOrder?: ColumnOrderState;
    columnVisibility?: VisibilityState;
    pageSize?: number;
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
    onRowSelectionChange,
    onSortingChange,
}: UseCustomTableOptions<TData>) {

    // Obtener el orden por defecto de las columnas
    const defaultColumnOrder = useMemo(() =>
        columns.map((col) => (col as any).accessorKey || (col as any).id || ''),
        [columns]
    );

    // Construir el estado inicial de visibilidad de columnas
    const buildInitialColumnVisibility = (): VisibilityState => {
        // Si hay visibilidad personalizada, usarla
        if (Object.keys(initialColumnVisibility).length > 0) {
            return initialColumnVisibility;
        }

        // Convertir hiddenColumns array a objeto de visibilidad
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

    // Cargar datos persistidos de localStorage
    const loadPersistedData = (): TablePersistence => {
        if (!persistenceKey) return {};

        const stored = loadFromStorage(persistenceKey);
        if (!stored) return {};

        const result: TablePersistence = {};

        if (persistColumnOrder && stored.columnOrder) {
            result.columnOrder = stored.columnOrder;
        }
        if (persistColumnVisibility && stored.columnVisibility) {
            result.columnVisibility = stored.columnVisibility;
        }
        if (persistPageSize && stored.pageSize) {
            result.pageSize = stored.pageSize;
        }

        return result;
    };

    const persistedData = loadPersistedData();

    // Estados de la tabla
    const [sorting, setSorting] = useState<SortingState>(buildInitialSorting());
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        persistedData.columnVisibility || buildInitialColumnVisibility()
    );
    const [rowSelection, setRowSelection] = useState<RowSelectionState>(buildInitialRowSelection());
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
        persistedData.columnOrder || initialColumnOrder || defaultColumnOrder
    );
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: persistedData.pageSize || initialPageSize,
    });

    // Persistir cambios en localStorage
    useEffect(() => {
        if (!persistenceKey) return;

        const dataToSave: TablePersistence = {};

        if (persistColumnVisibility) {
            dataToSave.columnVisibility = columnVisibility;
        }
        if (persistColumnOrder) {
            dataToSave.columnOrder = columnOrder;
        }
        if (persistPageSize) {
            dataToSave.pageSize = pagination.pageSize;
        }

        saveToStorage(persistenceKey, dataToSave);
    }, [columnVisibility, columnOrder, pagination.pageSize, persistenceKey, persistColumnVisibility, persistColumnOrder, persistPageSize]);

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
            pagination: enablePagination ? pagination : undefined,
        },
        onSortingChange: enableSorting ? handleSortingChange : undefined,
        onColumnVisibilityChange: enableColumnVisibility ? setColumnVisibility : undefined,
        onRowSelectionChange: enableRowSelection ? handleRowSelectionChange : undefined,
        onColumnOrderChange: enableColumnOrdering ? setColumnOrder : undefined,
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

    const resetAll = () => {
        resetColumnOrder();
        resetColumnVisibility();
        resetRowSelection();
        resetSorting();
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
        pagination,
        // Setters
        setSorting,
        setColumnVisibility,
        setRowSelection,
        setColumnOrder,
        setPagination,
        // Utilidades
        resetColumnOrder,
        resetColumnVisibility,
        resetRowSelection,
        resetSorting,
        resetAll,
        clearPersistedData,
    };
}