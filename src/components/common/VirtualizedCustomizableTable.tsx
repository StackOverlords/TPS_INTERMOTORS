import {
  flexRender,
  type Table,
  type Header,
  type Cell,
} from "@tanstack/react-table";
import {
  Table as AtomTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/atoms/table";
import { ArrowDown, ArrowUp, ArrowUpDown, GripVertical } from "lucide-react";
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
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type CSSProperties, useState, useRef } from "react";
import { Button } from "../atoms/button";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";

const restrictToTableContainer: Modifier = ({
  transform,
  draggingNodeRect,
  containerNodeRect,
}) => {
  if (!draggingNodeRect || !containerNodeRect) {
    return transform;
  }

  const leftBound = containerNodeRect.left;
  const rightBound = containerNodeRect.right;

  const currentLeft = draggingNodeRect.left + transform.x;
  const currentRight = draggingNodeRect.right + transform.x;

  let adjustedX = transform.x;

  if (currentLeft < leftBound) {
    adjustedX = leftBound - draggingNodeRect.left;
  } else if (currentRight > rightBound) {
    adjustedX = rightBound - draggingNodeRect.right;
  }

  return {
    ...transform,
    x: adjustedX,
  };
};

interface Props<T> {
  table: Table<T>;
  renderBottomRow?: () => React.ReactNode;
  renderTableFooter?: () => React.ReactNode;
  isLoading: boolean;
  isFetching?: boolean;
  isError?: boolean;
  rows?: number;
  errorMessage?: string;
  noDataDescription?: string;
  noDataMessage?: string;
  selectedRowIndex?: number;
  onRowClick?: (index: number) => void;
  onRowDoubleClick?: (row: T) => void;
  tableRef?: React.RefObject<HTMLTableElement | null>;
  focused?: boolean;
  keyboardNavigationEnabled?: boolean;
  enableColumnReordering?: boolean;
  enableSorting?: boolean;
  stickyHeader?: boolean;
  stickyFooter?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  estimatedRowHeight?: number; // Nueva prop para virtualización
}

