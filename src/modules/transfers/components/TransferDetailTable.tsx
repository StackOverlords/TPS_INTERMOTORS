import { Button } from "@/components/atoms/button";
import CustomizableTable from "@/components/common/CustomizableTable";
import { formatCurrency } from "@/utils/formaters";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { UITransferDetailCreate } from "../types/transferCreate.types";
import { EditableQuantity } from "@/modules/shoppingCart/components/editableQuantity";
import { EditablePrice } from "@/modules/shoppingCart/components/editablePrice";

interface TransferDetailTableProps {
  details: UITransferDetailCreate[];
  onUpdateCantidad: (
    producto_id: number,
    purchase_id: number | undefined,
    cantidad: number
  ) => void;
  onUpdateCostoEntrada?: (
    producto_id: number,
    purchase_id: number | undefined,
    costo: number
  ) => void;
  onUpdatePrecioSalida?: (
    producto_id: number,
    purchase_id: number | undefined,
    precio: number
  ) => void;
  onUpdatePrecioEntradaVenta?: (
    producto_id: number,
    purchase_id: number | undefined,
    precio: number
  ) => void;
  onUpdatePrecioEntradaVentaAlt?: (
    producto_id: number,
    purchase_id: number | undefined,
    precio: number
  ) => void;
  onUpdateIncrementoPrecioEntradaVenta?: (
    producto_id: number,
    purchase_id: number | undefined,
    incremento: number
  ) => void;
  onUpdateIncrementoPrecioEntradaVentaAlt?: (
    producto_id: number,
    purchase_id: number | undefined,
    incremento: number
  ) => void;
  onUpdateTcTransfer?: (producto_id: number, tc_transfer: number) => void;
  onRemoveProduct: (producto_id: number, purchase_id?: number) => void;
  isLoading?: boolean;
}

export interface TransferDetailTableRef {
  focusFirstQuantityInput: () => void;
}

type EditableNumericKey =
  | "cantidad_entrada_salida"
  | "costo_entrada"
  | "precio_salida"
  | "precio_entrada_venta"
  | "precio_entrada_venta_alt"
  | "incremento_p_entrada_venta"
  | "incremento_p_entrada_venta_alt"
  | "tc_transfer";

