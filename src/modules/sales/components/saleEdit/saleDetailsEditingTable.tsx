import { Button } from "@/components/atoms/button";
import { Trash2, X, Ban } from "lucide-react";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { formatCell } from "@/utils/formatCell";
import CustomizableTable from "@/components/common/CustomizableTable";
import { EditableQuantity } from "@/modules/shoppingCart/components/editableQuantity";
import { EditablePrice } from "@/modules/shoppingCart/components/editablePrice";
import type { SaleUpdateDetailUI } from "../../types/saleUpdate.type";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import ConfirmationModal from "@/components/common/confirmationModal";
import { useDeleteSaleDetail } from "../../hooks/useDeleteSaleDetail";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { Badge } from "@/components/atoms/badge";
import { TooltipWrapper } from "@/components/common/TooltipWrapper";
import { cn } from "@/lib/utils";

type SaleDetailsEditingTableProps = {
  products: SaleUpdateDetailUI[];
  removeItem: (id: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updatePrice: (productId: number, price: number) => void;
  updateCustomSubtotal: (productId: number, customSubtotal: number) => void;
  isReadOnly?: boolean;
};

export interface SaleDetailsEditingTableRef {
  focusFirstQuantityInput: () => void;
  focusQuantityInputByProductId: (productId: number) => void;
}

function SaleDetailsEditingTableInner(
  {
    products,
    removeItem,
    updateQuantity,
    updatePrice,
    updateCustomSubtotal,
    isReadOnly = false,
  }: SaleDetailsEditingTableProps,
  ref: React.Ref<SaleDetailsEditingTableRef>
) {
  const user = authSDK.getCurrentUser();

  const firstQuantityInputRef = useRef<HTMLInputElement | null>(null);
  const quantityInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

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

  const handleDeleteSuccess = (_data: unknown, detailId: number) => {
    const deletedItem = products.find((p) => p.id_detalle_venta === detailId);
    if (deletedItem) {
      removeItem(deletedItem.id_producto);
    }
    showSuccessToast({
      title: "Detalle de venta eliminado",
      description: `El detalle de venta #${detailId} se eliminó exitosamente`,
      duration: 5000,
    });
  };

  const handleDeleteError = (_error: unknown, detailId: number) => {
    showErrorToast({
      title: "Error al eliminar el detalle de venta",
      description: `No se pudo eliminar el detalle de venta #${detailId}. Por favor, intenta nuevamente`,
      duration: 5000,
    });
  };

  const { mutate: deleteSaleDetail, isPending: isDeleting } =
    useDeleteSaleDetail();

  const {
    close: handleCloseDeleteAlert,
    confirm: handleConfirmDeleteAlert,
    isOpen: showDeleteAlert,
    open: handleOpenDeleteAlert,
    variables: detailToDelete,
  } = useConfirmMutation(
    deleteSaleDetail,
    handleDeleteSuccess,
    handleDeleteError
  );

  const handleRemoveItem = (item: SaleUpdateDetailUI) => {
    const isNew = !item.id_detalle_venta;
    if (isNew) {
      removeItem(item.id_producto);
      return;
    }
    handleOpenDeleteAlert(item.id_detalle_venta ?? undefined);
  };

  const columns = useMemo<ColumnDef<SaleUpdateDetailUI>[]>(
    () => [
      {
        accessorKey: "orden",
        id: "orden",
        header: "N°",
        size: 30,
        minSize: 20,
        enableSorting: true,
        cell: ({ getValue, row }) => {
          const cantidadDev = row.original.cantidad_dev ?? 0;
          const isFullyReturned = cantidadDev === row.original.cantidad;
          return (
            <div
              className={`text-center ${isFullyReturned ? "text-muted-foreground/70 italic" : ""}`}
            >
              {getValue<number>()}
            </div>
          );
        },
      },
      // {
      //     accessorKey: "id_detalle_venta",
      //     header: "Cód.",
      //     size: 40,
      //     cell({ row, getValue }) {
      //         const value = getValue<number>()
      //         const isNew = !row.original.id_detalle_venta
      //         return (
      //             <div className='flex items-center'>
      //                 {
      //                     isNew ? (
      //                         <Badge
      //                             variant={'accent'}
      //                             className='text-[10px] px-1 py-0'
      //                         >
      //                             Nuevo
      //                         </Badge>
      //                     ) : (
      //                         <span>{value}</span>
      //                     )
      //                 }
      //             </div>
      //         )
      //     },
      // },
      {
        accessorKey: "id_producto",
        id: "codigo_interno",
        header: "Cód Int.",
        size: 45,
        minSize: 20,
        cell: ({ getValue, row }) => {
          const cantidadDev = row.original.cantidad_dev ?? 0;
          const isFullyReturned = cantidadDev === row.original.cantidad;
          return (
            <div
              className={
                isFullyReturned ? "text-muted-foreground/70 italic" : ""
              }
            >
              {getValue<number>()}
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.producto.codigo_oem,
        id: "codigo_oem",
        header: "Cód. OEM",
        cell: ({ getValue, row }) => {
          const cantidadDev = row.original.cantidad_dev ?? 0;
          const isFullyReturned = cantidadDev === row.original.cantidad;
          return (
            <div
              className={
                isFullyReturned ? "text-muted-foreground/70 italic" : ""
              }
            >
              {formatCell(getValue<string>())}
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.producto.descripcion,
        id: "descripcion",
        header: "Descripción",
        size: 300,
        minSize: 250,
        enableHiding: false,
        cell: ({ getValue, row }) => {
          const cantidadDev = row.original.cantidad_dev ?? 0;
          const isFullyReturned = cantidadDev === row.original.cantidad;

          return (
            <div
              className={`flex items-center gap-2 ${isFullyReturned ? "text-muted-foreground/70 italic" : "text-foreground"}`}
            >
              <h3 className="font-medium truncate">{getValue<string>()}</h3>
              {isFullyReturned && (
                <Badge
                  variant="info"
                  className="text-xs px-1.5 py-0.5 whitespace-nowrap flex items-center gap-1"
                >
                  Devuelto
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "cantidad",
        id: "cantidad",
        header: "Cantidad",
        minSize: 140,
        cell: ({ getValue, row }) => {
          const cantidad = getValue<number>();
          const cantidadDev = row.original.cantidad_dev ?? 0;
          const cantidadReal = cantidad - cantidadDev;
          const productId = row.original.id_producto;
          const refToAssign = row.index === 0 ? firstQuantityInputRef : null;

          const hasReturns = cantidadDev > 0;
          const isFullyReturned = cantidadDev === cantidad;

          return (
            <div
              className={`flex items-center gap-2 w-full ${isFullyReturned ? "text-muted-foreground/70 italic" : ""}`}
            >
              <EditableQuantity
                value={cantidadReal}
                className={cn(
                  "w-full",
                  hasReturns && "text-muted-foreground/70 italic"
                )}
                buttonClassName="w-full"
                onSubmit={(value) => updateQuantity(productId, value as number)}
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
                disabled={isReadOnly || hasReturns}
                disableWheel
                disableArrowKeys
                columnKey="cantidad"
              />

              {hasReturns && (
                <TooltipWrapper
                  side="bottom"
                  tooltip={
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-xs">
                        {isFullyReturned
                          ? "Totalmente devuelto"
                          : "Devolución parcial"}
                      </p>
                      <p className="text-xs">
                        Original: <span className="font-bold">{cantidad}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isFullyReturned
                          ? "Este producto fue devuelto completamente"
                          : "Cantidad bloqueada por devolución"}
                      </p>
                    </div>
                  }
                >
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0.5 whitespace-nowrap flex items-center gap-1"
                  >
                    Dev: {cantidadDev}
                  </Badge>
                </TooltipWrapper>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "precio",
        id: "precio",
        header: "Precio Unit.",
        minSize: 110,
        cell: ({ getValue, row }) => {
          const basePrice = getValue<number>();
          const product = row.original.producto;
          const cantidadDev = row.original.cantidad_dev ?? 0;
          const isFullyReturned = cantidadDev === row.original.cantidad;

          return (
            <div
              className={
                isFullyReturned ? "text-muted-foreground/70 italic" : ""
              }
            >
              <EditablePrice
                value={basePrice}
                onSubmit={(value) => updatePrice(product.id, value as number)}
                className="w-full"
                buttonClassName="w-full"
                numberProps={{ min: 0, step: 0.01 }}
                disabled={isReadOnly || isFullyReturned}
                disableWheel
                disableArrowKeys
                columnKey="precio"
              />
            </div>
          );
        },
      },
      {
        id: "customSubtotal",
        header: "Subtotal",
        minSize: 110,
        cell: ({ row }) => {
          const product = row.original.producto;
          const item = row.original;
          const cantidadDev = item.cantidad_dev ?? 0;
          const cantidadReal = item.cantidad - cantidadDev;
          const subtotal = cantidadReal * item.precio;
          const isFullyReturned = cantidadDev === item.cantidad;

          return (
            <div
              className={
                isFullyReturned ? "text-muted-foreground/70 italic" : ""
              }
            >
              <EditablePrice
                value={subtotal}
                onSubmit={(value) =>
                  updateCustomSubtotal(product.id, value as number)
                }
                className="w-full"
                inputClassName="hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                numberProps={{ min: 0, step: 0.01 }}
                disabled={isReadOnly || isFullyReturned}
                disableWheel
                disableArrowKeys
                columnKey="subtotal"
              />
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.producto.marca,
        id: "marca",
        header: "Marca",
        cell: ({ getValue, row }) => {
          const marca = getValue<string>();
          const cantidadDev = row.original.cantidad_dev ?? 0;
          const isFullyReturned = cantidadDev === row.original.cantidad;
          return (
            <span
              className={
                isFullyReturned ? "text-muted-foreground/70 italic" : ""
              }
            >
              {marca}
            </span>
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
          const isNew = !row.original.id_detalle_venta;
          const cantidadDev = item.cantidad_dev ?? 0;
          const isFullyReturned = cantidadDev === item.cantidad;

          if (isFullyReturned && !isNew) {
            return (
              <div className="flex items-center justify-center text-muted-foreground/70 italic">
                <Button
                  disabled={true}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="size-7"
                >
                  <Ban className="size-3" />
                </Button>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-center">
              <Button
                disabled={isReadOnly}
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  isNew ? removeItem(item.id_producto) : handleRemoveItem(item)
                }
                className="text-destructive hover:text-destructive size-7 cursor-pointer"
              >
                {isNew ? (
                  <X className="size-3" />
                ) : (
                  <Trash2 className="size-3" />
                )}
              </Button>
            </div>
          );
        },
      },
    ],
    [removeItem, updateQuantity, updatePrice, updateCustomSubtotal, isReadOnly]
  );

  const { table } = useCustomTable({
    data: products,
    columns,
    enableSorting: true,
    enableColumnResizing: true,
    enableColumnOrdering: true,
    columnResizeMode: "onChange",
    defaultSortBy: [{ id: "orden", desc: false }],
    hiddenColumns: ["id_detalle_venta"],
    persistenceKey: `shopping-cart-table-products-edit-${user?.name}`,
    sharedPersistenceKey: `shopping-cart-table-products-shared-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  return (
    <>
      <CustomizableTable
        table={table}
        isLoading={false}
        noDataMessage="No hay productos en el carrito."
        errorMessage="Ocurrió un error al cargar los productos"
        enableColumnReordering={true}
      />

      <ConfirmationModal
        isOpen={showDeleteAlert}
        title="Eliminar producto de venta"
        message={`¿Estás seguro de que deseas eliminar el detalle de venta #${detailToDelete}?`}
        onClose={handleCloseDeleteAlert}
        onConfirm={handleConfirmDeleteAlert}
        isLoading={isDeleting}
      />
    </>
  );
}

const SaleDetailsEditingTable = forwardRef(
  SaleDetailsEditingTableInner
) as React.ForwardRefExoticComponent<
  SaleDetailsEditingTableProps & React.RefAttributes<SaleDetailsEditingTableRef>
>;

SaleDetailsEditingTable.displayName = "SaleDetailsEditingTable";

export default SaleDetailsEditingTable;
