import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import { TableRow, TableCell } from "@/components/atoms/table";
import { Trash2, X } from "lucide-react";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { formatCell } from "@/utils/formatCell";
import CustomizableTable from "@/components/common/CustomizableTable";
import { useCustomTable } from "@/hooks/useCustomTable";
import { EditableQuantity } from "@/modules/shoppingCart/components/editableQuantity";
import { EditablePrice } from "@/modules/shoppingCart/components/editablePrice";
import { formatCurrency } from "@/utils/formaters";
import authSDK from "@/services/sdk-simple-auth";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import ConfirmationModal from "@/components/common/confirmationModal";
import type {
  UIPurchaseDetail,
  UIPurchaseDetailUpdate,
} from "../hooks/usePurchaseDetails";
import { EditablePercentage } from "@/modules/shoppingCart/components/EditablePercentage";

type PurchaseDetailUnion = UIPurchaseDetail | UIPurchaseDetailUpdate;

interface PurchaseDetailsTableProps<T extends PurchaseDetailUnion> {
  details: T[];
  onUpdateCantidad: (id_producto: number, cantidad: number) => void;
  onUpdateCosto: (id_producto: number, costo: number) => void;
  onUpdatePrecioVenta: (id_producto: number, precio: number) => void;
  onUpdateIncPVenta: (id_producto: number, inc: number) => void;
  onUpdatePrecioVentaAlt: (id_producto: number, precio: number) => void;
  onUpdateIncPVentaAlt: (id_producto: number, inc: number) => void;
  onRemoveProduct: (id_producto: number) => void;
  onDeleteDetail?: (id_detalle_compra: number) => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
  isEditMode?: boolean;
  isUSD?: boolean;
  totalCosto?: number;
  totalPrecioVenta?: number;
  totalPrecioVentaAlt?: number;
}

export interface PurchaseDetailsTableRef {
  focusFirstQuantityInput: () => void;
  focusQuantityInputByProductId: (productId: number) => void;
}

