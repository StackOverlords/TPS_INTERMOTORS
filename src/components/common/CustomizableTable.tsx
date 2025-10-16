import {
    flexRender,
    type Table,
    type Header,
    type Cell,
} from "@tanstack/react-table"
import {
    Table as AtomTable,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/table"
import { ArrowDown, ArrowUp, ArrowUpDown, GripVertical } from "lucide-react"
import { Skeleton } from "../atoms/skeleton";
import ErrorDataComponent from "./errorDataComponent";
import NoDataComponent from "./noDataComponent";
import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    type DragEndEvent,
    useSensor,
    useSensors,
    type Modifier,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRef, type CSSProperties } from "react";
import { Button } from "../atoms/button";
import { cn } from "@/lib/utils";

// Modifier personalizado para restringir al contenedor
const restrictToTableContainer: Modifier = ({
    transform,
    draggingNodeRect,
    containerNodeRect,
}) => {
    if (!draggingNodeRect || !containerNodeRect) {
        return transform;
    }

    // Calcular los límites
    const leftBound = containerNodeRect.left;
    const rightBound = containerNodeRect.right;

    // Posición actual del elemento arrastrado
    const currentLeft = draggingNodeRect.left + transform.x;
    const currentRight = draggingNodeRect.right + transform.x;

    let adjustedX = transform.x;

    // Si se sale por la izquierda
    if (currentLeft < leftBound) {
        adjustedX = leftBound - draggingNodeRect.left;
    }
    // Si se sale por la derecha
    else if (currentRight > rightBound) {
        adjustedX = rightBound - draggingNodeRect.right;
    }

    return {
        ...transform,
        x: adjustedX,
    };
};

interface Props<T> {
    table: Table<T>
    renderBottomRow?: () => React.ReactNode;
    isLoading: boolean;
    isFetching?: boolean
    isError?: boolean,
    rows?: number
    errorMessage?: string
    noDataMessage?: string
    selectedRowIndex?: number;
    onRowClick?: (index: number) => void;
    onRowDoubleClick?: (row: T) => void;
    tableRef?: React.RefObject<HTMLTableElement | null>;
    focused?: boolean;
    keyboardNavigationEnabled?: boolean;
    enableColumnReordering?: boolean;
    enableSorting?: boolean;
    onDragStart?: () => void;
    onDragEnd?: () => void
}

