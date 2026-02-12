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
import { Edit, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { parseDateForUi } from "@/utils/dateFormatters";

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
      size: 80,
      cell: ({ getValue }) => {
        const value = getValue<number>();
        return <div className="text-end">{formatCurrency(value)}</div>;
      },
    },
    {
      accessorKey: "precio_venta_alt",
      header: `Precio Venta Alt.`,
      minSize: 30,
      size: 80,
      cell: ({ getValue }) => (
        <div className="text-end">{formatCurrency(getValue<number>())}</div>
      ),
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
            {value > 0 ? (
              <>
                {formatCurrency(value, {
                  currency: "USD",
                  locale: "en-US",
                  usdFormat: "symbol",
                })}
              </>
            ) : (
              <span className="font-medium">-</span>
            )}
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEditPrice?.(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
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
          <span className="flex items-center gap-2">
            <ShoppingCart className="size-4 text-muted-foreground" />
            Compras Disponibles
            {filterByStock && (
              <Badge variant="info" className="text-xs ml-2">
                Solo con stock
              </Badge>
            )}
          </span>
          <Badge variant="secondary">Stock Total: {stockTotal}</Badge>
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