function PurchaseDetailsTableInner<T extends PurchaseDetailUnion>(
  {
    details,
    onUpdateCantidad,
    onUpdateCosto,
    onUpdatePrecioVenta,
    onUpdateIncPVenta,
    onUpdatePrecioVentaAlt,
    onUpdateIncPVentaAlt,
    onRemoveProduct,
    onDeleteDetail,
    isLoading = false,
    isReadOnly = false,
    isSaving = false,
    isDeleting = false,
    isEditMode = false,
    isUSD = false,
    totalCosto = 0,
    totalPrecioVenta = 0,
    totalPrecioVentaAlt = 0,
  }: PurchaseDetailsTableProps<T>,
  ref: React.Ref<PurchaseDetailsTableRef>
) {
  const user = authSDK.getCurrentUser();

  const firstQuantityInputRef = useRef<HTMLInputElement | null>(null);
  const quantityInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  // Confirmar eliminación
  const handleDeleteSuccess = (_data: unknown, detailId: number) => {
    const deletedItem = details.find(
      (d) => "id_detalle_compra" in d && d.id_detalle_compra === detailId
    );
    if (deletedItem) {
      onRemoveProduct(deletedItem.id_producto);
    }
    showSuccessToast({
      title: "Detalle eliminado",
      description: `El detalle de compra #${detailId} se eliminó exitosamente`,
      duration: 3000,
    });
  };

  const handleDeleteError = (_error: unknown, detailId: number) => {
    showErrorToast({
      title: "Error al eliminar",
      description: `No se pudo eliminar el detalle #${detailId}`,
      duration: 3000,
    });
  };

  const {
    close: handleCloseDeleteAlert,
    confirm: handleConfirmDeleteAlert,
    isOpen: showDeleteAlert,
    open: handleOpenDeleteAlert,
    variables: detailToDelete,
  } = useConfirmMutation(
    onDeleteDetail || (() => {}),
    handleDeleteSuccess,
    handleDeleteError
  );

  const handleRemoveItem = (item: T) => {
    if (!isEditMode) {
      onRemoveProduct(item.id_producto);
      return;
    }

    const isNew = !("id_detalle_compra" in item) || !item.id_detalle_compra;

    if (isNew) {
      onRemoveProduct(item.id_producto);
    } else if (onDeleteDetail) {
      handleOpenDeleteAlert(
        (item as UIPurchaseDetailUpdate).id_detalle_compra ?? undefined
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
        } else if (firstQuantityInputRef.current) {
          firstQuantityInputRef.current.focus();
          firstQuantityInputRef.current.select();
        }
      },
    }),
    []
  );

  // Calcular totales de cantidad
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
        accessorKey: "id_detalle_compra",
        header: "Cód.",
        size: 50,
        minSize: 30,
        cell: ({ row, getValue }) => {
          const value = getValue<number>();
          const isNew =
            !("id_detalle_compra" in row.original) ||
            !row.original.id_detalle_compra;
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
        accessorFn: (row) => row.product.codigo_interno,
        id: "codigo_interno",
        header: "Cód. Int.",
        size: 60,
        minSize: 20,
        cell: ({ getValue }) => <span>{formatCell(getValue<string>())}</span>,
      },
      {
        accessorFn: (row) => row.product.descripcion,
        id: "descripcion",
        header: "Descripción",
        size: 200,
        minSize: 100,
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
        accessorKey: "inc_p_venta",
        id: "inc_p_venta",
        header: "% Inc",
        size: 110,
        minSize: 80,
        cell: ({ getValue, row }) => {
          const inc = getValue<number>();
          return (
            <EditablePercentage
              value={inc}
              onSubmit={(value) =>
                onUpdateIncPVenta(row.original.id_producto, value as number)
              }
              className="w-full"
              buttonClassName="w-full"
              numberProps={{ step: 0.1 }}
              disabled={isReadOnly || isSaving}
            />
          );
        },
      },
      {
        accessorKey: "precio_venta",
        id: "precio_venta",
        header: "P. Venta",
        size: 110,
        minSize: 80,
        cell: ({ getValue, row }) => {
          const precio = getValue<number>();
          return (
            <EditablePrice
              value={precio}
              onSubmit={(value) =>
                onUpdatePrecioVenta(row.original.id_producto, value as number)
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
        accessorKey: "inc_p_venta_alt",
        id: "inc_p_venta_alt",
        header: "% Alt",
        size: 110,
        minSize: 80,
        cell: ({ getValue, row }) => {
          const inc = getValue<number>();
          return (
            <EditablePercentage
              value={inc}
              onSubmit={(value) =>
                onUpdateIncPVentaAlt(row.original.id_producto, value as number)
              }
              className="w-full"
              buttonClassName="w-full"
              numberProps={{ step: 0.1 }}
              disabled={isReadOnly || isSaving}
            />
          );
        },
      },
      {
        accessorKey: "precio_venta_alt",
        id: "precio_venta_alt",
        header: "P. Venta Alt",
        size: 110,
        minSize: 80,
        cell: ({ getValue, row }) => {
          const precio = getValue<number>();
          return (
            <EditablePrice
              value={precio}
              onSubmit={(value) =>
                onUpdatePrecioVentaAlt(
                  row.original.id_producto,
                  value as number
                )
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
            !("id_detalle_compra" in item) ||
            !item.id_detalle_compra;

          return (
            <div className="flex items-center justify-center">
              <Button
                disabled={isReadOnly || isSaving || isDeleting}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRemoveItem(item)}
                className="w-8 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent hover:border-destructive/30"
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
    hiddenColumns: isEditMode ? [] : ["id_detalle_compra"],
    persistenceKey: `purchase-details-table-${user?.name}`,
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

          // Columna de cantidad
          if (columnId === "cantidad") {
            return (
              <TableCell
                key={columnId}
                className="p-1 text-center"
                style={{ width: column.getSize() }}
              >
                <div className="text-xs text-muted-foreground">
                  Total Cantidad
                </div>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {totalCantidad}
                </div>
              </TableCell>
            );
          }

          if (columnId === "precio_venta") {
            return (
              <TableCell
                key={columnId}
                className="p-1 text-center"
                style={{ width: column.getSize() }}
              >
                <div className="text-xs text-muted-foreground">
                  Total P. Venta
                </div>
                <div className="text-sm font-bold text-foreground">
                  {formatCurrency(totalPrecioVenta, {
                    currency: isUSD ? "USD" : "BOB",
                    locale: isUSD ? "en-US" : "es-BO",
                  })}
                </div>
              </TableCell>
            );
          }

          if (columnId === "precio_venta_alt") {
            return (
              <TableCell
                key={columnId}
                className="p-1 text-center"
                style={{ width: column.getSize() }}
              >
                <div className="text-xs text-muted-foreground">
                  Total P. Alt
                </div>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalPrecioVentaAlt, {
                    currency: isUSD ? "USD" : "BOB",
                    locale: isUSD ? "en-US" : "es-BO",
                  })}
                </div>
              </TableCell>
            );
          }

          // Columna de subtotal
          if (columnId === "subtotal") {
            return (
              <TableCell
                key={columnId}
                className="p-1 text-end"
                style={{ width: column.getSize() }}
              >
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalCosto, {
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

      {isEditMode && onDeleteDetail && (
        <ConfirmationModal
          isOpen={showDeleteAlert}
          onClose={handleCloseDeleteAlert}
          onConfirm={handleConfirmDeleteAlert}
          title="Eliminar detalle de compra"
          message={`¿Estás seguro de eliminar el detalle de compra #${detailToDelete}?`}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}

const PurchaseDetailsTable = forwardRef(
  PurchaseDetailsTableInner
) as React.ForwardRefExoticComponent<
  PurchaseDetailsTableProps<PurchaseDetailUnion> &
    React.RefAttributes<PurchaseDetailsTableRef>
>;

PurchaseDetailsTable.displayName = "PurchaseDetailsTable";

export default PurchaseDetailsTable;
