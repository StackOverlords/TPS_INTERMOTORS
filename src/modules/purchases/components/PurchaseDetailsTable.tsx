import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import DialogSearchDetails from './DialogSearchDetails';

interface PurchaseDetail {
  id?: number; // ID del detalle (para edición)
  id_producto?: string; // Para compatibilidad con creación
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
  // Campos calculados localmente
  subtotal?: number;
  // Campos de compatibilidad
  inc_p_venta?: number;
  inc_p_venta_alt?: number;
}

interface Props {
  detalles: PurchaseDetail[];
  setDetalles: (d: PurchaseDetail[]) => void;
}

const PurchaseDetailsTable: React.FC<Props> = ({ detalles, setDetalles }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<{ row: number; col: number } | null>(
    null
  );
  const roundToTwo = (num: number): number =>
    Math.round((num + Number.EPSILON) * 100) / 100;
  // Tipo con campos numéricos garantizados para edición/render
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

  // Función para normalizar los datos del servidor
  const normalizeDetail = (
    detail: PurchaseDetail
  ): NormalizedPurchaseDetail => {
    return {
      ...detail,
      id_detalle_compra: detail.id || 0, // Asegurar que siempre haya un ID
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
      subtotal: 0, // Se calculará después
    };
  };

  // Normalizar detalles al recibirlos
  const normalizedDetalles: NormalizedPurchaseDetail[] = detalles.map(
    detail => {
      const normalized = normalizeDetail(detail);
      normalized.subtotal = roundToTwo(normalized.cantidad * normalized.costo);
      return normalized;
    }
  );

  // console.log('Detalles originales:', detalles);
  // console.log('Detalles normalizados:', normalizedDetalles);
  const [tempValue, setTempValue] = useState('');
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const focusCell = (row: number | null, col: number | null) => {
    if (row === null || col === null) return;
    const el = tableRef.current?.querySelector(
      `[data-row="${row}"][data-col="${col}"]`
    ) as HTMLElement | null;
    if (el) el.focus();
  };

  const moveSelection = (deltaRow: number, deltaCol: number) => {
    if (normalizedDetalles.length === 0) return;
    const curRow = selectedRow ?? 0;
    const curCol = selectedCol ?? 0;
    let nextRow = clamp(curRow + deltaRow, 0, normalizedDetalles.length - 1);
    let nextCol = clamp(curCol + deltaCol, 0, totalEditableCols - 1);
    setSelectedRow(nextRow);
    setSelectedCol(nextCol);
    // focus asynchronously after state updates
    setTimeout(() => focusCell(nextRow, nextCol), 10);
  };

  const moveToNextCell = (forward = true) => {
    if (normalizedDetalles.length === 0) return;
    const curRow = selectedRow ?? 0;
    const curCol = selectedCol ?? 0;
    let nextCol = curCol + (forward ? 1 : -1);
    let nextRow = curRow;
    if (nextCol >= totalEditableCols) {
      nextCol = 0;
      nextRow = clamp(curRow + 1, 0, normalizedDetalles.length - 1);
    } else if (nextCol < 0) {
      nextCol = totalEditableCols - 1;
      nextRow = clamp(curRow - 1, 0, normalizedDetalles.length - 1);
    }
    setSelectedRow(nextRow);
    setSelectedCol(nextCol);
    setTimeout(() => focusCell(nextRow, nextCol), 10);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    if (editing) return; // si se está editando, dejar que el input maneje teclas
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        moveSelection(0, 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveSelection(0, -1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveSelection(1, 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveSelection(-1, 0);
        break;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        startEdit(rowIndex, colIndex);
        break;
      case 'Tab':
        e.preventDefault();
        moveToNextCell(!e.shiftKey);
        break;
      default:
        break;
    }
  };

  // Utilidades para manejo de moneda en centavos
  // const toCents = (amount: number): number => Math.round(amount * 100);
  // const fromCents = (cents: number): number => cents / 100;

  // Función para cálculos financieros precisos
  // Función para cálculos financieros precisos - CORREGIDA
  type EditableNumericKey = keyof Pick<
    NormalizedPurchaseDetail,
    | 'cantidad'
    | 'costo'
    | 'inc_p_venta'
    | 'precio_venta'
    | 'inc_p_venta_alt'
    | 'precio_venta_alt'
  >;

  const calculatePrecise = (
    detail: NormalizedPurchaseDetail,
    fieldName: EditableNumericKey,
    newValue: number
  ) => {
    const updatedDetail: NormalizedPurchaseDetail = { ...detail };
    // Coerce optional and/or string numeric fields to safe numbers
    const toNum = (v: unknown): number =>
      typeof v === 'number' ? v : parseFloat(String(v ?? 0)) || 0;
    const inc = toNum(updatedDetail.inc_p_venta);
    const incAlt = toNum(updatedDetail.inc_p_venta_alt);

    if (fieldName === 'costo') {
      updatedDetail.costo = roundToTwo(newValue);
      // Precio de venta basado en costo
      updatedDetail.precio_venta = roundToTwo(newValue * (1 + inc / 100));
      // Precio alternativo basado en el nuevo precio de venta
      updatedDetail.precio_venta_alt = roundToTwo(
        toNum(updatedDetail.precio_venta) * (1 + incAlt / 100)
      );
    } else if (fieldName === 'inc_p_venta') {
      updatedDetail.inc_p_venta = roundToTwo(newValue);
      // Recalcular precio de venta basado en costo
      updatedDetail.precio_venta = roundToTwo(
        toNum(updatedDetail.costo) * (1 + newValue / 100)
      );
      // Recalcular precio alternativo basado en el nuevo precio de venta
      updatedDetail.precio_venta_alt = roundToTwo(
        toNum(updatedDetail.precio_venta) *
          (1 + toNum(updatedDetail.inc_p_venta_alt) / 100)
      );
    } else if (fieldName === 'inc_p_venta_alt') {
      updatedDetail.inc_p_venta_alt = roundToTwo(newValue);
      // Precio alternativo basado en precio de venta (no en costo)
      updatedDetail.precio_venta_alt = roundToTwo(
        toNum(updatedDetail.precio_venta) * (1 + newValue / 100)
      );
    } else if (fieldName === 'precio_venta') {
      updatedDetail.precio_venta = roundToTwo(newValue);
      // Recalcular porcentaje de incremento sobre costo
      const costoNow = toNum(updatedDetail.costo);
      updatedDetail.inc_p_venta =
        costoNow > 0 ? roundToTwo(((newValue - costoNow) / costoNow) * 100) : 0;
      // Recalcular precio alternativo basado en el nuevo precio de venta
      updatedDetail.precio_venta_alt = roundToTwo(
        newValue * (1 + toNum(updatedDetail.inc_p_venta_alt) / 100)
      );
    } else if (fieldName === 'precio_venta_alt') {
      updatedDetail.precio_venta_alt = roundToTwo(newValue);
      // Recalcular porcentaje alternativo basado en precio de venta (no en costo)
      const pv = toNum(updatedDetail.precio_venta);
      updatedDetail.inc_p_venta_alt =
        pv > 0 ? roundToTwo(((newValue - pv) / pv) * 100) : 0;
    } else if (fieldName === 'cantidad') {
      updatedDetail.cantidad = Math.round(newValue); // Cantidad siempre entero
    }

    // Subtotal siempre redondeado
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

  const totalEditableCols = editableColumns.length; // cantidad de columnas editables

  // Hotkeys para navegación y acciones globales - shortcuts simplificados
  useHotkeys(
    'ctrl+m',
    e => {
      e.preventDefault();
      e.stopPropagation();
      setIsSearchOpen(true);
    },
    {
      enableOnFormTags: true,
      preventDefault: true,
      enableOnContentEditable: true,
    }
  );

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

  // Navegación con flechas cuando hay una fila seleccionada
  useHotkeys(
    'arrowup',
    e => {
      if (!editing && selectedRow !== null && selectedRow > 0) {
        e.preventDefault();
        setSelectedRow(selectedRow - 1);
      }
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    'arrowdown',
    e => {
      if (
        !editing &&
        selectedRow !== null &&
        selectedRow < normalizedDetalles.length - 1
      ) {
        e.preventDefault();
        setSelectedRow(selectedRow + 1);
      }
    },
    { enableOnFormTags: true }
  );

  // Eliminar fila seleccionada
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

  // Editar primera celda de la fila seleccionada - simplificado
  useHotkeys(
    'ctrl+enter',
    e => {
      if (!editing && selectedRow !== null) {
        e.preventDefault();
        startEdit(selectedRow, 0); // Siempre empezar en la primera celda (cantidad)
      }
    },
    { enableOnFormTags: true }
  );

  // Duplicar fila seleccionada
  useHotkeys(
    'ctrl+d',
    e => {
      if (!editing && selectedRow !== null) {
        e.preventDefault();
        duplicateRow(selectedRow);
      }
    },
    { enableOnFormTags: true }
  );

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const startEdit = (rowIndex: number, colIndex: number) => {
    const detail = normalizedDetalles[rowIndex];
    const fieldName = editableColumns[colIndex];
    const currentValue = detail[fieldName as keyof PurchaseDetail] as number;

    // Formatear el valor inicial según el tipo de campo
    let formattedValue: string;
    if (fieldName === 'cantidad') {
      formattedValue = Math.round(currentValue).toString();
    } else if (fieldName.includes('inc_p_venta')) {
      // Porcentajes con 1 decimal
      formattedValue = roundToTwo(currentValue).toFixed(1);
    } else {
      // Moneda con 2 decimales
      formattedValue = roundToTwo(currentValue).toFixed(2);
    }

    setEditing({ row: rowIndex, col: colIndex });
    setTempValue(formattedValue);
    setSelectedRow(null); // Desseleccionar fila al entrar en modo edición
  };

  const saveEdit = () => {
    if (!editing) return;

    const numValue = parseFloat(tempValue);
    if (isNaN(numValue) || numValue < 0) {
      setEditing(null);
      return;
    }

    const fieldName = editableColumns[editing.col];
    const newDetalles = [...normalizedDetalles];
    const detail = { ...newDetalles[editing.row] };

    // Usar función de cálculo preciso
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
        // Mover a la siguiente fila
        if (editing && editing.row < normalizedDetalles.length - 1) {
          setTimeout(() => startEdit(editing.row + 1, editing.col), 10);
        }
        break;
      case 'Escape':
        e.preventDefault();
        cancelEdit();
        break;
      case 'Tab':
        e.preventDefault();
        saveEdit();
        // Mover a la siguiente celda
        if (editing) {
          setTimeout(() => {
            let nextCol = editing.col + 1;
            let nextRow = editing.row;

            if (nextCol >= editableColumns.length) {
              nextCol = 0;
              nextRow++;
            }

            if (nextRow < normalizedDetalles.length) {
              startEdit(nextRow, nextCol);
            }
          }, 10);
        }
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempValue(e.target.value);
  };

  const remove = (id: string) => {
    const updatedDetalles = normalizedDetalles.filter(
      d => d.id_producto !== id
    );
    setDetalles(updatedDetalles);
  };

  const duplicateRow = (rowIndex: number) => {
    const detail = normalizedDetalles[rowIndex];
    const newDetail = {
      ...detail,
      id_producto: `${detail.id_producto}_copy_${Date.now()}`, // Generar nuevo ID único
    };

    const newDetalles = [...normalizedDetalles];
    newDetalles.splice(rowIndex + 1, 0, newDetail);
    setDetalles(newDetalles);
    setSelectedRow(rowIndex + 1);
  };

  const handleRowClick = (rowIndex: number) => {
    if (!editing) {
      setSelectedRow(selectedRow === rowIndex ? null : rowIndex);
    }
  };

  const handleProductAdded = (productId: string) => {
    // Encontrar el índice del producto recién agregado
    const newProductIndex = normalizedDetalles.findIndex(
      d => d.id_producto === productId
    );
    if (newProductIndex !== -1) {
      setSelectedRow(newProductIndex);
    }
  };

  const formatValue = (
    value: number,
    format: 'currency' | 'percentage' | 'number'
  ) => {
    // Asegurar que siempre mostramos valores redondeados
    const roundedValue = roundToTwo(value);

    switch (format) {
      case 'currency':
        return `${roundedValue.toFixed(2)}`;
      case 'percentage':
        return `${roundedValue.toFixed(1)}%`;
      default:
        // Para cantidad, mostrar como entero si es un número entero
        return Number.isInteger(roundedValue)
          ? roundedValue.toString()
          : roundedValue.toFixed(2);
    }
  };

  const EditableCell: React.FC<{
    rowIndex: number;
    colIndex: number;
    value: number;
    format?: 'currency' | 'percentage' | 'number';
  }> = ({ rowIndex, colIndex, value, format = 'number' }) => {
    const isActive = editing?.row === rowIndex && editing?.col === colIndex;

    if (isActive) {
      return (
        <Input
          ref={inputRef}
          value={tempValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={saveEdit}
          className="w-full h-6 text-xs text-center border border-gray-400 p-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
          autoFocus
        />
      );
    }

    return (
      <div
        className={`w-full h-6 flex items-center rounded-lg justify-center cursor-pointer hover:bg-white border border-gray-100 transition-colors duration-150 text-xs text-gray-700 ${
          selectedRow === rowIndex && selectedCol === colIndex ? 'ring-2 ring-blue-300 bg-blue-50' : ''
        }`}
        onClick={() => startEdit(rowIndex, colIndex)}
        tabIndex={0}
        data-row={rowIndex}
        data-col={colIndex}
        onFocus={() => {
          setSelectedRow(rowIndex);
          setSelectedCol(colIndex);
        }}
        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
        role="gridcell"
        aria-selected={selectedRow === rowIndex && selectedCol === colIndex}
      >
        {formatValue(value, format)}
      </div>
    );
  };

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
    <div
      className="p-4 bg-white border border-gray-200 rounded-lg"
      ref={tableRef}
    >
      <DialogSearchDetails
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        details={normalizedDetalles}
        setDetails={setDetalles}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        onProductAdded={handleProductAdded}
      />

      {/* Header con indicadores de shortcuts */}
      <div className="p-2 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">
            Detalle de Compra
          </span>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 hidden sm:block">
              Ctrl+M: Agregar | ↑↓: Navegar | Ctrl+Enter: Editar | Del: Eliminar
            </div>
            <Button
              onClick={() => setIsSearchOpen(true)}
              variant="outline"
              size="sm"
              className="bg-black text-white"
            >
              <Plus className="w-4 h-4 mr-2 text-white" />
              Agregar Producto{' '}
              <span className="text-xs text-white ml-1 opacity-60">
                (Ctrl+M)
              </span>
            </Button>
          </div>
        </div>
      </div>

      {detalles.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-60 border border-gray-200">
                  Producto
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-16 border border-gray-200">
                  Cantidad
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20 border border-gray-200">
                  Costo
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-16 border border-gray-200">
                  % Inc
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20 border border-gray-200">
                  P. Venta
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-16 border border-gray-200">
                  % Alt
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20 border border-gray-200">
                  P. Venta. Alt
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20 border border-gray-200">
                  Subtotal
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12 border border-gray-200">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {normalizedDetalles.map((detail, rowIndex) => (
                <tr
                  key={detail.id_producto}
                  className={`
                    transition-colors duration-150 cursor-pointer
                    ${
                      selectedRow === rowIndex
                        ? 'bg-blue-100 border-blue-200'
                        : 'hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handleRowClick(rowIndex)}
                >
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900 leading-tight text-sm">
                        {detail.producto.descripcion}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        OEM: {detail.producto.codigo_oem}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <EditableCell
                      rowIndex={rowIndex}
                      colIndex={0}
                      value={detail.cantidad}
                      format="number"
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <EditableCell
                      rowIndex={rowIndex}
                      colIndex={1}
                      value={detail.costo}
                      format="currency"
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <EditableCell
                      rowIndex={rowIndex}
                      colIndex={2}
                      value={detail.inc_p_venta}
                      format="percentage"
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <EditableCell
                      rowIndex={rowIndex}
                      colIndex={3}
                      value={detail.precio_venta}
                      format="currency"
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <EditableCell
                      rowIndex={rowIndex}
                      colIndex={4}
                      value={detail.inc_p_venta_alt}
                      format="percentage"
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <EditableCell
                      rowIndex={rowIndex}
                      colIndex={5}
                      value={detail.precio_venta_alt}
                      format="currency"
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {/* ${detail.subtotal.toFixed(2)} */}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={e => {
                        e.stopPropagation();
                        remove(detail.id_producto!);
                      }}
                      className="size-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr className="font-semibold text-gray-800">
                <td
                  colSpan={2}
                  className="px-4 py-4 text-right font-bold text-sm"
                >
                  TOTALES:
                </td>
                <td className="px-3 py-4 text-center">
                  <div className="text-sm font-medium text-gray-900">
                    ${totalCosto.toFixed(2)}
                  </div>
                </td>
                <td className="px-3 py-4"></td>
                <td className="px-3 py-4 text-center">
                  <div className="text-sm font-medium text-green-600">
                    ${totalGeneral.toFixed(2)}
                  </div>
                </td>
                <td className="px-3 py-4"></td>
                <td className="px-3 py-4 text-center">
                  <div className="text-sm font-medium text-blue-600">
                    ${totalMenor.toFixed(2)}
                  </div>
                </td>
                <td className="px-3 py-4 text-center">
                  <div className="text-sm font-medium text-gray-900">
                    ${totalCosto.toFixed(2)}
                  </div>
                </td>
                <td className="px-3 py-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-600">
            No hay productos en el detalle.
          </p>
          <Button
            onClick={() => setIsSearchOpen(true)}
            variant="outline"
            size="sm"
            className="mt-4 hover:bg-gray-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Producto{' '}
            <span className="text-xs ml-1 opacity-60">(Ctrl+M)</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default PurchaseDetailsTable;