function TransferDetailTableInner(
  {
    details,
    onUpdateCantidad,
    onUpdateCostoEntrada,
    onUpdatePrecioSalida,
    onUpdatePrecioEntradaVenta,
    onUpdatePrecioEntradaVentaAlt,
    onUpdateIncrementoPrecioEntradaVenta,
    onUpdateIncrementoPrecioEntradaVentaAlt,
    onUpdateTcTransfer,
    onRemoveProduct,
    isLoading = false,
  }: TransferDetailTableProps,
  ref: React.Ref<TransferDetailTableRef>
) {
  const [editing, setEditing] = useState<{ row: number; col: string } | null>(
    null
  );
  const [tempValue, setTempValue] = useState("");
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSelectedRef = useRef<boolean>(false);

  // Stable ref to always access latest details inside useCallback handlers
  // without adding details to the useMemo deps (which would re-mount inputs).
  const detailsRef = useRef(details);
  useEffect(() => {
    detailsRef.current = details;
  }, [details]);

  // Exponer método focusFirstQuantityInput
  useImperativeHandle(ref, () => ({
    focusFirstQuantityInput: () => {
      if (details.length > 0) {
        setTimeout(() => {
          const inputs = Array.from(
            document.querySelectorAll<HTMLInputElement>(
              'input[data-column="cantidad_entrada_salida"]'
            )
          ).filter((el) => el.offsetParent !== null);
          const lastInput = inputs[inputs.length - 1];
          if (lastInput) {
            lastInput.focus();
            lastInput.select();
          }
        }, 0);
      }
    },
  }));

  const roundToTwo = (num: number): number =>
    Math.round((num + Number.EPSILON) * 100) / 100;

  // const editableColumns: EditableNumericKey[] = [
  //   "cantidad_entrada_salida",
  //   "costo_entrada",
  //   "tc_transfer",
  //   "precio_salida",
  //   "precio_entrada_venta",
  //   "precio_entrada_venta_alt",
  //   "incremento_p_entrada_venta",
  //   "incremento_p_entrada_venta_alt",
  // ];

  const startEdit = (rowIndex: number, fieldName: EditableNumericKey) => {
    // Si ya estamos editando, guardar primero
    if (editing && (editing.row !== rowIndex || editing.col !== fieldName)) {
      saveEdit();
    }

    const detail = details[rowIndex];
    if (!detail) return;

    const currentValue = detail[fieldName] as number;

    let formattedValue: string;
    if (fieldName === "cantidad_entrada_salida") {
      formattedValue = Math.round(currentValue).toString();
    } else if (fieldName.includes("incremento_p_entrada_venta")) {
      formattedValue = roundToTwo(currentValue).toFixed(1);
    } else {
      formattedValue = roundToTwo(currentValue).toFixed(2);
    }

    // Resetear la bandera de selección
    hasSelectedRef.current = false;

    setEditing({ row: rowIndex, col: fieldName });
    setTempValue(formattedValue);
    setSelectedRow(null);
  };

  const calculatePrecise = useCallback(
    (
      detail: UITransferDetailCreate,
      fieldName: EditableNumericKey,
      newValue: number
    ): UITransferDetailCreate => {
      const updatedDetail = { ...detail };

      if (fieldName === "costo_entrada") {
        updatedDetail.costo_entrada = roundToTwo(newValue);
      } else if (fieldName === "tc_transfer") {
        updatedDetail.tc_transfer = roundToTwo(newValue);
      } else if (fieldName === "precio_salida") {
        updatedDetail.precio_salida = roundToTwo(newValue);
      } else if (fieldName === "precio_entrada_venta") {
        updatedDetail.precio_entrada_venta = roundToTwo(newValue);
      } else if (fieldName === "precio_entrada_venta_alt") {
        updatedDetail.precio_entrada_venta_alt = roundToTwo(newValue);
      } else if (fieldName === "incremento_p_entrada_venta") {
        updatedDetail.incremento_p_entrada_venta = roundToTwo(newValue);
      } else if (fieldName === "incremento_p_entrada_venta_alt") {
        updatedDetail.incremento_p_entrada_venta_alt = roundToTwo(newValue);
      } else if (fieldName === "cantidad_entrada_salida") {
        updatedDetail.cantidad_entrada_salida = Math.round(newValue);
      }

      return updatedDetail;
    },
    []
  );

  const saveEdit = () => {
    if (!editing) return;

    const numValue = parseFloat(tempValue);
    if (isNaN(numValue) || numValue < 0) {
      setEditing(null);
      return;
    }

    const fieldName = editing.col as EditableNumericKey;
    const detail = details[editing.row];

    if (!detail) {
      setEditing(null);
      return;
    }

    const updatedDetail = calculatePrecise(detail, fieldName, numValue);

    // Actualizar usando el callback correspondiente
    switch (fieldName) {
      case "cantidad_entrada_salida":
        onUpdateCantidad(
          detail.producto_id,
          detail.purchase_id,
          updatedDetail.cantidad_entrada_salida
        );
        break;
      case "costo_entrada":
        onUpdateCostoEntrada?.(
          detail.producto_id,
          detail.purchase_id,
          updatedDetail.costo_entrada
        );
        break;
      case "tc_transfer":
        onUpdateTcTransfer?.(detail.producto_id, updatedDetail.tc_transfer);
        break;
      case "precio_salida":
        onUpdatePrecioSalida?.(
          detail.producto_id,
          detail.purchase_id,
          updatedDetail.precio_salida
        );
        break;
      case "precio_entrada_venta":
        onUpdatePrecioEntradaVenta?.(
          detail.producto_id,
          detail.purchase_id,
          updatedDetail.precio_entrada_venta
        );
        break;
      case "precio_entrada_venta_alt":
        onUpdatePrecioEntradaVentaAlt?.(
          detail.producto_id,
          detail.purchase_id,
          updatedDetail.precio_entrada_venta_alt
        );
        break;
      case "incremento_p_entrada_venta":
        onUpdateIncrementoPrecioEntradaVenta?.(
          detail.producto_id,
          detail.purchase_id,
          updatedDetail.incremento_p_entrada_venta
        );
        break;
      case "incremento_p_entrada_venta_alt":
        onUpdateIncrementoPrecioEntradaVentaAlt?.(
          detail.producto_id,
          detail.purchase_id,
          updatedDetail.incremento_p_entrada_venta_alt
        );
        break;
    }

    setSelectedRow(editing.row);
    setEditing(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setTempValue("");
  };

  // const handleKeyDown = (e: React.KeyboardEvent) => {
  //   e.stopPropagation();

  //   switch (e.key) {
  //     case "Enter":
  //     case "Tab":
  //       e.preventDefault();
  //       saveEdit();

  //       if (!editing) return;

  //       // Navegar a la siguiente celda
  //       const currentColIndex = editableColumns.indexOf(
  //         editing.col as EditableNumericKey
  //       );
  //       const isShiftTab = e.shiftKey;
  //       const isShiftEnter = e.key === "Enter" && e.shiftKey;

  //       let nextRow = editing.row;
  //       let nextColIndex = currentColIndex;

  //       if (isShiftTab || isShiftEnter) {
  //         // Navegar hacia atrás
  //         nextColIndex--;
  //         if (nextColIndex < 0) {
  //           nextColIndex = editableColumns.length - 1;
  //           nextRow--;
  //         }
  //       } else {
  //         // Navegar hacia adelante
  //         nextColIndex++;
  //         if (nextColIndex >= editableColumns.length) {
  //           nextColIndex = 0;
  //           nextRow++;
  //         }
  //       }

  //       // Verificar límites de filas
  //       if (nextRow >= 0 && nextRow < details.length) {
  //         setTimeout(() => {
  //           startEdit(nextRow, editableColumns[nextColIndex]);
  //         }, 0);
  //       }
  //       break;
  //     case "Escape":
  //       e.preventDefault();
  //       cancelEdit();
  //       break;
  //   }
  // };

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const newValue = e.target.value;
  //   setTempValue(newValue);

  //   // Actualizar en tiempo real mientras se escribe
  //   const numValue = parseFloat(newValue);
  //   if (!isNaN(numValue) && numValue >= 0 && editing) {
  //     const fieldName = editing.col as EditableNumericKey;
  //     const detail = details[editing.row];

  //     if (detail) {
  //       const updatedDetail = calculatePrecise(detail, fieldName, numValue);

  //       // Actualizar usando el callback correspondiente
  //       switch (fieldName) {
  //         case "cantidad_entrada_salida":
  //           onUpdateCantidad(
  //             detail.producto_id,
  //             detail.purchase_id,
  //             updatedDetail.cantidad_entrada_salida
  //           );
  //           break;
  //         case "costo_entrada":
  //           onUpdateCostoEntrada?.(
  //             detail.producto_id,
  //             detail.purchase_id,
  //             updatedDetail.costo_entrada
  //           );
  //           break;
  //         case "tc_transfer":
  //           onUpdateTcTransfer?.(detail.producto_id, updatedDetail.tc_transfer);
  //           break;
  //         case "precio_salida":
  //           onUpdatePrecioSalida?.(
  //             detail.producto_id,
  //             detail.purchase_id,
  //             updatedDetail.precio_salida
  //           );
  //           break;
  //         case "precio_entrada_venta":
  //           onUpdatePrecioEntradaVenta?.(
  //             detail.producto_id,
  //             detail.purchase_id,
  //             updatedDetail.precio_entrada_venta
  //           );
  //           break;
  //         case "precio_entrada_venta_alt":
  //           onUpdatePrecioEntradaVentaAlt?.(
  //             detail.producto_id,
  //             detail.purchase_id,
  //             updatedDetail.precio_entrada_venta_alt
  //           );
  //           break;
  //         case "incremento_p_entrada_venta":
  //           onUpdateIncrementoPrecioEntradaVenta?.(
  //             detail.producto_id,
  //             detail.purchase_id,
  //             updatedDetail.incremento_p_entrada_venta
  //           );
  //           break;
  //         case "incremento_p_entrada_venta_alt":
  //           onUpdateIncrementoPrecioEntradaVentaAlt?.(
  //             detail.producto_id,
  //             detail.purchase_id,
  //             updatedDetail.incremento_p_entrada_venta_alt
  //           );
  //           break;
  //       }
  //     }
  //   }
  // };

  // const handleCellBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  //   // Solo guardar si el blur NO es hacia otro elemento de la tabla
  //   // Esto evita que se guarde cuando se hace click en comentarios u otros campos
  //   const relatedTarget = e.relatedTarget as HTMLElement;

  //   // Verificar si el nuevo foco está dentro de la tabla de detalles
  //   const isClickingInsideTable = relatedTarget?.closest("table") !== null;
  //   const isClickingEditableCell =
  //     relatedTarget?.classList.contains("editable-cell") ||
  //     relatedTarget?.closest(".editable-cell") !== null;

  //   // Si el click es en otra celda editable, no hacer nada (el startEdit lo manejará)
  //   if (isClickingEditableCell || isClickingInsideTable) {
  //     return;
  //   }

  //   // Solo guardar si estamos haciendo blur hacia un elemento externo
  //   if (saveTimeoutRef.current) {
  //     clearTimeout(saveTimeoutRef.current);
  //   }
  //   saveTimeoutRef.current = setTimeout(() => {
  //     saveEdit();
  //   }, 150);
  // };

  // const formatValue = (
  //   value: number,
  //   format: "currency" | "percentage" | "number"
  // ) => {
  //   const roundedValue = roundToTwo(value);

  //   switch (format) {
  //     case "currency":
  //       return `${roundedValue.toFixed(2)}`;
  //     case "percentage":
  //       return `${roundedValue.toFixed(1)}%`;
  //     default:
  //       return Number.isInteger(roundedValue)
  //         ? roundedValue.toString()
  //         : roundedValue.toFixed(2);
  //   }
  // };

  // const EditableCell: React.FC<{
  //   rowIndex: number;
  //   fieldName: EditableNumericKey;
  //   value: number;
  //   format?: "currency" | "percentage" | "number";
  // }> = ({ rowIndex, fieldName, value, format = "number" }) => {
  //   const isActive = editing?.row === rowIndex && editing?.col === fieldName;

  //   const handleClick = () => {
  //     // Cancelar el timeout de blur si existe
  //     if (saveTimeoutRef.current) {
  //       clearTimeout(saveTimeoutRef.current);
  //       saveTimeoutRef.current = null;
  //     }
  //     startEdit(rowIndex, fieldName);
  //   };

  //   if (isActive) {
  //     return (
  //       <Input
  //         ref={inputRef}
  //         value={tempValue}
  //         onChange={handleInputChange}
  //         onKeyDown={handleKeyDown}
  //         onBlur={handleCellBlur}
  //         onFocus={(e) => {
  //           if (!hasSelectedRef.current) {
  //             e.target.select();
  //             hasSelectedRef.current = true;
  //           }
  //         }}
  //         className="w-full h-8 text-sm text-center"
  //         autoFocus
  //       />
  //     );
  //   }

  //   return (
  //     <div
  //       className="editable-cell w-full h-8 flex items-center justify-between px-3 cursor-pointer hover:bg-accent/30 transition-colors border border-border rounded-lg group"
  //       onClick={handleClick}
  //     >
  //       <span className="text-sm flex-1 text-center">
  //         {formatValue(value, format)}
  //       </span>
  //       <Edit3 className="text-muted-foreground/50 group-hover:text-muted-foreground h-3 w-3 flex-shrink-0 transition-colors ml-1" />
  //     </div>
  //   );
  // };

  useHotkeys(
    "escape",
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
    "delete, backspace",
    (e) => {
      if (!editing && selectedRow !== null) {
        e.preventDefault();
        const detail = details[selectedRow];
        onRemoveProduct(detail.producto_id, detail.purchase_id);
        setSelectedRow(null);
      }
    },
    { enableOnFormTags: true }
  );

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      // Seleccionar todo el texto automáticamente
      inputRef.current.select();
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

  // ─── Stable submit handlers ────────────────────────────────────────────────
  // These use detailsRef (not details) so their identity never changes.
  // This is critical: if onSubmit callbacks were inline lambdas in useMemo,
  // they would close over `details` and force the columns to re-compute on
  // every detail change, which re-mounts the EditableQuantity/EditablePrice
  // inputs and breaks:
  //   • data-column attribute → navigateColumn() finds 0 siblings
  //   • native wheel listener (registered in useEffect inside EditableField)
  //   • inputRef inside EditableField points to the unmounted element
  const handleCantidadSubmit = useCallback(
    (rowIndex: number, value: number) => {
      const detail = detailsRef.current[rowIndex];
      if (!detail) return;
      const updated = calculatePrecise(
        detail,
        "cantidad_entrada_salida",
        value
      );
      onUpdateCantidad(
        detail.producto_id,
        detail.purchase_id,
        updated.cantidad_entrada_salida
      );
    },
    [onUpdateCantidad, calculatePrecise]
  );

  const handleTcTransferSubmit = useCallback(
    (rowIndex: number, value: number) => {
      const detail = detailsRef.current[rowIndex];
      if (!detail) return;
      const updated = calculatePrecise(detail, "tc_transfer", value);
      onUpdateTcTransfer?.(detail.producto_id, updated.tc_transfer);
    },
    [onUpdateTcTransfer, calculatePrecise]
  );

  const columns = useMemo<ColumnDef<UITransferDetailCreate>[]>(
    () => [
      {
        header: "Nro",
        size: 70,
        minSize: 60,
        cell: ({ row }) => <span className="text-xs">{row.index + 1}</span>,
      },
      {
        accessorFn: (row) => row.product.descripcion,
        id: "descripcion",
        header: "Descripción",
        size: 250,
        minSize: 200,
        enableHiding: false,
        cell: ({ getValue }) => (
          <div className="flex flex-col space-y-1">
            <h3 className="font-medium truncate text-sm">
              {getValue<string>()}
            </h3>
          </div>
        ),
      },
      {
        accessorFn: (row) => row.product.codigo_oem,
        id: "codigo_oem",
        header: "OEM",
        size: 130,
        minSize: 100,
        cell: ({ getValue }) => (
          <div className="text-sm font-mono text-center">
            {getValue<string>() || "N/A"}
          </div>
        ),
      },
      {
        accessorFn: (row) => row.product.marca,
        id: "marca",
        header: "Marca",
        size: 120,
        minSize: 100,
        cell: ({ getValue }) => (
          <div className="text-sm text-center">
            {getValue<string>() || "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "cantidad_entrada_salida",
        id: "cantidad",
        header: "Cantidad",
        size: 110,
        minSize: 90,
        cell: ({ row }) => (
          <EditableQuantity
            value={row.original.cantidad_entrada_salida}
            className="w-full"
            buttonClassName="w-full"
            onSubmit={(value) =>
              handleCantidadSubmit(row.index, value as number)
            }
            validate={(val) => {
              const num = parseInt(val);
              if (isNaN(num) || num <= 0) return false;
              return true;
            }}
            disableWheel
            disableArrowKeys
            columnKey="cantidad_entrada_salida"
          />
          // <EditableCell
          //   rowIndex={row.index}
          //   fieldName="cantidad_entrada_salida"
          //   value={row.original.cantidad_entrada_salida}
          //   format="number"
          // />
        ),
      },
      {
        accessorKey: "costo_entrada",
        id: "costo",
        header: "Costo Entrada",
        size: 120,
        minSize: 100,
        cell: ({ row }) => (
          // <EditableCell
          //   rowIndex={row.index}
          //   fieldName="costo_entrada"
          //   value={row.original.costo_entrada}
          //   format="currency"
          // />
          <div className="text-sm font-medium text-foreground text-center">
            {formatCurrency(row.original.costo_entrada)}
          </div>
        ),
      },
      {
        accessorKey: "tc_transfer",
        id: "tc_transfer",
        header: "T.C.",
        size: 100,
        minSize: 80,
        cell: ({ row }) => (
          <EditablePrice
            value={row.original.tc_transfer}
            onSubmit={(value) =>
              handleTcTransferSubmit(row.index, value as number)
            }
            className="w-full"
            buttonClassName="w-full"
            numberProps={{ min: 0, step: 0.01 }}
            disableWheel
            disableArrowKeys
            columnKey="tc_transfer"
          />
          // <EditableCell
          //   rowIndex={row.index}
          //   fieldName="tc_transfer"
          //   value={row.original.tc_transfer}
          //   format="currency"
          // />
        ),
      },
      {
        accessorKey: "precio_salida",
        id: "precio_salida",
        header: "Precio Salida",
        size: 120,
        minSize: 100,
        cell: ({ row }) => (
          <div className="text-sm font-medium text-foreground text-center">
            {formatCurrency(row.original.precio_salida)}
          </div>
          // <EditableCell
          //   rowIndex={row.index}
          //   fieldName="precio_salida"
          //   value={Number(row.original.precio_salida)}
          //   format="currency"
          // />
        ),
      },
      {
        accessorKey: "precio_entrada_venta",
        id: "precio_entrada_venta",
        header: "P. Venta",
        size: 120,
        minSize: 100,
        cell: ({ row }) => (
          <div className="text-sm font-medium text-foreground text-center">
            {formatCurrency(row.original.precio_entrada_venta)}
          </div>
          // <EditableCell
          //   rowIndex={row.index}
          //   fieldName="precio_entrada_venta"
          //   value={row.original.precio_entrada_venta}
          //   format="currency"
          // />
        ),
      },
      {
        accessorKey: "precio_entrada_venta_alt",
        id: "precio_entrada_venta_alt",
        header: "P. Venta Alt",
        size: 130,
        minSize: 110,
        cell: ({ row }) => (
          <div className="text-sm font-medium text-foreground text-center">
            {formatCurrency(row.original.precio_entrada_venta_alt)}
          </div>
          // <EditableCell
          //   rowIndex={row.index}
          //   fieldName="precio_entrada_venta_alt"
          //   value={row.original.precio_entrada_venta_alt}
          //   format="currency"
          // />
        ),
      },
      // {
      //   accessorKey: "incremento_p_entrada_venta",
      //   id: 'incremento_venta',
      //   header: "% Inc",
      //   size: 100,
      //   minSize: 80,
      //   cell: ({ row }) => (
      //     <div className="text-sm font-medium text-foreground text-center">
      //         {formatCurrency(row.original.incremento_p_entrada_venta)}
      //       </div>
      //     // <EditableCell
      //     //   rowIndex={row.index}
      //     //   fieldName="incremento_p_entrada_venta"
      //     //   value={row.original.incremento_p_entrada_venta}
      //     //   format="percentage"
      //     // />
      //   ),
      // },
      // {
      //   accessorKey: "incremento_p_entrada_venta_alt",
      //   id: 'incremento_venta_alt',
      //   header: "% Alt",
      //   size: 100,
      //   minSize: 80,
      //   cell: ({ row }) => (
      //     <div className="text-sm font-medium text-foreground text-center">
      //         {formatCurrency(row.original.incremento_p_entrada_venta_alt)}
      //       </div>
      //     // <EditableCell
      //     //   rowIndex={row.index}
      //     //   fieldName="incremento_p_entrada_venta_alt"
      //     //   value={row.original.incremento_p_entrada_venta_alt
      //     //   format="percentage"
      //     // />
      //   ),
      // },
      // {
      //   id: "subtotal",
      //   header: "Subtotal",
      //   size: 120,
      //   minSize: 100,
      //   cell: ({ row }) => {
      //     const subtotal = row.original.cantidad_entrada_salida * row.original.costo_entrada;
      //     return (
      //       <div className="text-sm font-medium text-foreground text-center">
      //         {formatCurrency(subtotal)}
      //       </div>
      //     )
      //   }
      // },
      {
        id: "action",
        header: "Acción",
        size: 70,
        minSize: 60,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onRemoveProduct(
                  row.original.producto_id,
                  row.original.purchase_id
                )
              }
              className="size-7 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ),
      },
    ],
    // ✅ `editing` and `tempValue` removed from deps — they belonged to the old
    // EditableCell (now commented out) and were causing inputs to re-mount on
    // every keystroke, which broke data-column navigation and the wheel listener.
    // Stable handlers via useCallback + detailsRef provide fresh data instead.
    [handleCantidadSubmit, handleTcTransferSubmit, onRemoveProduct]
  );

  const table = useReactTable<UITransferDetailCreate>({
    data: details,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    enableRowSelection: true,
  });

  return <CustomizableTable table={table} isLoading={isLoading} />;
}

// Exportar con forwardRef tipado correctamente
const TransferDetailTable = forwardRef(TransferDetailTableInner) as React.FC<
  TransferDetailTableProps & { ref?: React.Ref<TransferDetailTableRef> }
>;

TransferDetailTable.displayName = "TransferDetailTable";

export default TransferDetailTable;
