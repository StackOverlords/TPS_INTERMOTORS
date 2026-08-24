import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { BrushCleaning, Search, ShoppingCart, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Badge } from "@/components/atoms/badge";
import CustomizableTable from "@/components/common/CustomizableTable";
import { EditableField } from "@/components/common/EditableField";
import TooltipButton from "@/components/common/TooltipButton";
import ConfirmationModal from "@/components/common/confirmationModal";
import { useCustomTable } from "@/hooks/useCustomTable";
import { formatDate } from "@/utils/formaters";
import { useOrderCart } from "../hooks/useOrderCart";
import type { OrderCartItem } from "../types/orderCart.types";

/**
 * Vista completa de la lista de compras (carrito de pedido).
 *
 * Misma fuente de datos que `OrderCartSheet`: ambos consumen
 * `useOrderCart()`, nadie toca el store directo. Si mañana el carrito pasa
 * al backend, se reescribe el interior del hook y esta pantalla no cambia.
 *
 * El descuento NO ocurre acá: lo dispara `orderCreateScreen` vía
 * `removeQuantities()` cuando se registra el pedido. Esta pantalla lee,
 * edita cantidades y quita líneas.
 */
const OrderCartListScreen = () => {
  const navigate = useNavigate();
  const { items, count, isReady, updateCantidad, removeItem, clear } =
    useOrderCart();
  const [search, setSearch] = useState("");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter(({ product }) =>
      [product.descripcion, product.codigo_oem, product.marca]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term)),
    );
  }, [items, search]);

  const totalUnidades = useMemo(
    () => items.reduce((acc, item) => acc + item.cantidad, 0),
    [items],
  );

  const columns = useMemo<ColumnDef<OrderCartItem>[]>(
    () => [
      {
        id: "descripcion",
        accessorFn: (row) => row.product.descripcion,
        header: "Descripción",
        size: 320,
        cell: ({ row }) => (
          <span className="text-xs font-medium">
            {row.original.product.descripcion}
          </span>
        ),
      },
      {
        id: "codigo_oem",
        accessorFn: (row) => row.product.codigo_oem,
        header: "Código OEM",
        size: 140,
        cell: ({ row }) => (
          <span className="text-xs">{row.original.product.codigo_oem}</span>
        ),
      },
      {
        id: "marca",
        accessorFn: (row) => row.product.marca,
        header: "Marca",
        size: 120,
        cell: ({ row }) => (
          <span className="text-xs">{row.original.product.marca}</span>
        ),
      },
      {
        id: "stock_actual",
        accessorFn: (row) => row.product.stock_actual,
        header: "Stock",
        size: 80,
        cell: ({ row }) => (
          <span className="text-xs tabular-nums">
            {row.original.product.stock_actual}
          </span>
        ),
      },
      {
        id: "en_camino",
        accessorFn: (row) => row.product.pedido_transito,
        header: "En camino",
        size: 100,
        cell: ({ row }) => {
          const { pedido_transito, pedido_almacen } = row.original.product;
          if (pedido_transito <= 0 && pedido_almacen <= 0) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }

          return (
            <div className="flex flex-wrap gap-1">
              {pedido_transito > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {pedido_transito} tránsito
                </Badge>
              )}
              {pedido_almacen > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {pedido_almacen} almacén
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "cantidad",
        accessorFn: (row) => row.cantidad,
        header: "Cantidad a pedir",
        size: 130,
        cell: ({ row }) => (
          <EditableField
            value={row.original.cantidad}
            type="number"
            numberProps={{ min: 1, step: 1 }}
            onSubmit={(value) =>
              updateCantidad(row.original.product.id, Number(value))
            }
          />
        ),
      },
      {
        id: "addedAt",
        accessorFn: (row) => row.addedAt,
        header: "Agregado",
        size: 120,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.addedAt)}
          </span>
        ),
      },
      {
        id: "acciones",
        header: "",
        size: 60,
        enableSorting: false,
        cell: ({ row }) => (
          <TooltipButton
            tooltip="Quitar de la lista"
            onClick={() => removeItem(row.original.product.id)}
            buttonProps={{
              variant: "ghost",
              size: "icon",
              className: "size-7 cursor-pointer text-destructive",
            }}
          >
            <Trash2 className="h-4 w-4" />
          </TooltipButton>
        ),
      },
    ],
    [updateCantidad, removeItem],
  );

  const { table } = useCustomTable<OrderCartItem>({
    data: filteredItems,
    columns,
    enableSorting: true,
    enableColumnResizing: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    persistenceKey: "order-cart-list",
    persistColumnOrder: true,
    persistColumnVisibility: true,
    persistColumnSizing: true,
  });

  // Scope sin resolver (sin usuario o sin sucursal, incluida la ventana de
  // hidratación async del auth). Sin esto la pantalla parpadearía el estado
  // vacío antes de que el carrito real esté disponible.
  if (!isReady) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Cargando lista de compras...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <ShoppingCart className="h-5 w-5" />
            Lista de compras
          </h1>
          <p className="text-sm text-muted-foreground">
            {count} producto{count === 1 ? "" : "s"} pendiente
            {count === 1 ? "" : "s"}
            {totalUnidades > 0 && ` · ${totalUnidades} unidades en total`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {count > 0 && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="w-64 pl-8"
                placeholder="Buscar en la lista..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={count === 0}
            onClick={() => navigate("/dashboard/create-order")}
          >
            <Truck className="h-4 w-4" />
            Registrar pedido
          </Button>

          {count > 0 && (
            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              onClick={() => setConfirmClearOpen(true)}
            >
              <BrushCleaning className="h-4 w-4" />
              Vaciar lista
            </Button>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        <CustomizableTable
          table={table}
          isLoading={false}
          enableColumnReordering
          enableSorting
          stickyHeader
          noDataMessage={
            count === 0
              ? "No tenés nada pendiente de comprar. Agregá productos desde el listado principal y van a aparecer acá hasta que los pidas."
              : `Ningún producto de la lista coincide con "${search}".`
          }
        />
      </div>

      <ConfirmationModal
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          clear();
          setConfirmClearOpen(false);
        }}
        title="Vaciar lista de compras"
        message={`Se van a quitar los ${count} productos pendientes. Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default OrderCartListScreen;
