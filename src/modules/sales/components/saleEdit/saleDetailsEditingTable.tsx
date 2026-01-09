import { Button } from "@/components/atoms/button";
import { Trash2, X } from "lucide-react";
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

  // refs para inputs de cantidad
  const firstQuantityInputRef = useRef<HTMLInputElement | null>(null);
  const quantityInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  // Exponer métodos para enfocar inputs
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
          // Fallback: si no encuentra el input específico, enfoca el primero
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
        cell: ({ getValue }) => (
          <div className="text-center">{getValue<number>()}</div>
        ),
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
      },
      {
        accessorFn: (row) => row.producto.codigo_oem,
        id: "codigo_oem",
        header: "Cód. OEM",
        cell: ({ getValue }) => <div>{formatCell(getValue<string>())}</div>,
      },
      {
        accessorFn: (row) => row.producto.descripcion,
        id: "descripcion",
        header: "Descripción",
        size: 300,
        minSize: 250,
        enableHiding: false,
        cell: ({ getValue }) => (
          <div className="flex items-center">
            <h3 className="font-medium text-gray-700 truncate">
              {getValue<string>()}
            </h3>
          </div>
        ),
      },
      {
        accessorKey: "cantidad",
        id: "cantidad",
        header: "Cantidad",
        minSize: 110,
        cell: ({ getValue, row }) => {
          const cantidad = getValue<number>();
          const productId = row.original.id_producto;
          const refToAssign = row.index === 0 ? firstQuantityInputRef : null;
          return (
            <EditableQuantity
              value={cantidad}
              className="w-full"
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
              disabled={isReadOnly}
            />
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
          return (
            <EditablePrice
              value={basePrice}
              onSubmit={(value) => updatePrice(product.id, value as number)}
              className="w-full"
              buttonClassName="w-full"
              numberProps={{ min: 0, step: 0.01 }}
              disabled={isReadOnly}
            />
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
          const subtotal = item.cantidad * item.precio;
          return (
            <EditablePrice
              value={subtotal}
              onSubmit={(value) =>
                updateCustomSubtotal(product.id, value as number)
              }
              className="w-full"
              inputClassName="hover:bg-green-50 text-green-600 hover:text-green-600 border-green-200"
              numberProps={{ min: 0, step: 0.01 }}
              disabled={isReadOnly}
            />
          );
        },
      },
      {
        accessorFn: (row) => row.producto.marca,
        id: "marca",
        header: "Marca",
        cell: ({ getValue }) => {
          const marca = getValue<string>();
          return <span>{marca}</span>;
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
                className="text-red-500 hover:text-red-500 size-7 cursor-pointer"
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
    [removeItem, updateQuantity, updatePrice, updateCustomSubtotal]
  );

  const { table } = useCustomTable({
    data: products,
    columns,

    // Configuración de características
    enableSorting: true,
    enableColumnResizing: true,
    enableColumnOrdering: true,

    // Configuración de resize
    columnResizeMode: "onChange",
    defaultSortBy: [{ id: "orden", desc: false }],

    hiddenColumns: ["id_detalle_venta"],

    // Persistencia con key única por usuario
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

// Exportar con forwardRef tipado correctamente
const SaleDetailsEditingTable = forwardRef(
  SaleDetailsEditingTableInner
) as React.ForwardRefExoticComponent<
  SaleDetailsEditingTableProps & React.RefAttributes<SaleDetailsEditingTableRef>
>;

SaleDetailsEditingTable.displayName = "SaleDetailsEditingTable";

export default SaleDetailsEditingTable;
