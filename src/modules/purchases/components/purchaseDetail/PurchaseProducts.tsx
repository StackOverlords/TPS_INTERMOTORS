import { Badge } from "@/components/atoms/badge";
import { Input } from "@/components/atoms/input";
import { TabsContent } from "@/components/atoms/tabs";
import { formatCell } from "@/utils/formatCell";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PurchaseDetail } from "../../types/PurchaseDetail";

import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

import {
  TableCell,
  // Table as AtomTable,
  TableRow,
} from "@/components/atoms/table";
import CustomizableTable from "@/components/common/CustomizableTable";

interface PurchaseProductsProps {
  purchase: PurchaseDetail | undefined;
  isLoading: boolean;
  isError: boolean;
}

type ProductRow = {
  id: number | string;
  index: number;
  descripcion: string;
  descripcion_alt?: string | null;
  codigo_interno: string;
  codigo_oem?: string | null;
  motor?: string | null;
  medida?: string | null;
  categoria?: string | null;
  marca?: string | null;
  procedencia?: string | null;
  marca_vehiculo?: string | null;
  cantidad: number;
  unidad?: string | null;
  costo: number;
  subtotal: number;
  moneda?: string | null;
};

const PurchaseProducts: React.FC<PurchaseProductsProps> = ({
  purchase,
  isLoading,
  isError
}) => {

  // Helpers
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (Number.isNaN(num)) return "$0.00";
    return `$${num.toFixed(2)}`;
  };

  // Preparar filas de tabla
  const rows = useMemo<ProductRow[]>(() => {
    if (!purchase?.detalles) return [];
    return purchase.detalles.map((d, i) => {
      const cantidad = parseFloat(d.cantidad);
      const costo = parseFloat(d.costo);
      const subtotal = (isFinite(cantidad) ? cantidad : 0) * (isFinite(costo) ? costo : 0);

      return {
        id: d.id,
        index: i + 1,
        descripcion: d.producto.descripcion,
        descripcion_alt: d.producto.descripcion_alt,
        codigo_interno: String(d.producto.codigo_interno),
        codigo_oem: d.producto.codigo_oem,
        motor: d.producto.nro_motor,
        medida: d.producto.medida,
        categoria: d.producto.categoria?.categoria ?? null,
        marca: d.producto.marca?.marca ?? null,
        procedencia: d.producto.procedencia?.procedencia ?? null,
        marca_vehiculo: d.producto.marca_vehiculo?.marca_vehiculo ?? null,
        cantidad: isFinite(cantidad) ? cantidad : 0,
        unidad: d.producto.unidad_medida?.unidad_medida ?? null,
        costo: isFinite(costo) ? costo : 0,
        subtotal,
        moneda: d.moneda ?? null,
      };
    });
  }, [purchase?.detalles]);

  // Search (in-memory) - user types, we debounce and filter the existing rows
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 250);
    return () => clearTimeout(id);
  }, [search]);

  const filteredRows = useMemo(() => {
    if (!debouncedSearch) return rows;
    return rows.filter(r => {
      const haystack = [
        r.descripcion || "",
        r.descripcion_alt || "",
        r.codigo_interno || "",
        r.codigo_oem || "",
        r.marca || "",
        r.categoria || "",
        r.procedencia || "",
        r.marca_vehiculo || "",
        r.motor || "",
        r.medida || ""
      ].join(" ").toLowerCase();
      return haystack.includes(debouncedSearch);
    });
  }, [rows, debouncedSearch]);

  // Totales (ahora sobre los rows filtrados)
  const totalItems = filteredRows.length;
  const totalImporte = useMemo(
    () => filteredRows.reduce((acc, r) => acc + r.subtotal, 0),
    [filteredRows]
  );

  // Columnas
  const columns = useMemo<ColumnDef<ProductRow>[]>(() => [
    {
      accessorKey: "index",
      header: "#",
      size: 40,
      minSize: 30,
      enableHiding: false,
      cell: ({ getValue }) => (
        <div className="text-center text-xs text-gray-600">{getValue<number>()}</div>
      ),
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      size: 300,
      minSize: 200,
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div title="Descripción" className="text-sm font-medium text-gray-900 leading-tight truncate">
            {row.original.descripcion}
          </div>
          {/* {row.original.descripcion_alt && (
            <div className="text-xs text-gray-500 truncate">
              Alt: {row.original.descripcion_alt}
            </div>
          )} */}
          <div className="flex flex-wrap gap-1 mt-1">
            {row.original.categoria && (
              <Badge variant="outline" title="Categoria" className="text-[10px] border border-gray-300">Cat: {row.original.categoria}</Badge>
            )}
            {row.original.marca && (
              <Badge variant="outline" title="Marca" className="text-[10px] border border-gray-300">Marca: {row.original.marca}</Badge>
            )}
            {row.original.procedencia && (
              <Badge variant="outline" title="Procedencia" className="text-[10px] border border-gray-300">Procedencia: {row.original.procedencia}</Badge>
            )}
            {row.original.marca_vehiculo && (
              <Badge variant="secondary" title="Marca Vehículo" className="text-[10px]">Marca Vehículo: {row.original.marca_vehiculo}</Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "codigo_interno",
      header: "Código interno/Código OEM",
      size: 140,
      minSize: 120,
      cell: ({ getValue, row }) => (
        <div className="space-y-0.5">
          <div title="Código interno" className="font-mono text-xs text-gray-900 truncate">
            Interno:{formatCell(getValue<string>())}
          </div>
          {row.original.codigo_oem && (
            <div title="Código OEM" className="font-mono text-[12px] text-gray-500 truncate">
              OEM: {row.original.codigo_oem}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "motor",
      header: "Motor / Medida",
      size: 140,
      minSize: 120,
      cell: ({ row }) => (
        <div className="space-y-0.5">
          {row.original.motor && (
            <div className="text-xs text-gray-700 truncate">Motor: {row.original.motor}</div>
          )}
          {row.original.medida && (
            <div className="text-xs text-gray-500 truncate">Medida: {row.original.medida}</div>
          )}
          {(!row.original.motor && !row.original.medida) && (
            <div className="text-xs text-gray-400">N/A</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "cantidad",
      header: "Cantidad",
      size: 90,
      minSize: 80,
      cell: ({ row }) => (
        <div className="text-left">
          <div className="text-sm font-medium">{row.original.cantidad.toFixed(0)}</div>
          {row.original.unidad && (
            <div className="text-[10px] text-gray-500">{row.original.unidad}</div>
          )}
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      accessorKey: "costo",
      header: "Costo U.",
      size: 80,
      minSize: 70,
      cell: ({ getValue }) => (
        <div className="text-left font-medium">
          {formatCurrency(getValue<number>())}
        </div>
      ),
      sortingFn: "alphanumeric",
    },
    {
      accessorKey: "subtotal",
      header: "Subtotal",
      size: 80,
      minSize: 70,
      cell: ({ getValue, row }) => (
        <div className="text-center font-semibold text-emerald-600">
          {formatCurrency(getValue<number>())}
          {row.original.moneda && (
            <span className="ml-1 text-[10px] text-gray-500">{row.original.moneda}</span>
          )}
        </div>
      ),
      sortingFn: "alphanumeric",
    },
  ], []);

  // Tabla
  const [sorting, setSorting] = useState<SortingState>([]);
  const tableRef = useRef<HTMLTableElement | null>(null);

  const table = useReactTable<ProductRow>({
    data: filteredRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
  });

  // Estados de carga/error
  if (isLoading) {
    return (
      <TabsContent value="products" className="space-y-4">
        <div className="animate-pulse space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      </TabsContent>
    );
  }

  if (isError || !purchase) {
    return (
      <TabsContent value="products" className="space-y-4">
        <div className="text-center text-gray-500 py-8">
          Error al cargar los productos de la compra
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="products" className="">
      {/* Encabezado compacto con buscador */}
      <div className="bg-white border-t border-l border-r border-gray-200 rounded-t-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-gray-900">Productos de la compra</h2>
          <p className="text-xs text-gray-600 mt-1">
            {purchase.cantidad_detalles} {purchase.cantidad_detalles === 1 ? "producto" : "productos"} en total
          </p>
        </div>
        <div className="w-full sm:w-120">
          <Input
            placeholder="Buscar producto (descr, código, marca, categoría...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-b-lg overflow-hidden">
        <CustomizableTable<ProductRow>
          table={table}
          isLoading={false}
          isError={false}
          rows={10}
          noDataMessage="No se encontraron productos"
          tableRef={tableRef}
          keyboardNavigationEnabled={true}
          renderBottomRow={() => {
            const colSpan = table.getVisibleFlatColumns().length;
            return (
              <TableRow className="bg-gray-50">
                <TableCell colSpan={colSpan} className="p-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-gray-500">
                      Total de ítems: <span className="font-medium text-gray-900">{totalItems}</span>
                    </div>
                    <div className="text-gray-500">
                      Total: <span className="text-sm font-bold text-emerald-600">{formatCurrency(totalImporte)}</span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          }}
        />
      </div>
    </TabsContent>
  );
};

export default PurchaseProducts;
