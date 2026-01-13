import { Button } from "@/components/atoms/button";
import { Trash2, X } from "lucide-react";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { formatCell } from "@/utils/formatCell";
import CustomizableTable from "@/components/common/CustomizableTable";
import { useCustomTable } from "@/hooks/useCustomTable";
import { EditableQuantity } from "@/modules/shoppingCart/components/editableQuantity";
import { EditablePrice } from "@/modules/shoppingCart/components/editablePrice";
import type { UIOrderDetailCreate } from "../types/orderCreate.types";
import type { UIOrderDetailUpdate } from "../types/orderUpdate.types";
import { Badge } from "@/components/atoms/badge";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import ConfirmationModal from "@/components/common/confirmationModal";
import { useDeleteOrderDetail } from "../hooks/useDeleteOrderDetail";
import { formatCurrency } from "@/utils/formaters";
import authSDK from "@/services/sdk-simple-auth";
import { TableRow, TableCell } from "@/components/atoms/table";

type OrderDetailUnion = UIOrderDetailCreate | UIOrderDetailUpdate;

interface OrderDetailTableProps<T extends OrderDetailUnion> {
  details: T[];
  onUpdateCantidad: (id_producto: number, cantidad: number) => void;
  onUpdateCosto: (id_producto: number, costo: number) => void;
  onUpdatePrecioVenta: (id_producto: number, precio: number) => void;
  onUpdateIncPVenta: (id_producto: number, inc: number) => void;
  onUpdatePrecioVentaAlt: (id_producto: number, precio: number) => void;
  onUpdateIncPVentaAlt: (id_producto: number, inc: number) => void;
  onRemoveProduct: (id_producto: number) => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
  isSaving?: boolean;
  isEditMode?: boolean;
  isUSD?: boolean;
  totalAmount?: number;
}

export interface OrderDetailTableRef {
  focusFirstQuantityInput: () => void;
  focusQuantityInputByProductId: (productId: number) => void;
}

