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

    // Persistencia local (específica de esta tabla)
    persistenceKey?: string;
    persistColumnOrder?: boolean;
    persistColumnVisibility?: boolean;
    persistPageSize?: boolean;
    persistColumnSizing?: boolean;

    // NUEVO: Persistencia compartida (entre tablas similares)
    sharedPersistenceKey?: string; // Key compartida entre múltiples tablas

    // Callbacks
    onRowSelectionChange?: (selection: RowSelectionState) => void;
    onSortingChange?: (sorting: SortingState) => void;
}

interface TablePersistence {
    columnOrder?: ColumnOrderState;
    columnVisibility?: VisibilityState;
    pageSize?: number;
    columnSizing?: ColumnSizingState;
    columnIds?: string[];
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
 * NUEVA: Mezcla orden compartido con orden local
 * Respeta el orden del shared para columnas comunes
 * Inserta columnas exclusivas locales en sus posiciones originales
 */
const mergeSharedAndLocalOrder = (
    sharedOrder: string[],
    localOrder: string[],
    currentColumns: string[]
): ColumnOrderState => {
    const sharedSet = new Set(sharedOrder);
    const currentSet = new Set(currentColumns);

    // Identificar columnas que solo están en local (exclusivas)
    const localOnlyColumns = localOrder.filter(col =>
        !sharedSet.has(col) && currentSet.has(col)
    );

    // Si no hay columnas exclusivas, retornar el orden compartido
    if (localOnlyColumns.length === 0) {
        return sharedOrder.filter(col => currentSet.has(col));
    }

    // Encontrar las posiciones originales de las columnas exclusivas
    const localOnlyPositions = new Map<string, number>();
    localOnlyColumns.forEach(col => {
        const idx = currentColumns.indexOf(col);
        if (idx !== -1) {
            localOnlyPositions.set(col, idx);
        }
    });

    // Construir el resultado: insertar columnas exclusivas en sus posiciones
    const result: ColumnOrderState = [];
    let sharedIndex = 0;

    for (let i = 0; i < currentColumns.length; i++) {
        const currentCol = currentColumns[i];

        // Si esta columna es exclusiva local, agregarla
        if (localOnlyColumns.includes(currentCol)) {
            result.push(currentCol);
        }
        // Si no, agregar la siguiente columna del orden compartido
        else if (sharedIndex < sharedOrder.length) {
            // Buscar la siguiente columna compartida que exista en current
            while (sharedIndex < sharedOrder.length) {
                const sharedCol = sharedOrder[sharedIndex];
                sharedIndex++;

                if (currentSet.has(sharedCol) && !result.includes(sharedCol)) {
                    result.push(sharedCol);
                    break;
                }
            }
        }
    }

    // Agregar columnas compartidas restantes que no se procesaron
    for (const col of sharedOrder) {
        if (currentSet.has(col) && !result.includes(col)) {
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

/**
 * NUEVA: Mezcla datos compartidos con locales, dando prioridad a shared
 */
const mergeSharedAndLocalVisibility = (
    sharedVisibility: VisibilityState,
    localVisibility: VisibilityState
): VisibilityState => {
    // Shared tiene prioridad, pero incluimos columnas que solo están en local
    return { ...localVisibility, ...sharedVisibility };
};

const mergeSharedAndLocalSizing = (
    sharedSizing: ColumnSizingState,
    localSizing: ColumnSizingState
): ColumnSizingState => {
    // Shared tiene prioridad, pero incluimos columnas que solo están en local
    return { ...localSizing, ...sharedSizing };
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
    sharedPersistenceKey, // NUEVO
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

    // AUTOMÁTICO: Cargar y migrar datos con soporte híbrido (shared + local)
    const loadPersistedData = useMemo((): TablePersistence => {
        if (!persistenceKey) return {};

        // Cargar datos locales
        const localData = loadFromStorage(persistenceKey);

        // Cargar datos compartidos (si existe la key)
        const sharedData = sharedPersistenceKey
            ? loadFromStorage(sharedPersistenceKey)
            : null;

        if (!localData && !sharedData) return {};

        const result: TablePersistence = {
            columnIds: defaultColumnOrder,
        };

        // === COLUMN ORDER ===
        if (persistColumnOrder) {
            let finalOrder = defaultColumnOrder;

            if (sharedData?.columnOrder && localData?.columnOrder) {
                // MODO HÍBRIDO: Mezclar shared + local
                const migratedShared = migrateColumnOrder(sharedData.columnOrder, defaultColumnOrder);
                const migratedLocal = migrateColumnOrder(localData.columnOrder, defaultColumnOrder);
                finalOrder = mergeSharedAndLocalOrder(migratedShared, migratedLocal, defaultColumnOrder);
            } else if (sharedData?.columnOrder) {
                // Solo shared disponible
                finalOrder = migrateColumnOrder(sharedData.columnOrder, defaultColumnOrder);
            } else if (localData?.columnOrder) {
                // Solo local disponible
                const columnsToCompare = localData.columnOrder || localData.columnIds;
                const columnsChanged = hasColumnsChanged(defaultColumnOrder, columnsToCompare);
                finalOrder = columnsChanged
                    ? migrateColumnOrder(localData.columnOrder, defaultColumnOrder)
                    : localData.columnOrder;
            }

            result.columnOrder = finalOrder;
        }

        // === COLUMN VISIBILITY ===
        if (persistColumnVisibility) {
            let finalVisibility: VisibilityState = {};

            if (sharedData?.columnVisibility && localData?.columnVisibility) {
                // MODO HÍBRIDO: Mezclar shared + local (shared tiene prioridad)
                const migratedShared = migrateColumnVisibility(sharedData.columnVisibility, defaultColumnOrder);
                const migratedLocal = migrateColumnVisibility(localData.columnVisibility, defaultColumnOrder);
                finalVisibility = mergeSharedAndLocalVisibility(migratedShared, migratedLocal);
            } else if (sharedData?.columnVisibility) {
                // Solo shared disponible
                finalVisibility = migrateColumnVisibility(sharedData.columnVisibility, defaultColumnOrder);
            } else if (localData?.columnVisibility) {
                // Solo local disponible
                const columnsToCompare = localData.columnOrder || localData.columnIds;
                const columnsChanged = hasColumnsChanged(defaultColumnOrder, columnsToCompare);

                if (columnsChanged) {
                    const migratedVisibility = migrateColumnVisibility(localData.columnVisibility, defaultColumnOrder);
                    const initialVis = buildInitialColumnVisibility();
                    finalVisibility = { ...initialVis, ...migratedVisibility };
                } else {
                    finalVisibility = localData.columnVisibility;
                }
            }

            result.columnVisibility = finalVisibility;
        }

        // === COLUMN SIZING ===
        if (persistColumnSizing) {
            let finalSizing: ColumnSizingState = {};

            if (sharedData?.columnSizing && localData?.columnSizing) {
                // MODO HÍBRIDO: Mezclar shared + local (shared tiene prioridad)
                const migratedShared = migrateColumnSizing(sharedData.columnSizing, defaultColumnOrder);
                const migratedLocal = migrateColumnSizing(localData.columnSizing, defaultColumnOrder);
                finalSizing = mergeSharedAndLocalSizing(migratedShared, migratedLocal);
            } else if (sharedData?.columnSizing) {
                // Solo shared disponible
                finalSizing = migrateColumnSizing(sharedData.columnSizing, defaultColumnOrder);
            } else if (localData?.columnSizing) {
                // Solo local disponible
                const columnsToCompare = localData.columnOrder || localData.columnIds;
                const columnsChanged = hasColumnsChanged(defaultColumnOrder, columnsToCompare);
                finalSizing = columnsChanged
                    ? migrateColumnSizing(localData.columnSizing, defaultColumnOrder)
                    : localData.columnSizing;
            }

            result.columnSizing = finalSizing;
        }

        // === PAGE SIZE (solo local) ===
        if (persistPageSize && localData?.pageSize) {
            result.pageSize = localData.pageSize;
        }

        return result;
    }, [defaultColumnOrder, persistenceKey, sharedPersistenceKey, persistColumnOrder, persistColumnVisibility, persistPageSize, persistColumnSizing]);

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

    // Persistir cambios en localStorage (local Y shared)
    useEffect(() => {
        if (!persistenceKey) return;

        // === GUARDAR LOCAL ===
        const localDataToSave: TablePersistence = {
            columnIds: defaultColumnOrder,
        };

        if (persistColumnVisibility) {
            localDataToSave.columnVisibility = columnVisibility;
        }
        if (persistColumnOrder) {
            localDataToSave.columnOrder = columnOrder;
        }
        if (persistPageSize) {
            localDataToSave.pageSize = pagination.pageSize;
        }
        if (persistColumnSizing) {
            localDataToSave.columnSizing = columnSizing;
        }

        saveToStorage(persistenceKey, localDataToSave);

        // === GUARDAR SHARED (si existe la key) ===
        if (sharedPersistenceKey) {
            const sharedDataToSave: TablePersistence = {
                columnIds: defaultColumnOrder,
            };

            if (persistColumnVisibility) {
                sharedDataToSave.columnVisibility = columnVisibility;
            }
            if (persistColumnOrder) {
                sharedDataToSave.columnOrder = columnOrder;
            }
            if (persistColumnSizing) {
                sharedDataToSave.columnSizing = columnSizing;
            }
            // NO guardamos pageSize en shared (es específico de cada tabla)

            saveToStorage(sharedPersistenceKey, sharedDataToSave);
        }
    }, [columnVisibility, columnOrder, pagination.pageSize, columnSizing, persistenceKey, sharedPersistenceKey, persistColumnVisibility, persistColumnOrder, persistPageSize, persistColumnSizing, defaultColumnOrder]);

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
        if (sharedPersistenceKey) {
            try {
                localStorage.removeItem(sharedPersistenceKey);
            } catch (error) {
                console.warn('Error clearing shared persisted data:', error);
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