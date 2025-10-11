import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import CustomizableTable from '@/components/common/CustomizableTable';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Edit3, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

interface PurchaseDetail {
  id?: number;
  id_producto?: string;
  producto: {
    id: number;
    codigo_interno: number;
    descripcion: string;
    descripcion_alt: string;
    codigo_oem: string;
    codigo_upc: string;
    modelo: string | null;
    medida: string;
    nro_motor: string;
    id_categoria: number;
    categoria?: {
      id: number;
      categoria: string;
      id_estado: string;
      codigo_interno: number;
      version?: number;
    } | null;
    id_subcategora: number;
    subcategoria: {
      id: number;
      subcategoria: string;
      id_categoria: number;
      id_estado: string;
      codigo_interno: number;
    };
    id_marca: number;
    marca: {
      id: number;
      marca: string;
      id_estado: string;
      codigo_interno: number;
    };
    id_procedencia: number;
    procedencia: {
      id: number;
      procedencia: string;
      id_estado: string;
      codigo_interno: number;
    };
    id_unidad_medida: number;
    unidad_medida: {
      id: number;
      unidad_medida: string;
      id_estado: string;
      codigo_interno: number;
    };
    costo_referencia: string;
    stock_minimo: string;
    precio_venta: string;
    precio_venta_alt: string;
    id_marca_vehiculo: number;
    marca_vehiculo: {
      id: number;
      marca_vehiculo: string;
      codigo_interno: number;
      id_estado: string;
    };
  };
  cantidad: string | number;
  costo: string | number;
  inc_precio_venta: string | number;
  precio_venta: string | number;
  inc_precio_venta_alt: string | number;
  precio_venta_alt: string | number;
  moneda: string;
  fecha_mod_precio: string;
  subtotal?: number;
  inc_p_venta?: number;
  inc_p_venta_alt?: number;
}

interface Props {
  detalles: PurchaseDetail[];
  setDetalles: (d: PurchaseDetail[]) => void;
}

type NormalizedPurchaseDetail = PurchaseDetail & {
  id_detalle_compra: number;
  cantidad: number;
  costo: number;
  inc_p_venta: number;
  precio_venta: number;
  inc_p_venta_alt: number;
  precio_venta_alt: number;
  subtotal: number;
};

type EditableNumericKey = keyof Pick<
  NormalizedPurchaseDetail,
  | 'cantidad'
  | 'costo'
  | 'inc_p_venta'
  | 'precio_venta'
  | 'inc_p_venta_alt'
  | 'precio_venta_alt'
>;

