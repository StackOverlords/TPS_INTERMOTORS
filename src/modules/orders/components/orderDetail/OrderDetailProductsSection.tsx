import { Badge } from "@/components/atoms/badge";
import { TableCell, TableRow } from "@/components/atoms/table";
import CustomizableTable from "@/components/common/CustomizableTable";
import { formatCell } from "@/utils/formatCell";
import { formatCurrency } from "@/utils/formaters";
import { formatNumber } from "@/utils/numberFormatters";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Package, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { OrderDetailGetById } from "../../types/orderGet.types";
import { Input } from "@/components/atoms/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/button";

interface OrderDetailProductsSectionProps {
  products: OrderDetailGetById[],
  isLoading: boolean,
  totalAmount: number
}
const OrderDetailProductsSection: React.FC<OrderDetailProductsSectionProps> = ({
  isLoading,
  products,
  totalAmount
}) => {

  const SEARCH_MODE: "realtime" | "manual" = "manual";
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const isManual = SEARCH_MODE === "manual";

  const handleSearch = () => {
    if (isManual) setSearchTerm(searchInput.trim());
  };

  const normalizedProducts = useMemo(() => {
    return products
      .map((item, index) => ({
        ...item,
        orden: item.orden ?? index + 1  // Asigna orden secuencial si es null
      }))
      .sort((a, b) => a.orden - b.orden); // Siempre ordenar por orden
  }, [products]);

  // Cuando el modo es realtime, el término de búsqueda es el input directamente
  const termToFilter = isManual ? searchTerm : searchInput;

  const filteredOrderItems = useMemo(() => {
    return normalizedProducts.filter(item =>
      item.producto.descripcion.toLowerCase().includes(termToFilter.toLowerCase())
    );
  }, [normalizedProducts, termToFilter]);

  // Calcular total de cantidades
  const totalCantidad = useMemo(() => {
    return filteredOrderItems.reduce((total, product) => {
      const cantidad = typeof product.cantidad === "string"
        ? parseFloat(product.cantidad)
        : product.cantidad;
      return total + (isFinite(cantidad) ? cantidad : 0);
    }, 0);
  }, [filteredOrderItems]);

  const filteredTotalAmount = useMemo(() => {
    return filteredOrderItems.reduce((total, product) => {
      const cantidad =
        typeof product.cantidad === "string"
          ? parseFloat(product.cantidad)
          : product.cantidad;

      const costo = product.costo;
      const subtotal = costo * cantidad;

      return total + subtotal;
    }, 0);
  }, [filteredOrderItems]);

  const finalTotal = termToFilter.trim()
    ? filteredTotalAmount
    : totalAmount;

  const columns = useMemo<ColumnDef<OrderDetailGetById>[]>(() => [
    {
      accessorKey: "orden",
      header: "N°",
      size: 30,
      minSize: 20,
    },
    {
      accessorFn: row => row.producto.codigo_interno,
      accessorKey: "codigo_interno",
      header: "Cód.Int",
      size: 50,
      minSize: 30,
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <span className="text-center text-xs text-gray-600">{row.original.producto.codigo_interno}</span>
        )
      },
    },
    {
      accessorFn: row => row.producto.codigo_oem,
      id: "codigo_oem",
      header: "Código OEM",
      size: 130,
      minSize: 80,
      cell: ({ getValue }) => (
        <div className="space-y-0.5">
          <div className="font-mono text-xs text-gray-900 truncate">
            {formatCell(getValue<string>())}
          </div>
        </div>
      ),
    },
    {
      accessorFn: row => row.producto.descripcion,
      id: "descripcion",
      header: "Descripción",
      size: 300,
      minSize: 200,
      cell: ({ getValue }) => {
        // const product = row.original.producto
        const descripcion = getValue<string>()
        return (
          <div className="space-y-0.5">
            <h3 title="Descripción" className="text-xs font-medium text-gray-900 leading-tight truncate">
              {descripcion}
            </h3>

            {/* <div className="flex flex-wrap gap-1 mt-1">
              {product.categoria && (
                <Badge variant="accent" title="Categoria" className="text-[10px] border-gray-300">{product.categoria.categoria}</Badge>
              )}
              {product.marca && (
                <Badge variant="outline" title="Marca" className="text-[10px] border-gray-300"> {product.marca.marca}</Badge>
              )}
            </div> */}
          </div>
        )
      },
    },
    {
      accessorKey: "cantidad",
      header: "Cantidad",
      size: 90,
      minSize: 80,
      cell: ({ row }) => {
        const product = row.original.producto;
        const cantidad = typeof row.original.cantidad === "string"
          ? parseFloat(row.original.cantidad)
          : row.original.cantidad;
        const cantidadDisplay = isFinite(cantidad) ? cantidad.toFixed(0) : "0";

        return (
          <div className="text-center">
            <div className="text-sm font-medium">{cantidadDisplay}</div>
            {product.unidad_medida && (
              <div className="text-[10px] text-gray-500">{product.unidad_medida.unidad_medida}</div>
            )}
          </div>
        )
      },
      sortingFn: "alphanumeric",
    },
    {
      accessorKey: "costo",
      header: "Costo",
      size: 90,
      minSize: 80,
      cell: ({ getValue, row }) => {
        const product = row.original
        const value = getValue<number>()
        return (
          <div className="text-center">
            <span className="text-xs font-medium">
              {formatCurrency(value, { currency: product.moneda })}
            </span>
          </div>
        )
      },
      sortingFn: "alphanumeric",
    },
    {
      accessorKey: "tc_compra",
      header: "T.C.",
      size: 70,
      minSize: 60,
      cell: ({ getValue }) => {
        const value = getValue<number>()
        return (
          <div className="text-center">
            <span className="text-xs font-medium text-blue-600">
              {formatNumber(value)}
            </span>
          </div>
        )
      },
      sortingFn: "alphanumeric",
    },
    {
      id: "subtotal",
      header: "Subtotal",
      size: 80,
      minSize: 70,
      cell: ({ row }) => {
        const product = row.original
        const subtotal = product.costo * product.cantidad

        return (
          <div className="text-right font-bold text-emerald-600">
            {formatCurrency(subtotal, { currency: product.moneda })}
          </div>
        )
      },
      sortingFn: "alphanumeric",
    },
    {
      accessorFn: row => row.producto.marca,
      id: "marca",
      header: "Marca",
      size: 80,
      minSize: 50,
      cell: ({ row }) => {
        const product = row.original.producto
        return (
          <div className="space-y-0.5">
            {product.marca && (
              <Badge variant="outline" title="Marca" className="text-[10px] border-gray-300"> {product.marca.marca}</Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorFn: row => row.producto.codigo_upc,
      id: "codigo_upc",
      header: "Código UPC",
      size: 130,
      minSize: 80,
      cell: ({ getValue }) => (
        <div className="space-y-0.5">
          <div className="font-mono text-xs text-gray-900 truncate">
            {formatCell(getValue<string>())}
          </div>
        </div>
      ),
    },
    {
      accessorFn:row=> row.inc_precio_venta,
      header: "Inc. %",
      size: 90,
      minSize: 80,
      cell: ({ getValue }) => {
        return (
          <div className="text-center">
            <span className="text-xs font-medium">{formatNumber(getValue() as number | null)}%</span>
          </div>
        )
      },
      sortingFn: "alphanumeric",
    },
    {
      accessorFn:row=> row.precio_venta,
      id: 'precio_venta',
      header: "P. Venta",
      size: 110,
      minSize: 80,
      cell: ({ getValue, row }) => {
        const product = row.original
        const value = getValue<number>()
        return (
          <div className="text-center">
            <span className="text-xs font-medium">
              {formatCurrency(value, { currency: product.moneda })}
            </span>
          </div>
        )
      },
      sortingFn: "alphanumeric",
    },
    {
      accessorFn:row=> row.inc_precio_venta_alt,
      id: 'inc_p_venta_alt',
      header: "Inc. Alt %",
      size: 110,
      minSize: 80,
      cell: ({ getValue }) => (
        <div className="text-center">
          <span className="text-xs font-medium">{formatNumber(getValue() as number | null)}%</span>
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      accessorFn:row=> row.precio_venta_alt,
      id: 'precio_venta_alt',
      header: "P. Venta Alt",
      size: 110,
      minSize: 80,
      cell: ({ getValue, row }) => {
        const product = row.original
        const value = getValue<number>()
        return (
          <div className="text-center">
            <span className="text-xs font-medium">
              {formatCurrency(value, { currency: product.moneda })}
            </span>
          </div>
        )
      },
      sortingFn: "alphanumeric",
    },
  ], []);

  const table = useReactTable<OrderDetailGetById>({
    data: filteredOrderItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    enableRowSelection: true,
  })

  return (
    <section className="border border-border rounded-lg bg-card flex-1 flex flex-col overflow-hidden">
      <header className="p-2 border-b border-border flex-shrink-0 space-y-1">
        <h3 className="text-base font-medium text-primary flex gap-2 items-center">
          <Package className="size-4" />
          Productos del Pedido
        </h3>
        <p className="text-xs text-gray-600">
          {filteredOrderItems.length} {filteredOrderItems.length === 1 ? "producto" : "productos"} en total
        </p>

        <div className="flex gap-2 w-full lg:w-1/2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto por descripción..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={cn(
                "pl-10",
                searchInput.trim() !== "" && "pr-10"
              )}
            />
            {searchInput.trim() !== "" && (
              <Button
                variant={'outline'}
                onClick={() => {
                  setSearchInput("");
                  if (isManual) setSearchTerm(""); // reset también en manual
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 size-6 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent hover:border-red-200"
              >
                <X className="size-3" />
              </Button>
            )}
          </div>

          {isManual && (
            <Button onClick={handleSearch}>
              <Search className="size-4" />
              Buscar
            </Button>
          )}
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        <CustomizableTable
          table={table}
          isLoading={isLoading}
          stickyHeader={true}
          rows={filteredOrderItems.length}
          renderBottomRow={() => (
            <TableRow className="bg-gray-50 font-semibold sticky bottom-0 hover:bg-gray-50">
              {table.getVisibleFlatColumns().map((column) => {
                if (column.id === 'cantidad') {
                  return (
                    <TableCell key={column.id} className="text-center p-1">
                      <div className="text-xs text-muted-foreground mb-0.5">Total Cantidad</div>
                      <div className="text-sm font-bold text-blue-600">
                        {totalCantidad.toFixed(0)}
                      </div>
                    </TableCell>
                  );
                }
                if (column.id === 'subtotal') {
                  return (
                    <TableCell key={column.id} className="text-right p-1">
                      <div className="text-xs text-muted-foreground mb-0.5">Total</div>
                      <div className="text-sm font-bold text-emerald-600">
                        {formatCurrency(finalTotal)}
                      </div>
                    </TableCell>
                  );
                }
                return <TableCell key={column.id} />;
              })}
            </TableRow>
          )}
        />
      </div>
    </section>
  );
}

export default OrderDetailProductsSection;