import { TableCell, TableRow } from "@/components/atoms/table";
import CustomizableTable from "@/components/common/CustomizableTable";
import { formatCurrency } from "@/utils/formaters";
import { formatNumber } from "@/utils/numberFormatters";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Package, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { QuotationItemGetById } from "../../types/quotationGet.types";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils";

interface QuotationProductsSectionProps {
  products: QuotationItemGetById[];
  isLoading: boolean;
  totalAmount: number;
}
const QuotationProductsSection: React.FC<QuotationProductsSectionProps> = ({
  isLoading,
  products,
  totalAmount,
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
        orden: item.orden ?? index + 1, // Asigna orden secuencial si es null
      }))
      .sort((a, b) => a.orden - b.orden); // Siempre ordenar por orden
  }, [products]);

  // Cuando el modo es realtime, el término de búsqueda es el input directamente
  const termToFilter = isManual ? searchTerm : searchInput;

  const filteredQuotationItems = useMemo(() => {
    return normalizedProducts.filter((item) =>
      item.producto.descripcion
        .toLowerCase()
        .includes(termToFilter.toLowerCase())
    );
  }, [normalizedProducts, termToFilter]);

  // Calcular total de cantidades
  const totalCantidad = useMemo(() => {
    return filteredQuotationItems.reduce((total, product) => {
      const cantidad =
        typeof product.cantidad === "string"
          ? parseFloat(product.cantidad)
          : product.cantidad;
      return total + (isFinite(cantidad) ? cantidad : 0);
    }, 0);
  }, [filteredQuotationItems]);

  const filteredTotalAmount = useMemo(() => {
    return filteredQuotationItems.reduce((total, product) => {
      const cantidad =
        typeof product.cantidad === "string"
          ? parseFloat(product.cantidad)
          : product.cantidad;

      const precio = product.precio;
      const descuentoPercent = product.porcentaje_descuento ?? 0;

      const subtotal = precio * cantidad;
      const totalConDescuento = subtotal * (1 - descuentoPercent / 100);

      return total + totalConDescuento;
    }, 0);
  }, [filteredQuotationItems]);

  const finalTotal = termToFilter.trim() ? filteredTotalAmount : totalAmount;

  const columns = useMemo<ColumnDef<QuotationItemGetById>[]>(
    () => [
      {
        accessorKey: "orden",
        header: "N°",
        size: 30,
        minSize: 20,
      },
      {
        accessorKey: "id",
        header: "Cód",
        size: 35,
        minSize: 30,
        enableHiding: false,
        cell: ({ getValue }) => (
          <span className="text-center text-xs text-muted-foreground">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorFn: (row) => row.producto.descripcion,
        id: "descripcion",
        header: "Descripción",
        size: 250,
        minSize: 40,
        cell: ({ getValue }) => {
          const descripcion = getValue<string>();
          return (
            <div className="space-y-0.5">
              <h3
                title="Descripción"
                className="text-xs font-medium text-primary leading-tight truncate"
              >
                {descripcion}
              </h3>
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.producto.codigo_oem,
        id: "codigo_oem",
        header: "Código OEM",
        size: 100,
        minSize: 80,
      },
      {
        accessorFn: (row) => row.producto.codigo_upc,
        id: "codigo_upc",
        header: "Código UPC",
        size: 100,
        minSize: 80,
      },
      {
        accessorFn: (row) => row.producto.categoria?.categoria,
        id: "categoria",
        header: "División",
        size: 100,
        minSize: 80,
      },
      {
        accessorFn: (row) => row.producto.marca?.marca,
        id: "marca",
        header: "Marca",
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "cantidad",
        header: "Cantidad",
        size: 90,
        minSize: 80,
        cell: ({ row }) => {
          const product = row.original.producto;
          const cantidad =
            typeof row.original.cantidad === "string"
              ? parseFloat(row.original.cantidad)
              : row.original.cantidad;
          const cantidadDisplay = isFinite(cantidad)
            ? cantidad.toFixed(0)
            : "0";

          return (
            <div className="text-center">
              <div className="text-sm font-medium">{cantidadDisplay}</div>
              {product.unidad_medida && (
                <div className="text-[10px] text-muted-foreground">
                  {product.unidad_medida.unidad_medida}
                </div>
              )}
            </div>
          );
        },
        sortingFn: "alphanumeric",
      },
      {
        accessorKey: "precio",
        header: "Precio U.",
        size: 80,
        minSize: 70,
        cell: ({ getValue, row }) => (
          <div className="font-medium flex items-center justify-end">
            {formatCurrency(getValue<number>(), {
              currency: row.original.monenda,
            })}
          </div>
        ),
        sortingFn: "alphanumeric",
      },
      {
        accessorKey: "descuento",
        header: "Descuento",
        size: 80,
        minSize: 70,
        cell: ({ getValue, row }) => {
          const discountPercent = formatNumber(
            row.original.porcentaje_descuento
          );
          return (
            <div className="font-medium flex items-end justify-center flex-col">
              {discountPercent && (
                <span className="text-destructive">{discountPercent}%</span>
              )}
              <span>
                {formatCurrency(getValue<number>(), {
                  currency: row.original.monenda,
                })}
              </span>
            </div>
          );
        },
        sortingFn: "alphanumeric",
      },
      {
        id: "subtotal",
        header: "Subtotal",
        size: 80,
        minSize: 70,
        cell: ({ row }) => {
          const product = row.original;
          const subtotal = product.precio * product.cantidad;
          const descuento =
            product.porcentaje_descuento != null
              ? 1 - product.porcentaje_descuento / 100
              : 1;
          const total = subtotal * descuento;

          return (
            <div className="text-right font-bold text-emerald-600">
              {formatCurrency(total, { currency: product.monenda })}
            </div>
          );
        },
        sortingFn: "alphanumeric",
      },
    ],
    []
  );

  const table = useReactTable<QuotationItemGetById>({
    data: filteredQuotationItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    enableRowSelection: true,
  });

  return (
    <section className="border border-border rounded-lg bg-background flex-1 flex flex-col overflow-hidden">
      <header className="p-2 border-b border-border flex-shrink-0 space-y-1">
        <h3 className="text-base font-medium text-primary flex gap-2 items-center">
          <Package className="size-4" />
          Productos de la cotizacion
        </h3>
        <p className="text-xs text-muted-foreground">
          {filteredQuotationItems.length}{" "}
          {filteredQuotationItems.length === 1 ? "producto" : "productos"} en
          total
        </p>

        <div className="flex gap-2 w-full lg:w-1/2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto por descripción..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={cn("pl-10", searchInput.trim() !== "" && "pr-10")}
            />
            {searchInput.trim() !== "" && (
              <Button
                variant={"outline"}
                onClick={() => {
                  setSearchInput("");
                  if (isManual) setSearchTerm(""); // reset también en manual
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 size-6 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent hover:border-destructive/30"
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
          rows={filteredQuotationItems.length}
          renderBottomRow={() => (
            <TableRow className="bg-accent/30 font-semibold sticky bottom-0 hover:bg-accent/30">
              {table.getVisibleFlatColumns().map((column) => {
                if (column.id === "cantidad") {
                  return (
                    <TableCell key={column.id} className="text-center p-1">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        Total Cantidad
                      </div>
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {totalCantidad.toFixed(0)}
                      </div>
                    </TableCell>
                  );
                }
                if (column.id === "subtotal") {
                  return (
                    <TableCell key={column.id} className="text-right p-1">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        Total
                      </div>
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
};

export default QuotationProductsSection;