const PurchaseDetailsTable: React.FC<Props> = ({ detalles, setDetalles }) => {
  const [editing, setEditing] = useState<{ row: number; col: string } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const roundToTwo = (num: number): number =>
    Math.round((num + Number.EPSILON) * 100) / 100;

  const normalizeDetail = (detail: PurchaseDetail): NormalizedPurchaseDetail => {
    return {
      ...detail,
      id_detalle_compra: detail.id || 0,
      id_producto: detail.id_producto || detail.producto.id.toString(),
      cantidad:
        typeof detail.cantidad === 'string'
          ? parseFloat(detail.cantidad)
          : detail.cantidad,
      costo:
        typeof detail.costo === 'string'
          ? parseFloat(detail.costo)
          : detail.costo,
      inc_p_venta: (detail.inc_p_venta ??
        (typeof detail.inc_precio_venta === 'string'
          ? parseFloat(detail.inc_precio_venta)
          : detail.inc_precio_venta)) as number,
      precio_venta:
        typeof detail.precio_venta === 'string'
          ? parseFloat(detail.precio_venta)
          : (detail.precio_venta as number),
      inc_p_venta_alt: (detail.inc_p_venta_alt ??
        (typeof detail.inc_precio_venta_alt === 'string'
          ? parseFloat(detail.inc_precio_venta_alt)
          : detail.inc_precio_venta_alt)) as number,
      precio_venta_alt:
        typeof detail.precio_venta_alt === 'string'
          ? parseFloat(detail.precio_venta_alt)
          : (detail.precio_venta_alt as number),
      subtotal: 0,
    };
  };

  const normalizedDetalles: NormalizedPurchaseDetail[] = useMemo(
    () =>
      detalles.map(detail => {
        const normalized = normalizeDetail(detail);
        normalized.subtotal = roundToTwo(normalized.cantidad * normalized.costo);
        return normalized;
      }),
    [detalles]
  );

  const calculatePrecise = (
    detail: NormalizedPurchaseDetail,
    fieldName: EditableNumericKey,
    newValue: number
  ) => {
    const updatedDetail: NormalizedPurchaseDetail = { ...detail };
    const toNum = (v: unknown): number =>
      typeof v === 'number' ? v : parseFloat(String(v ?? 0)) || 0;
    const inc = toNum(updatedDetail.inc_p_venta);
    const incAlt = toNum(updatedDetail.inc_p_venta_alt);

    if (fieldName === 'costo') {
      updatedDetail.costo = roundToTwo(newValue);
      updatedDetail.precio_venta = roundToTwo(newValue * (1 + inc / 100));
      updatedDetail.precio_venta_alt = roundToTwo(
        toNum(updatedDetail.precio_venta) * (1 + incAlt / 100)
      );
    } else if (fieldName === 'inc_p_venta') {
      updatedDetail.inc_p_venta = roundToTwo(newValue);
      updatedDetail.precio_venta = roundToTwo(
        toNum(updatedDetail.costo) * (1 + newValue / 100)
      );
      updatedDetail.precio_venta_alt = roundToTwo(
        toNum(updatedDetail.precio_venta) *
          (1 + toNum(updatedDetail.inc_p_venta_alt) / 100)
      );
    } else if (fieldName === 'inc_p_venta_alt') {
      updatedDetail.inc_p_venta_alt = roundToTwo(newValue);
      updatedDetail.precio_venta_alt = roundToTwo(
        toNum(updatedDetail.precio_venta) * (1 + newValue / 100)
      );
    } else if (fieldName === 'precio_venta') {
      updatedDetail.precio_venta = roundToTwo(newValue);
      const costoNow = toNum(updatedDetail.costo);
      updatedDetail.inc_p_venta =
        costoNow > 0 ? roundToTwo(((newValue - costoNow) / costoNow) * 100) : 0;
      updatedDetail.precio_venta_alt = roundToTwo(
        newValue * (1 + toNum(updatedDetail.inc_p_venta_alt) / 100)
      );
    } else if (fieldName === 'precio_venta_alt') {
      updatedDetail.precio_venta_alt = roundToTwo(newValue);
      const pv = toNum(updatedDetail.precio_venta);
      updatedDetail.inc_p_venta_alt =
        pv > 0 ? roundToTwo(((newValue - pv) / pv) * 100) : 0;
    } else if (fieldName === 'cantidad') {
      updatedDetail.cantidad = Math.round(newValue);
    }

    updatedDetail.subtotal = roundToTwo(
      toNum(updatedDetail.costo) * Math.round(toNum(updatedDetail.cantidad))
    );

    return updatedDetail;
  };

  const editableColumns: EditableNumericKey[] = [
    'cantidad',
    'costo',
    'inc_p_venta',
    'precio_venta',
    'inc_p_venta_alt',
    'precio_venta_alt',
  ];

  const startEdit = (rowIndex: number, fieldName: EditableNumericKey) => {
    // Si ya estamos editando, guardar primero
    if (editing && (editing.row !== rowIndex || editing.col !== fieldName)) {
      saveEdit();
    }

    const detail = normalizedDetalles[rowIndex];
    if (!detail) return;

    const currentValue = detail[fieldName] as number;

    let formattedValue: string;
    if (fieldName === 'cantidad') {
      formattedValue = Math.round(currentValue).toString();
    } else if (fieldName.includes('inc_p_venta')) {
      formattedValue = roundToTwo(currentValue).toFixed(1);
    } else {
      formattedValue = roundToTwo(currentValue).toFixed(2);
    }

    setEditing({ row: rowIndex, col: fieldName });
    setTempValue(formattedValue);
    setSelectedRow(null);
  };

  const saveEdit = () => {
    if (!editing) return;

    const numValue = parseFloat(tempValue);
    if (isNaN(numValue) || numValue < 0) {
      setEditing(null);
      return;
    }

    const fieldName = editing.col as EditableNumericKey;
    const newDetalles = [...normalizedDetalles];
    const detail = { ...newDetalles[editing.row] };

    const updatedDetail = calculatePrecise(detail, fieldName, numValue);

    newDetalles[editing.row] = updatedDetail;
    setDetalles(newDetalles);
    setSelectedRow(editing.row);
    setEditing(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setTempValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        saveEdit();
        // Mover a la siguiente fila en la misma columna
        if (editing && editing.row < normalizedDetalles.length - 1) {
          setTimeout(() => {
            startEdit(editing.row + 1, editing.col as EditableNumericKey);
          }, 0);
        }
        break;
      case 'Escape':
        e.preventDefault();
        cancelEdit();
        break;
      case 'Tab':
        e.preventDefault();
        saveEdit();

        if (!editing) return;

        // Navegar a la siguiente celda
        const currentColIndex = editableColumns.indexOf(editing.col as EditableNumericKey);
        const isShiftTab = e.shiftKey;

        let nextRow = editing.row;
        let nextColIndex = currentColIndex;

        if (isShiftTab) {
          // Navegar hacia atrás
          nextColIndex--;
          if (nextColIndex < 0) {
            nextColIndex = editableColumns.length - 1;
            nextRow--;
          }
        } else {
          // Navegar hacia adelante
          nextColIndex++;
          if (nextColIndex >= editableColumns.length) {
            nextColIndex = 0;
            nextRow++;
          }
        }

        // Verificar límites de filas
        if (nextRow >= 0 && nextRow < normalizedDetalles.length) {
          setTimeout(() => {
            startEdit(nextRow, editableColumns[nextColIndex]);
          }, 0);
        }
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempValue(e.target.value);
  };

  const remove = (id: string) => {
    const updatedDetalles = normalizedDetalles.filter(d => d.id_producto !== id);
    setDetalles(updatedDetalles);
  };

  useHotkeys(
    'escape',
    () => {
      if (editing) {
        cancelEdit();
      } else if (selectedRow !== null) {
        setSelectedRow(null);
      }
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    'delete, backspace',
    e => {
      if (!editing && selectedRow !== null) {
        e.preventDefault();
        const detail = normalizedDetalles[selectedRow];
        remove(detail.id_producto!);
        setSelectedRow(null);
      }
    },
    { enableOnFormTags: true }
  );

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const formatValue = (
    value: number,
    format: 'currency' | 'percentage' | 'number'
  ) => {
    const roundedValue = roundToTwo(value);

    switch (format) {
      case 'currency':
        return `${roundedValue.toFixed(2)}`;
      case 'percentage':
        return `${roundedValue.toFixed(1)}%`;
      default:
        return Number.isInteger(roundedValue)
          ? roundedValue.toString()
          : roundedValue.toFixed(2);
    }
  };

  const handleCellBlur = () => {
    // Guardar después de un pequeño delay para permitir que el click en otra celda se procese primero
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveEdit();
    }, 150);
  };

  const EditableCell: React.FC<{
    rowIndex: number;
    fieldName: EditableNumericKey;
    value: number;
    format?: 'currency' | 'percentage' | 'number';
  }> = ({ rowIndex, fieldName, value, format = 'number' }) => {
    const isActive = editing?.row === rowIndex && editing?.col === fieldName;

    const handleClick = () => {
      // Cancelar el timeout de blur si existe
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      startEdit(rowIndex, fieldName);
    };

    if (isActive) {
      return (
        <Input
          ref={inputRef}
          value={tempValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleCellBlur}
          className="w-full h-8 text-sm text-center"
          autoFocus
        />
      );
    }

    return (
      <div
        className="w-full h-8 flex items-center justify-between px-3 cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg group"
        onClick={handleClick}
      >
        <span className="text-sm flex-1 text-center">{formatValue(value, format)}</span>
        <Edit3 className="text-gray-300 group-hover:text-gray-500 h-3 w-3 flex-shrink-0 transition-colors ml-1" />
      </div>
    );
  };

  const columns = useMemo<ColumnDef<NormalizedPurchaseDetail>[]>(
    () => [
      {
        accessorFn: row => row.producto.descripcion,
        id: 'descripcion',
        header: 'Producto',
        size: 300,
        minSize: 250,
        enableHiding: false,
        cell: ({ getValue, row }) => (
          <div className="flex flex-col space-y-1">
            <h3 className="font-medium text-gray-700 truncate text-sm">
              {getValue<string>()}
            </h3>
            <span className="text-xs text-gray-500 font-mono">
              OEM: {row.original.producto.codigo_oem}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'cantidad',
        id: 'cantidad',
        header: 'Cantidad',
        minSize: 110,
        cell: ({ row }) => (
          <EditableCell
            rowIndex={row.index}
            fieldName="cantidad"
            value={row.original.cantidad}
            format="number"
          />
        ),
      },
      {
        accessorKey: 'costo',
        id: 'costo',
        header: 'Costo',
        minSize: 110,
        cell: ({ row }) => (
          <EditableCell
            rowIndex={row.index}
            fieldName="costo"
            value={row.original.costo}
            format="currency"
          />
        ),
      },
      {
        accessorKey: 'inc_p_venta',
        id: 'inc_p_venta',
        header: '% Inc',
        minSize: 110,
        cell: ({ row }) => (
          <EditableCell
            rowIndex={row.index}
            fieldName="inc_p_venta"
            value={row.original.inc_p_venta}
            format="percentage"
          />
        ),
      },
      {
        accessorKey: 'precio_venta',
        id: 'precio_venta',
        header: 'P. Venta',
        minSize: 110,
        cell: ({ row }) => (
          <EditableCell
            rowIndex={row.index}
            fieldName="precio_venta"
            value={row.original.precio_venta}
            format="currency"
          />
        ),
      },
      {
        accessorKey: 'inc_p_venta_alt',
        id: 'inc_p_venta_alt',
        header: '% Alt',
        minSize: 110,
        cell: ({ row }) => (
          <EditableCell
            rowIndex={row.index}
            fieldName="inc_p_venta_alt"
            value={row.original.inc_p_venta_alt}
            format="percentage"
          />
        ),
      },
      {
        accessorKey: 'precio_venta_alt',
        id: 'precio_venta_alt',
        header: 'P. Venta Alt',
        minSize: 110,
        cell: ({ row }) => (
          <EditableCell
            rowIndex={row.index}
            fieldName="precio_venta_alt"
            value={row.original.precio_venta_alt}
            format="currency"
          />
        ),
      },
      {
        accessorKey: 'subtotal',
        id: 'subtotal',
        header: 'Subtotal',
        minSize: 110,
        cell: ({ getValue }) => (
          <div className="text-sm font-medium text-gray-900 text-center">
            ${roundToTwo(getValue<number>()).toFixed(2)}
          </div>
        ),
      },
      {
        id: 'action',
        header: 'Acciones',
        size: 60,
        minSize: 40,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => remove(row.original.id_producto!)}
              className="text-red-500 hover:text-red-500 size-7"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ),
      },
    ],
    [normalizedDetalles, editing, tempValue]
  );

  const table = useReactTable<NormalizedPurchaseDetail>({
    data: normalizedDetalles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    enableRowSelection: true,
  });

  const totalCosto = roundToTwo(
    normalizedDetalles.reduce((s, d) => s + d.cantidad * d.costo, 0)
  );

  const totalGeneral = roundToTwo(
    normalizedDetalles.reduce((s, d) => s + d.precio_venta * d.cantidad, 0)
  );

  const totalMenor = roundToTwo(
    normalizedDetalles.reduce((s, d) => s + d.precio_venta_alt * d.cantidad, 0)
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-2 border-b border-gray-200 flex-shrink-0 bg-white">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">
            Detalle de Compra
          </span>
          <div className="text-xs text-gray-500 hidden sm:block">
            Click para editar | Esc: Cancelar | Del: Eliminar
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-hidden">
        <CustomizableTable table={table} isLoading={false} />
      </div>

      {/* Footer con totales */}
      {normalizedDetalles.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex-shrink-0">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">Total Costo:</span>
              <span className="font-medium">${totalCosto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Total P. Venta:</span>
              <span className="font-medium text-green-600">
                ${totalGeneral.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Total P. Alt:</span>
              <span className="font-medium text-blue-600">
                ${totalMenor.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Subtotal:</span>
              <span className="font-medium">${totalCosto.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseDetailsTable;
