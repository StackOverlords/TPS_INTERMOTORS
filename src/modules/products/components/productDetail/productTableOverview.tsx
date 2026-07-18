import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import CustomizableTable from "@/components/common/CustomizableTable";
import { type ColumnDef } from "@tanstack/react-table";
import type { ProductStock } from "../../types/productStock";
import { formatCurrency } from "@/utils/formaters";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Edit, Loader2, Save, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { parseDateForUi } from "@/utils/dateFormatters";
import { EditablePrice } from "@/modules/shoppingCart/components/editablePrice";
import { usePermissionCheck } from "@/hooks/usePermissionCheck";
import { PERMISSIONS } from "@/lib/permissions";
import { useStockPriceDrafts } from "../../hooks/useInlineStockPriceUpdate";

interface ProductTableOverviewProps {
  productStockData: ProductStock[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  className?: string;
  filterByStock?: boolean;
  sortByDate?: boolean;
  onEditPrice?: (detail: ProductStock) => void;
}

const ProductTableOverview: React.FC<ProductTableOverviewProps> = ({
  productStockData,
  isError,
  isFetching,
  isLoading,
  className,
  filterByStock = false,
  sortByDate = false,
  onEditPrice,
}) => {
  const user = authSDK.getCurrentUser();

  // Edición inline de precios gateada por el permiso del endpoint update_prices
  const { isAuthorized: canEditPrice } = usePermissionCheck({
    permission: PERMISSIONS.COM.UPDATE_PRICES,
    roles: [],
    requireBoth: false,
  });
  const {
    getFieldValue,
    setDraftField,
    dirtyCount,
    discard,
    save,
    isSaving,
  } = useStockPriceDrafts();

  // 🔥 Filtrar datos por stock si filterByStock = true
  const filteredData = useMemo(() => {
    if (!filterByStock) return productStockData;
    return productStockData.filter((item) => item.saldo > 0);
  }, [productStockData, filterByStock]);

  // 🔥 Calcular stock total de datos filtrados
  const stockTotal = useMemo(() => {
    return filteredData.reduce((total, item) => total + item.saldo, 0);
  }, [filteredData]);

  const columns: ColumnDef<ProductStock>[] = [
    {
      accessorKey: "fecha_adquisicion",
      header: "Fecha Entrada",
      enableHiding: false,
      minSize: 30,
      size: 70,
      cell: ({ getValue }) => {
        const rawFecha = getValue() as string;

        if (!rawFecha)
          return <span className="text-muted-foreground">Sin fecha</span>;

        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{parseDateForUi(rawFecha)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "costo",
      header: `Costo`,
      minSize: 30,
      size: 80,
      cell: ({ getValue }) => (
        <div className="text-end">{formatCurrency(getValue<number>())}</div>
      ),
    },
    {
      accessorKey: "cantidad",
      header: `Cantidad`,
      minSize: 30,
      size: 60,
      cell: ({ getValue }) => {
        const value = getValue<number>();
        return <div className="text-end">{value}</div>;
      },
    },
    {
      accessorKey: "precio_venta",
      header: `Precio Venta F.`,
      minSize: 30,
      size: 90,
      cell: ({ row }) => {
        const detail = row.original;
        if (!canEditPrice)
          return (
            <div className="text-end">{formatCurrency(detail.precio_venta)}</div>
          );
        const value = getFieldValue(detail, "precio_venta");
        const changed = value !== detail.precio_venta;
        return (
          <EditablePrice
            value={value}
            onSubmit={(val) =>
              setDraftField(
                detail,
                "precio_venta",
                typeof val === "number" ? val : parseFloat(val.toString()) || 0
              )
            }
            showEditIcon={false}
            autoSelect
            inputClassName="text-end"
            buttonClassName={cn(
              "justify-end",
              changed && "text-amber-600 dark:text-amber-400 font-semibold"
            )}
          />
        );
      },
    },
    {
      accessorKey: "precio_venta_alt",
      header: `Precio Venta Alt.`,
      minSize: 30,
      size: 90,
      cell: ({ row }) => {
        const detail = row.original;
        if (!canEditPrice)
          return (
            <div className="text-end">
              {formatCurrency(detail.precio_venta_alt)}
            </div>
          );
        const value = getFieldValue(detail, "precio_venta_alt");
        const changed = value !== detail.precio_venta_alt;
        return (
          <EditablePrice
            value={value}
            onSubmit={(val) =>
              setDraftField(
                detail,
                "precio_venta_alt",
                typeof val === "number" ? val : parseFloat(val.toString()) || 0
              )
            }
            showEditIcon={false}
            autoSelect
            inputClassName="text-end"
            buttonClassName={cn(
              "justify-end",
              changed && "text-amber-600 dark:text-amber-400 font-semibold"
            )}
          />
        );
      },
    },
    {
      accessorKey: "tc_compra",
      header: `TC Compra`,
      minSize: 30,
      size: 60,
      cell: ({ getValue }) => {
        const value = getValue<number>();
        return (
          <div className="text-end">
            {formatCurrency(value, {
              currency: "USD",
              locale: "en-US",
              usdFormat: "symbol",
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "saldo",
      header: "Stock",
      minSize: 30,
      size: 60,
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Badge
            variant={
              row.original.saldo > 20
                ? "success"
                : row.original.saldo > 10
                  ? "warning"
                  : "danger"
            }
            className="font-semibold"
          >
            {row.original.saldo}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      minSize: 30,
      size: 50,
      cell: ({ getValue }) => (
        <div className="flex items-center justify-center">
          <Badge variant="info" className="text-xs">
            {getValue<number>()}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "fecha_actualizacion",
      header: "Fecha Mod Precio",
      minSize: 30,
      size: 80,
      cell: ({ getValue }) => {
        const rawFecha = getValue() as string;

        if (!rawFecha)
          return <span className="text-muted-foreground">Sin fecha</span>;

        return (
          <span className="text-muted-foreground">
            {parseDateForUi(rawFecha)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      size: 80,
      minSize: 80,
      enableHiding: false,
      cell: ({ row }: { row: any }) => (
        <div className="flex justify-center">
          {canEditPrice && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEditPrice?.(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const { table } = useCustomTable({
    data: filteredData,
    columns,

    // Configuración de características
    enableSorting: true,
    enableColumnResizing: true,
    enableColumnOrdering: true,

    // Configuración de resize
    columnResizeMode: "onChange",
    defaultSortBy: [
      ...(sortByDate ? [{ id: "fecha_adquisicion", desc: true }] : []),
    ],

    // Persistencia con key única por usuario
    persistenceKey: `products-overview-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  return (
    <Card
      className={cn(
        "bg-background border border-border flex flex-col",
        className
      )}
    >
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between gap-3 text-base font-semibold text-foreground">
          <span className="flex items-center gap-2 min-w-0">
            <ShoppingCart className="size-4 text-muted-foreground shrink-0" />
            <span className="truncate">Compras Disponibles</span>
            {filterByStock && (
              <Badge variant="info" className="text-xs ml-2 shrink-0">
                Solo con stock
              </Badge>
            )}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {canEditPrice && dirtyCount > 0 && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={discard}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => save(filteredData)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Guardar ({dirtyCount})
                </Button>
              </>
            )}
            <Badge variant="secondary">Stock Total: {stockTotal}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="h-full">
          <CustomizableTable
            table={table}
            isError={isError}
            isFetching={isFetching}
            isLoading={isLoading}
            errorMessage="Ocurrió un error al cargar los productos"
            enableColumnReordering={true}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductTableOverview;
