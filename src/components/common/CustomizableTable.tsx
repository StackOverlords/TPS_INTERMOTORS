import {
    flexRender,
    type Table,
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
import { useState } from "react";

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
}

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
}: Props<T>) => {

    const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
    const [dropTargetColumn, setDropTargetColumn] = useState<string | null>(null);

    const handleDragStart = (columnId: string) => (e: React.DragEvent<HTMLTableCellElement>) => {
        e.stopPropagation();
        setDraggedColumn(columnId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', columnId);

        // Crear una imagen de arrastre más visible
        if (e.currentTarget) {
            const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
            dragImage.style.opacity = '0.5';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        }
    };

    const handleDragOver = (columnId: string) => (e: React.DragEvent<HTMLTableCellElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (draggedColumn && draggedColumn !== columnId) {
            e.dataTransfer.dropEffect = 'move';
            setDropTargetColumn(columnId);
        } else {
            e.dataTransfer.dropEffect = 'none';
        }
    };

    const handleDragEnter = (columnId: string) => (e: React.DragEvent<HTMLTableCellElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedColumn && draggedColumn !== columnId) {
            setDropTargetColumn(columnId);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLTableCellElement>) => {
        e.preventDefault();
        e.stopPropagation();

        // Solo limpiar si realmente salimos del elemento
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;

        if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
            setDropTargetColumn(null);
        }
    };

    const handleDrop = (targetColumnId: string) => (e: React.DragEvent<HTMLTableCellElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const sourceColumnId = e.dataTransfer.getData('text/plain');

        if (!sourceColumnId || sourceColumnId === targetColumnId) {
            setDraggedColumn(null);
            setDropTargetColumn(null);
            return;
        }

        // Obtener el orden actual de todas las columnas (visibles y no visibles)
        const currentOrder = table.getAllLeafColumns().map(col => col.id);
        const sourceIndex = currentOrder.indexOf(sourceColumnId);
        const targetIndex = currentOrder.indexOf(targetColumnId);

        if (sourceIndex === -1 || targetIndex === -1) {
            setDraggedColumn(null);
            setDropTargetColumn(null);
            return;
        }

        // Crear nuevo orden
        const newOrder = [...currentOrder];
        const [removed] = newOrder.splice(sourceIndex, 1);
        newOrder.splice(targetIndex, 0, removed);

        // Aplicar el nuevo orden
        table.setColumnOrder(newOrder);

        setDraggedColumn(null);
        setDropTargetColumn(null);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLTableCellElement>) => {
        e.preventDefault();
        setDraggedColumn(null);
        setDropTargetColumn(null);
    };

    return (
        <AtomTable
            ref={tableRef}
            className="w-full table-fixed text-xs"
            tabIndex={keyboardNavigationEnabled ? 0 : -1}
        >
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                            const isDragging = draggedColumn === header.id;
                            const isDropTarget = dropTargetColumn === header.id;

                            return (
                                <TableHead
                                    key={header.id}
                                    className={`relative group select-none text-left border-b border-gray-200 transition-all ${isDragging ? 'opacity-40 bg-gray-100' : ''
                                        } ${isDropTarget ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                                        }`}
                                    style={{ width: header.getSize() }}
                                    draggable={enableColumnReordering && !header.isPlaceholder}
                                    onDragStart={enableColumnReordering ? handleDragStart(header.id) : undefined}
                                    onDragOver={enableColumnReordering ? handleDragOver(header.id) : undefined}
                                    onDragEnter={enableColumnReordering ? handleDragEnter(header.id) : undefined}
                                    onDragLeave={enableColumnReordering ? handleDragLeave : undefined}
                                    onDrop={enableColumnReordering ? handleDrop(header.id) : undefined}
                                    onDragEnd={enableColumnReordering ? handleDragEnd : undefined}
                                >
                                    {header.isPlaceholder ? null : (
                                        <div className="flex items-center gap-2 justify-between">
                                            {enableColumnReordering && (
                                                <div
                                                    className="cursor-grab active:cursor-grabbing flex-shrink-0"
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                >
                                                    <GripVertical className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                                                </div>
                                            )}
                                            <div
                                                className={`flex items-center gap-2 flex-1 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""
                                                    }`}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getCanSort() && (
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
                                            style={{ zIndex: 1 }}
                                        />
                                    )}
                                </TableHead>
                            );
                        })}
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
                            <ErrorDataComponent
                                errorMessage={errorMessage}
                            />
                        </TableCell>
                    </TableRow>
                ) : table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                        <TableCell
                            colSpan={table.getVisibleFlatColumns().length}
                            className="text-center"
                        >
                            <NoDataComponent
                                message={noDataMessage}
                            />
                        </TableCell>
                    </TableRow>
                ) : (
                    <>
                        {
                            table.getRowModel().rows.map((row, index) => {
                                const isSelected = selectedRowIndex === index;
                                return (
                                    <TableRow key={row.id}
                                        data-row-index={index}
                                        className={`
                                        ${isSelected && focused ? 'bg-blue-100 hover:bg-blue-100' : ''}
                                    `}
                                        onClick={() => onRowClick?.(index)}
                                        onDoubleClick={() => onRowDoubleClick?.(row.original)}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="p-1 truncate">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                )
                            })
                        }
                        {renderBottomRow && renderBottomRow()}
                    </>
                )}
            </TableBody>
        </AtomTable>
    )
}

export default CustomizableTable;