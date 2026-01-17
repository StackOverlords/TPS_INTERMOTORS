import { Badge } from "@/components/atoms/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Truck } from "lucide-react";
import type { ProductProviderOrder } from "../../types/ProductProviderOrder";
import { type ColumnDef } from "@tanstack/react-table";
import CustomizableTable from "@/components/common/CustomizableTable";
import { formatCurrency } from "@/utils/formaters";
import authSDK from "@/services/sdk-simple-auth";
import { useCustomTable } from "@/hooks/useCustomTable";
import { cn } from "@/lib/utils";
import { parseDateForUi } from "@/utils/dateFormatters";

interface ProductLogisticsProps {
  ProductProviderOrders: ProductProviderOrder[];
  isLoadingData: boolean;
  isErrorData: boolean;
  isFetchingData?: boolean;
  className?: string;
  sortByDate?: boolean;
}
const ProductLogistics: React.FC<ProductLogisticsProps> = ({
  ProductProviderOrders,
  isErrorData,
  isLoadingData,
  isFetchingData = false,
  className,
  sortByDate = false,
}) => {
  const user = authSDK.getCurrentUser();

  const columns: ColumnDef<ProductProviderOrder>[] = [
    {
      accessorKey: "fecha_llegada",
      header: "Fecha de Llegada",
      enableHiding: false,
      size: 80,
      minSize: 60,
      cell: ({ getValue }) => {
        const rawFecha = getValue() as string;

        if (!rawFecha) return <span className="text-gray-400">Sin fecha</span>;

        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{parseDateForUi(rawFecha)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "cantidad",
      header: `Cantidad`,
      size: 80,
      minSize: 60,
      cell: ({ getValue }) => {
        const value = getValue<number>();
        return <div className="text-end">{value}</div>;
      },
    },
    {
      accessorKey: "costo",
      header: `Costo`,
      size: 80,
      minSize: 60,
      cell: ({ getValue }) => (
        <div className="text-end">{formatCurrency(getValue<number>())}</div>
      ),
    },
    {
      accessorKey: "nro_pedido",
      header: "Nro Pedido",
      size: 80,
      minSize: 60,
      cell: ({ getValue }) => (
        <div className="flex items-center justify-center">
          <Badge variant={"outline"} className="font-mono font-medium">
            {getValue<string>()}
          </Badge>
        </div>
      ),
    },
  ];

  const { table } = useCustomTable({
    data: ProductProviderOrders,
    columns,

    // Configuración de características
    enableSorting: true,
    enableColumnResizing: true,
    enableColumnOrdering: true,

    // Configuración de resize
    columnResizeMode: "onChange",
    defaultSortBy: [
      ...(sortByDate ? [{ id: "fecha_llegada", desc: true }] : []),
    ],

    // Persistencia con key única por usuario
    persistenceKey: `products-logistic-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  return (
    <Card
      className={cn("bg-card border border-border flex flex-col", className)}
    >
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <Truck className="size-4 text-gray-700" />
          Productos en Tránsito
          <Badge
            variant="secondary"
            className="ml-auto bg-gray-100 text-gray-700"
          >
            {ProductProviderOrders.length} pedidos activos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="h-full">
          <CustomizableTable
            table={table}
            isLoading={isLoadingData}
            isError={isErrorData}
            isFetching={isFetchingData}
            enableColumnReordering={true}
          />
        </div>
      </CardContent>
    </Card>
  );
};
export default ProductLogistics;