// Header arrastrable con mejor UI
const DraggableTableHeader = <T,>({
    header,
    enableSorting
}: {
    header: Header<T, unknown>;
    enableSorting: boolean;
}) => {
    const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({
        id: header.column.id,
    });

    const style: CSSProperties = {
        opacity: isDragging ? 0.9 : 1,
        position: 'relative',
        transform: CSS.Translate.toString(transform),
        transition: 'width transform 0.2s ease-in-out',
        width: header.column.getSize(),
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <TableHead
            ref={setNodeRef}
            style={style}
            colSpan={header.colSpan}
            className={`relative group select-none text-left border-b border-gray-200 ${isDragging ? 'bg-blue-50 shadow-lg cursor-grabbing' : ''
                }`}
        >
            {header.isPlaceholder ? null : (
                <div className="flex items-center gap-1 justify-between">
                    <Button
                        {...attributes}
                        {...listeners}
                        variant={'ghost'}
                        className={cn(
                            "cursor-grab active:cursor-grabbing size-5 p-0.5 touch-none hidden group-hover:block transition-all duration-700 ease-in-out",
                            isDragging && "cursor-grabbing"
                        )}
                    >
                        <GripVertical className={`size-3 transition-colors ${isDragging ? 'text-blue-600' : ''
                            }`} />
                    </Button>
                    <div
                        className={cn(
                            `flex items-center gap-1 justify-between flex-1 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`,
                            isDragging && "cursor-grabbing"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                    >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && enableSorting && !isDragging && (
                            <div className="flex flex-col text-blue-400">
                                {header.column.getIsSorted() === "asc" ? (
                                    <ArrowUp className="w-3 h-3" />
                                ) : header.column.getIsSorted() === "desc" ? (
                                    <ArrowDown className="w-3 h-3" />
                                ) : (
                                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {header.column.getCanResize() && (
                <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className="absolute right-0 top-0 h-full w-px group-hover:w-1 cursor-col-resize bg-gray-200 group-hover:bg-blue-300 transition-all duration-300"
                    style={{ zIndex: 2 }}
                />
            )}
        </TableHead>
    );
};

// Celda que se arrastra junto con la columna
const DragAlongCell = <T,>({
    cell,
}: {
    cell: Cell<T, unknown>;
}) => {
    const { isDragging, setNodeRef, transform } = useSortable({
        id: cell.column.id,
    });

    const style: CSSProperties = {
        opacity: isDragging ? 0.9 : 1,
        position: 'relative',
        transform: CSS.Translate.toString(transform),
        transition: 'width transform 0.2s ease-in-out',
        width: cell.column.getSize(),
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <TableCell
            ref={setNodeRef}
            style={style}
            className={`p-1 truncate ${isDragging ? 'bg-blue-50' : ''
                }`}
        >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
    );
};

const CustomizableTable = <T,>({
    table,
    renderBottomRow,
    isLoading,
    isFetching,
    isError,
    rows,
    errorMessage,
    noDataMessage,
    selectedRowIndex,
    onRowClick,
    onRowDoubleClick,
    tableRef,
    focused = false,
    keyboardNavigationEnabled = false,
    enableColumnReordering = false,
    enableSorting = true,
    onDragStart,
    onDragEnd,
}: Props<T>) => {
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor)
    );

    // Obtener el orden actual de columnas
    const columnOrder = table.getState().columnOrder;

    // Manejar el fin del drag
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active && over && active.id !== over.id) {
            const oldIndex = columnOrder.indexOf(active.id as string);
            const newIndex = columnOrder.indexOf(over.id as string);

            const newColumnOrder = arrayMove(columnOrder, oldIndex, newIndex);
            table.setColumnOrder(newColumnOrder);
        }
    };

    return (
        <div ref={tableContainerRef} className="relative w-full overflow-auto">
            <DndContext
                sensors={sensors}
                onDragStart={() => {
                    onDragStart?.()
                }}
                onDragEnd={(event) => {
                    handleDragEnd(event);
                    onDragEnd?.()
                }}
                onDragCancel={() => {
                    onDragEnd?.()
                }}
                collisionDetection={closestCenter}
                modifiers={[restrictToHorizontalAxis, restrictToTableContainer]}
            >
                <AtomTable
                    ref={tableRef}
                    className="w-full table-fixed text-xs"
                    tabIndex={keyboardNavigationEnabled ? 0 : -1}
                >
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {enableColumnReordering ? (
                                    <SortableContext
                                        items={columnOrder}
                                        strategy={horizontalListSortingStrategy}
                                    >
                                        {headerGroup.headers.map((header) => (
                                            <DraggableTableHeader
                                                key={header.id}
                                                header={header}
                                                enableSorting={enableSorting}
                                            />
                                        ))}
                                    </SortableContext>
                                ) : (
                                    headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className="relative group select-none text-left border-b border-gray-200"
                                            style={{ width: header.getSize() }}
                                        >
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={`flex items-center gap-1 justify-between ${header.column.getCanSort() ? "cursor-pointer select-none" : ""
                                                        }`}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {header.column.getCanSort() && enableSorting && (
                                                        <div className="flex flex-col text-blue-400">
                                                            {header.column.getIsSorted() === "asc" ? (
                                                                <ArrowUp className="w-3 h-3" />
                                                            ) : header.column.getIsSorted() === "desc" ? (
                                                                <ArrowDown className="w-3 h-3" />
                                                            ) : (
                                                                <ArrowUpDown className="w-3 h-3 text-gray-400" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {header.column.getCanResize() && (
                                                <div
                                                    onMouseDown={header.getResizeHandler()}
                                                    onTouchStart={header.getResizeHandler()}
                                                    className="absolute right-0 top-0 h-full w-px group-hover:w-1 cursor-col-resize bg-gray-200 group-hover:bg-blue-300 transition-all duration-300"
                                                />
                                            )}
                                        </TableHead>
                                    ))
                                )}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-200">
                        {isLoading || isFetching ? (
                            [...Array(rows || 10)].map((_, rowIndex) => (
                                <TableRow key={`skeleton-row-${rowIndex}`}>
                                    {table.getVisibleFlatColumns().map((column, colIndex) => (
                                        <TableCell
                                            key={`skeleton-cell-${rowIndex}-${colIndex}`}
                                            style={{ width: column.getSize() }}
                                        >
                                            <Skeleton className="h-6 w-full rounded" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : isError ? (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getVisibleFlatColumns().length}
                                    className="text-center"
                                >
                                    <ErrorDataComponent errorMessage={errorMessage} />
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getVisibleFlatColumns().length}
                                    className="text-center"
                                >
                                    <NoDataComponent message={noDataMessage} />
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {table.getRowModel().rows.map((row, index) => {
                                    const isSelected = selectedRowIndex === index;
                                    return (
                                        <TableRow
                                            key={row.id}
                                            data-row-index={index}
                                            className={`${isSelected && focused
                                                ? 'bg-blue-100 hover:bg-blue-100'
                                                : ''
                                                }`}
                                            onClick={() => onRowClick?.(index)}
                                            onDoubleClick={() => onRowDoubleClick?.(row.original)}
                                        >
                                            {enableColumnReordering ? (
                                                <SortableContext
                                                    items={columnOrder}
                                                    strategy={horizontalListSortingStrategy}
                                                >
                                                    {row.getVisibleCells().map((cell) => (
                                                        <DragAlongCell
                                                            key={cell.id}
                                                            cell={cell}
                                                        />
                                                    ))}
                                                </SortableContext>
                                            ) : (
                                                row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id} className="p-1 truncate">
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))
                                            )}
                                        </TableRow>
                                    );
                                })}
                                {renderBottomRow && renderBottomRow()}
                            </>
                        )}
                    </TableBody>
                </AtomTable>
            </DndContext>
        </div>
    );
};

export default CustomizableTable;