const DraggableTableHeader = <T,>({
  header,
  enableSorting,
}: {
  header: Header<T, unknown>;
  enableSorting: boolean;
}) => {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: header.column.id,
    });

  const style: CSSProperties = {
    opacity: isDragging ? 0.9 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? "none" : "width transform 0.2s ease-in-out",
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  const canSort = header.column.getCanSort() && enableSorting;

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      colSpan={header.colSpan}
      className={cn(
        `relative group select-none text-left border-b border-border overflow-hidden px-0.5 h-max py-2 max-h-12`,
        isDragging && "bg-blue-50 shadow-lg cursor-grabbing"
      )}
    >
      {header.isPlaceholder ? null : (
        <div className="flex items-center gap-1 justify-between">
          <Button
            {...attributes}
            {...listeners}
            aria-label="Reordenar columna"
            type="button"
            variant={"ghost"}
            className={cn(
              "cursor-grab active:cursor-grabbing touch-none size-0 group-hover:size-3.5 p-0 group-hover:p-0.5 overflox-hidden opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out",
              isDragging && "cursor-grabbing"
            )}
          >
            <GripVertical
              className={cn(
                `size-2.5 transition-colors`,
                isDragging && "text-blue-600"
              )}
            />
          </Button>
          <div
            className={cn(
              `flex items-center gap-1 justify-between flex-1`,
              canSort && !isDragging && "cursor-pointer select-none",
              !canSort && "cursor-auto",
              isDragging && "cursor-grabbing"
            )}
            onClick={
              canSort ? header.column.getToggleSortingHandler() : undefined
            }
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
            {canSort && !isDragging && (
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
          className="absolute right-0 top-0 h-full w-px group-hover:w-1 cursor-col-resize bg-border group-hover:bg-blue-300 transition-all duration-300"
          style={{ zIndex: 2 }}
        />
      )}
    </TableHead>
  );
};

const DragAlongCell = <T,>({ cell }: { cell: Cell<T, unknown> }) => {
  const { isDragging, setNodeRef, transform } = useSortable({
    id: cell.column.id,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.9 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition: "width transform 0.2s ease-in-out",
    width: cell.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <TableCell
      ref={setNodeRef}
      style={style}
      className={`p-1 overflow-hidden flex-shrink-0 ${isDragging ? "bg-blue-50" : ""}`}
    >
      <div className="flex-1 flex-shrink-0 truncate">
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </div>
    </TableCell>
  );
};

const VirtualizedCustomizableTable = <T,>({
  table,
  renderBottomRow,
  renderTableFooter,
  isLoading,
  isFetching,
  isError,
  rows,
  errorMessage,
  noDataDescription,
  noDataMessage,
  selectedRowIndex,
  onRowClick,
  onRowDoubleClick,
  tableRef,
  focused = false,
  keyboardNavigationEnabled = false,
  enableColumnReordering = false,
  enableSorting = false,
  stickyHeader = true,
  stickyFooter = true,
  onDragStart,
  onDragEnd,
  estimatedRowHeight = 45, // Altura estimada de cada fila en px
}: Props<T>) => {
  const [isDragging, setIsDragging] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const columnOrder = table.getState().columnOrder;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);

      const newColumnOrder = arrayMove(columnOrder, oldIndex, newIndex);
      table.setColumnOrder(newColumnOrder);
    }

    setIsDragging(false);
    onDragEnd?.();
  };

  // Virtualización: Solo renderiza las filas visibles
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 10, // Renderiza 10 filas extra arriba y abajo del viewport
  });

  return (
    <DndContext
      sensors={sensors}
      onDragStart={() => {
        setIsDragging(true);
        onDragStart?.();
      }}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setIsDragging(false);
        onDragEnd?.();
      }}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis, restrictToTableContainer]}
    >
      <div
        ref={tableContainerRef}
        className="relative w-full overflow-auto h-full"
      >
        <AtomTable
          ref={tableRef}
          className="table-fixed text-xs"
          tabIndex={keyboardNavigationEnabled ? 0 : -1}
        >
          <TableHeader
            className={cn(
              stickyHeader &&
                "sticky top-0 z-20 bg-background shadow-md border-b"
            )}
          >
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
                  headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort() && enableSorting;
                    return (
                      <TableHead
                        key={header.id}
                        className="relative group select-none text-left border-b border-border overflow-hidden px-0.5 h-max py-2 max-h-12 truncate"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              `flex items-center gap-1 justify-between`,
                              canSort && "cursor-pointer select-none",
                              !canSort && "cursor-auto"
                            )}
                            onClick={
                              canSort
                                ? header.column.getToggleSortingHandler()
                                : undefined
                            }
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {canSort && (
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
                            className="absolute right-0 top-0 h-full w-px group-hover:w-1 cursor-col-resize bg-border group-hover:bg-blue-300 transition-all duration-300"
                          />
                        )}
                      </TableHead>
                    );
                  })
                )}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {isLoading || isFetching ? (
              [...Array(rows || 10)].map((_, rowIndex) => (
                <TableRow key={`skeleton-row-${rowIndex}`}>
                  {table.getVisibleFlatColumns().map((column, colIndex) => (
                    <TableCell
                      className="p-1"
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
                  <NoDataComponent
                    message={noDataMessage}
                    description={noDataDescription}
                  />
                </TableCell>
              </TableRow>
            ) : (
              <>
                {/* Espaciador superior para simular las filas no renderizadas arriba */}
                <tr
                  style={{
                    height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px`,
                  }}
                />

                {/* Solo renderizar las filas virtuales visibles */}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = table.getRowModel().rows[virtualRow.index];
                  const isSelected = selectedRowIndex === virtualRow.index;

                  return (
                    <TableRow
                      key={row.id}
                      data-index={virtualRow.index}
                      data-row-index={virtualRow.index}
                      className={`${
                        isSelected && focused
                          ? "bg-blue-100 hover:bg-blue-100"
                          : ""
                      }`}
                      data-state={
                        isSelected && focused ? "selected" : undefined
                      }
                      onClick={() => {
                        if (!isDragging) {
                          onRowClick?.(virtualRow.index);
                        }
                      }}
                      onDoubleClick={() => {
                        if (!isDragging) {
                          onRowDoubleClick?.(row.original);
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="p-1 overflow-hidden flex-shrink-0"
                          style={{ width: cell.column.getSize() }}
                        >
                          <div className="flex-1 flex-shrink-0 truncate">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}

                {/* Espaciador inferior para simular las filas no renderizadas abajo */}
                <tr
                  style={{
                    height: `${
                      rowVirtualizer.getTotalSize() -
                      (rowVirtualizer.getVirtualItems()[
                        rowVirtualizer.getVirtualItems().length - 1
                      ]?.end ?? 0)
                    }px`,
                  }}
                />

                {renderBottomRow && renderBottomRow()}
              </>
            )}
          </TableBody>
          {renderTableFooter &&
            !isLoading &&
            !isFetching &&
            !isError &&
            table.getRowModel().rows.length > 0 && (
              <TableFooter
                className={cn(
                  stickyFooter &&
                    "sticky bottom-0 z-10 bg-background shadow-[0_-2px_4px_rgba(0,0,0,0.1)]"
                )}
              >
                {renderTableFooter()}
              </TableFooter>
            )}
        </AtomTable>
      </div>
    </DndContext>
  );
};

export default VirtualizedCustomizableTable;
