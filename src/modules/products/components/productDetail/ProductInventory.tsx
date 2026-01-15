import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import CustomizableTable from "@/components/common/CustomizableTable";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Building2, Edit } from "lucide-react";
import type { ProductStock } from "../../types/productStock";
import { formatCurrency } from "@/utils/formaters";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { Switch } from "@/components/atoms/switch";
import { Label } from "@/components/atoms/label";

interface ProductInventoryProps {
  productStockData: ProductStock[];
  isLoadingData: boolean;
  isErrorData: boolean;
  className?: string;
  filterByStock?: boolean;
  sortByDate?: boolean;
  onEditPrice?: (detail: ProductStock) => void;
}

const ProductInventory: React.FC<ProductInventoryProps> = ({
  productStockData,
  isErrorData,
  isLoadingData,
  className,
  filterByStock = false,
  sortByDate = false,
  onEditPrice,
}) => {
  const user = authSDK.getCurrentUser();
  const [updatePricesMode, setUpdatePricesMode] = useState(false);

  // 🔥 Filtrar datos por stock si filterByStock = true
  const filteredData = useMemo(() => {
    if (!filterByStock) return productStockData;
    return productStockData.filter((item) => item.saldo > 0);
  }, [productStockData, filterByStock]);

  const columns: ColumnDef<ProductStock>[] = [
    {
      accessorKey: "fecha_adquisicion",
      header: "Fecha",
      enableHiding: false,
      minSize: 30,
      size: 80,
      cell: ({ getValue }) => {
        const rawFecha = getValue() as string;

        if (!rawFecha) return <span className="text-gray-400">Sin fecha</span>;

        const fecha = new Date(rawFecha);
        const fechaFormatted = format(fecha, "dd-MM-yyyy");

        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{fechaFormatted}</span>
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
              row.original.saldo > 15
                ? "success"
                : row.original.saldo > 5
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
      cell: ({ getValue }) => {
        const value = getValue<number>();
        return <div className="text-end">{formatCurrency(value)}</div>;
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
      accessorKey: "sucursal",
      header: "Sucursal",
      minSize: 30,
      size: 60,
      cell: ({ getValue }) => (
        <div className="flex items-center justify-center">
          <Badge variant={"outline"} className="font-semibold">
            {getValue<string>()}
          </Badge>
        </div>
      ),
    },
    ...(updatePricesMode
      ? [
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
          } as ColumnDef<ProductStock>,
        ]
      : []),
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
    persistenceKey: `products-inventory-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  return (
    <Card
      className={cn("bg-card border border-border flex flex-col", className)}
    >
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-3 text-base font-semibold text-gray-900 justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="size-4 text-gray-700" />
            Detalle disponibles en otras sucursales
            {filterByStock && (
              <Badge variant="info" className="text-xs">
                Solo con stock
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 h-8 px-2 rounded-sm border-border border">
            <Switch
              id="update-prices-other-branches"
              checked={updatePricesMode}
              onCheckedChange={setUpdatePricesMode}
            />
            <Label
              className="font-bold cursor-pointer"
              htmlFor="update-prices-other-branches"
            >
              Act. Precio
            </Label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="h-full">
          <CustomizableTable
            table={table}
            isLoading={isLoadingData}
            isError={isErrorData}
            enableColumnReordering={true}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductInventory;