function OrderDetailTableInner<T extends OrderDetailUnion>(
  {
    details,
    onUpdateCantidad,
    onUpdateCosto,
    onUpdatePrecioVenta,
    onUpdateIncPVenta,
    onUpdatePrecioVentaAlt,
    onUpdateIncPVentaAlt,
    onRemoveProduct,
    isLoading = false,
    isReadOnly = false,
    isSaving = false,
    isEditMode = false,
    isUSD = false,
    totalAmount,
  }: OrderDetailTableProps<T>,
  ref: React.Ref<OrderDetailTableRef>
) {
  const user = authSDK.getCurrentUser();

  const firstQuantityInputRef = useRef<HTMLInputElement | null>(null);
  const quantityInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const handleDeleteSuccess = (_data: unknown, detailId: number) => {
    const deletedItem = details.find(
      (d) => "id_detalle_pedido" in d && d.id_detalle_pedido === detailId
    );
    if (deletedItem) {
      onRemoveProduct(deletedItem.id_producto);
    }
    showSuccessToast({
      title: "Detalle de pedido eliminado",
      description: `El detalle de pedido #${detailId} se eliminó exitosamente`,
      duration: 5000,
    });
  };

  const handleDeleteError = (_error: unknown, detailId: number) => {
    showErrorToast({
      title: "Error al eliminar el detalle de pedido",
      description: `No se pudo eliminar el detalle de pedido #${detailId}. Por favor, intenta nuevamente`,
      duration: 5000,
    });
  };

  const { mutate: deleteOrderDetail, isPending: isDeleting } =
    useDeleteOrderDetail();

  const {
    close: handleCloseDeleteAlert,
    confirm: handleConfirmDeleteAlert,
    isOpen: showDeleteAlert,
    open: handleOpenDeleteAlert,
    variables: detailToDelete,
  } = useConfirmMutation(
    deleteOrderDetail,
    handleDeleteSuccess,
    handleDeleteError
  );

  const handleRemoveItem = (item: T) => {
    if (!isEditMode) {
      onRemoveProduct(item.id_producto);
      return;
    }

    const isNew = !("id_detalle_pedido" in item) || !item.id_detalle_pedido;

    if (isNew) {
      onRemoveProduct(item.id_producto);
    } else {
      handleOpenDeleteAlert(
        (item as UIOrderDetailUpdate).id_detalle_pedido ?? undefined
      );
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      focusFirstQuantityInput: () => {
        if (firstQuantityInputRef.current) {
          firstQuantityInputRef.current.focus();
          firstQuantityInputRef.current.select();
        }
      },
      focusQuantityInputByProductId: (productId: number) => {
        const input = quantityInputRefs.current.get(productId);
        if (input) {
          setTimeout(() => {
            input.focus();
            input.select();
          }, 50);
        } else {
          if (firstQuantityInputRef.current) {
            firstQuantityInputRef.current.focus();
            firstQuantityInputRef.current.select();
          }
        }
      },
    }),
    []
  );

  // Calcular totales
  const totalCantidad = useMemo(() => {
    return details.reduce((sum, detail) => sum + detail.cantidad, 0);
  }, [details]);

  const columns = useMemo<ColumnDef<T>[]>(() => {
    const baseColumns: ColumnDef<T>[] = [];

    baseColumns.push({
      accessorKey: "orden",
      id: "orden",
      header: "N°",
      size: 30,
      minSize: 20,
      enableSorting: true,
    });

    if (isEditMode) {
      baseColumns.push({
        accessorKey: "id_detalle_pedido",
        header: "Cód.",
        size: 50,
        minSize: 30,
        cell: ({ row, getValue }) => {
          const value = getValue<number>();
          const isNew =
            !("id_detalle_pedido" in row.original) ||
            !row.original.id_detalle_pedido;
          return (
            <div className="flex items-center justify-center">
              {isNew ? (
                <Badge variant={"accent"} className="text-[10px] px-1 py-0">
                  Nuevo
                </Badge>
              ) : (
                <span>{value}</span>
              )}
            </div>
          );
        },
      });
    }

    baseColumns.push(
      {
        accessorKey: "id_producto",
        header: "Cód. Int.",
        size: 50,
        minSize: 40,
      },
      {
        accessorFn: (row) => row.product.descripcion,
        id: "descripcion",
        header: "Descripción",
        size: 300,
        minSize: 250,
        enableHiding: false,
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
      },
      {
        accessorFn: (row) => row.product.codigo_oem,
        id: "codigo_oem",
        header: "Cód. OEM",
        size: 100,
        minSize: 70,
        cell: ({ getValue }) => <span>{formatCell(getValue<string>())}</span>,
      },
      {
        accessorFn: (row) => row.product.codigo_upc,
        id: "codigo_upc",
        header: "Cód. UPC",
        size: 100,
        minSize: 70,
      },
      {
        accessorFn: (row) => row.product.marca,
        id: "marca",
        header: "Marca",
        size: 100,
        minSize: 70,
        cell: ({ getValue }) => <span>{formatCell(getValue<string>())}</span>,
      },
      {
        accessorFn: (row) => row.product.procedencia,
        id: "procedencia",
        header: "Procedencia",
        size: 100,
        minSize: 70,
        cell: ({ getValue }) => <span>{formatCell(getValue<string>())}</span>,
      },
      {
        accessorKey: "cantidad",
        id: "cantidad",
        header: "Cantidad",
        size: 110,
        minSize: 80,
        cell: ({ getValue, row }) => {
          const cantidad = getValue<number>();
          const productId = row.original.id_producto;
          const refToAssign = row.index === 0 ? firstQuantityInputRef : null;
          return (
            <EditableQuantity
              value={cantidad}
              className="w-full"
              buttonClassName="w-full"
              onSubmit={(value) =>
                onUpdateCantidad(row.original.id_producto, value as number)
              }
              validate={(val) => {
                const num = parseInt(val);
                return !isNaN(num) && num > 0;
              }}
              inputRef={(el) => {
                if (refToAssign) {
                  refToAssign.current = el;
                }
                if (el) {
                  quantityInputRefs.current.set(productId, el);
                } else {
                  quantityInputRefs.current.delete(productId);
                }
              }}
              disabled={isReadOnly || isSaving}
            />
          );
        },
      },
      {
        accessorKey: "costo",
        id: "costo",
        header: "Costo",
        size: 110,
        minSize: 80,
        cell: ({ getValue, row }) => {
          const costo = getValue<number>();
          return (
            <EditablePrice
              value={costo}
              onSubmit={(value) =>
                onUpdateCosto(row.original.id_producto, value as number)
              }
              className="w-full"
              buttonClassName="w-full"
              numberProps={{ min: 0, step: 0.01 }}
              disabled={isReadOnly || isSaving}
            />
          );
        },
      },
      {
        id: "subtotal",
        header: "Subtotal",
        size: 110,
        minSize: 80,
        cell: ({ row }) => {
          const detail = row.original;
          const subtotal = detail.costo * detail.cantidad;
          return (
            <div className="font-medium text-end text-sm">
              {formatCurrency(subtotal, {
                currency: isUSD ? "USD" : "BOB",
                locale: isUSD ? "en-US" : "es-BO",
              })}
            </div>
          );
        },
      },
      {
        id: "action",
        header: "Acciones",
        size: 60,
        minSize: 40,
        cell: ({ row }) => {
          const item = row.original;
          const isNew =
            !isEditMode ||
            !("id_detalle_pedido" in item) ||
            !item.id_detalle_pedido;

          return (
            <div className="flex items-center justify-center">
              <Button
                disabled={isReadOnly || isSaving || isDeleting}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRemoveItem(item)}
                className="w-8 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent hover:border-red-200"
              >
                {isNew && isEditMode ? (
                  <X className="size-3" />
                ) : (
                  <Trash2 className="size-3" />
                )}
              </Button>
            </div>
          );
        },
      }
    );

    return baseColumns;
  }, [
    isEditMode,
    onUpdateCantidad,
    onUpdateCosto,
    onUpdateIncPVenta,
    onUpdatePrecioVenta,
    onUpdateIncPVentaAlt,
    onUpdatePrecioVentaAlt,
    onRemoveProduct,
    isReadOnly,
    isSaving,
    isDeleting,
    isUSD,
  ]);

  const { table } = useCustomTable<T>({
    data: details,
    columns,
    enableSorting: true,
    enableColumnResizing: true,
    enableRowSelection: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    columnResizeMode: "onChange",
    defaultSortBy: [
      {
        id: "orden",
        desc: false,
      },
    ],
    hiddenColumns: ["id_detalle_pedido"],
    persistenceKey: `order-details-table-${user?.name}`,
    persistColumnOrder: true,
    persistColumnVisibility: true,
  });

  // Renderizar fila de totales
  const renderTotalsRow = () => {
    const visibleColumns = table.getVisibleLeafColumns();

    return (
      <TableRow className="bg-muted/50 font-bold border-t-2 border-border">
        {visibleColumns.map((column) => {
          const columnId = column.id;

          // Columna de cantidad - mostrar total
          if (columnId === "cantidad") {
            return (
              <TableCell
                key={columnId}
                className="p-1 text-center"
                style={{ width: column.getSize() }}
              >
                <div className="text-sm text-muted-foreground">
                  Total Cantidad
                </div>
                <div className="text-base font-bold text-blue-600">
                  {totalCantidad}
                </div>
              </TableCell>
            );
          }

          // Columna de subtotal - mostrar total
          if (columnId === "subtotal") {
            return (
              <TableCell
                key={columnId}
                className="p-1 text-end"
                style={{ width: column.getSize() }}
              >
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-base font-bold text-emerald-600">
                  {formatCurrency(totalAmount, {
                    currency: isUSD ? "USD" : "BOB",
                    locale: isUSD ? "en-US" : "es-BO",
                  })}
                </div>
              </TableCell>
            );
          }

          // Resto de columnas vacías
          return (
            <TableCell
              key={columnId}
              className="p-1"
              style={{ width: column.getSize() }}
            />
          );
        })}
      </TableRow>
    );
  };

  return (
    <>
      <CustomizableTable
        table={table}
        isLoading={isLoading}
        enableColumnReordering={true}
        renderTableFooter={renderTotalsRow}
      />

      <ConfirmationModal
        isOpen={showDeleteAlert}
        onClose={handleCloseDeleteAlert}
        onConfirm={handleConfirmDeleteAlert}
        title="Eliminar detalle de pedido"
        message={`¿Estás seguro de eliminar el detalle de pedido #${detailToDelete}?`}
        isLoading={isDeleting}
      />
    </>
  );
}

const OrderDetailTable = forwardRef(
  OrderDetailTableInner
) as React.ForwardRefExoticComponent<
  OrderDetailTableProps<OrderDetailUnion> &
    React.RefAttributes<OrderDetailTableRef>
>;

OrderDetailTable.displayName = "OrderDetailTable";

export default OrderDetailTable;
