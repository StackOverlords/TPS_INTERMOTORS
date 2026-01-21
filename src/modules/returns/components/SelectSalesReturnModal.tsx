import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { Input } from "@/components/atoms/input";
import { Skeleton } from "@/components/atoms/skeleton";
import { TableCell, TableRow } from "@/components/atoms/table";
import CustomizableTable from "@/components/common/CustomizableTable";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import { useCustomTable } from "@/hooks/useCustomTable";
import { cn } from "@/lib/utils";
import { useSaleGetById } from "@/modules/sales/hooks/useSaleGetById";
import type { SaleItemGetById } from "@/modules/sales/types/salesGetResponse";
import { formatCurrency, formatDate } from "@/utils/formaters";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Calculator,
  CalendarDays,
  Check,
  Minus,
  Plus,
  Search,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { showErrorToast } from "@/hooks/use-toast-enhanced";

interface SelectSalesReturnModalProps {
  saleId: number | null;
  isDialogOpen: boolean;
  onCloseDialog: (open: boolean) => void;
  selectedProducts: {
    almacen_out_det_id: number;
    cantidad: number;
    comentario?: string | null;
  }[];
  onConfirm?: (
    changes: Array<{
      almacen_out_det_id: number;
      cantidad: number;
      precio: number;
      comentario: string;
      sale_id: number;
      product: {
        id: number;
        descripcion: string;
        codigo_oem: string;
        codigo_upc: string;
        precio_venta: number;
      };
      isNew: boolean;
      maxQuantity: number; // Añadido
    }>
  ) => void;
}

const SelectSalesReturnModal: React.FC<SelectSalesReturnModalProps> = ({
  saleId,
  isDialogOpen,
  onCloseDialog,
  selectedProducts,
  onConfirm,
}) => {
  const [searchSaleDetail, setSearchSaleDetail] = useState<string>("");

  // Estado temporal: Map<almacen_out_det_id, { cantidad, comentario }>
  const [tempSelections, setTempSelections] = useState<
    Map<number, { cantidad: number; comentario: string }>
  >(new Map());

  // Estado inicial para comparar cambios
  const [initialSelections, setInitialSelections] = useState<
    Map<number, { cantidad: number; comentario: string }>
  >(new Map());

  const {
    data: saleData,
    isLoading: isLoadingSale,
    isError: isErrorSale,
    isRefetching: isRefetchingSale,
  } = useSaleGetById(Number(saleId));

  // Inicializar selecciones temporales cuando se abre el modal
  useEffect(() => {
    if (isDialogOpen && selectedProducts) {
      const initialMap = new Map<
        number,
        { cantidad: number; comentario: string }
      >();

      // Solo inicializar con productos de ESTA venta
      selectedProducts
        .filter((item) => {
          // Verificar si el producto pertenece a esta venta
          const belongsToSale = saleData?.detalles.some(
            (d) => d.id === item.almacen_out_det_id
          );
          return belongsToSale;
        })
        .forEach((item) => {
          initialMap.set(item.almacen_out_det_id, {
            cantidad: item.cantidad,
            comentario: item.comentario || "",
          });
        });

      setTempSelections(new Map(initialMap));
      setInitialSelections(new Map(initialMap));
    }
  }, [isDialogOpen, selectedProducts, saleData]);

  const filteredSaleDetailData = useMemo(() => {
    return saleData?.detalles.filter((item) =>
      item.producto.descripcion
        .toLowerCase()
        .includes(searchSaleDetail.toLowerCase())
    );
  }, [saleData, searchSaleDetail]);

  // Obtener cantidad temporal (en el modal)
  const getTempQuantity = useCallback(
    (productId: number): number => {
      return tempSelections.get(productId)?.cantidad || 0;
    },
    [tempSelections]
  );

  // Agregar una unidad temporal
  const handleAddTemp = useCallback(
    (product: SaleItemGetById) => {
      const currentData = tempSelections.get(product.id);
      const currentTemp = currentData?.cantidad || 0;
      const maxQuantity = product.cantidad;

      if (currentTemp >= maxQuantity) {
        showErrorToast({
          title: "Cantidad máxima alcanzada",
          description: `No puedes agregar más de ${maxQuantity} unidades`,
          duration: 3000,
        });
        return;
      }

      setTempSelections((prev) => {
        const newMap = new Map(prev);
        newMap.set(product.id, {
          cantidad: currentTemp + 1,
          comentario: currentData?.comentario || "",
        });
        return newMap;
      });
    },
    [tempSelections]
  );

  // Remover una unidad temporal
  const handleRemoveTemp = useCallback((productId: number) => {
    setTempSelections((prev) => {
      const newMap = new Map(prev);
      const currentData = newMap.get(productId);
      const current = currentData?.cantidad || 0;

      if (current <= 1) {
        newMap.delete(productId);
      } else {
        newMap.set(productId, {
          cantidad: current - 1,
          comentario: currentData?.comentario || "",
        });
      }

      return newMap;
    });
  }, []);

  // Confirmar selecciones - SOLO enviar cambios
  const handleConfirm = useCallback(() => {
    if (!onConfirm || !saleData) return;

    const changes: Array<{
      almacen_out_det_id: number;
      cantidad: number;
      precio: number;
      comentario: string;
      sale_id: number;
      product: any;
      isNew: boolean;
      maxQuantity: number;
    }> = [];

    // Detectar cambios
    tempSelections.forEach((tempData, detailId) => {
      const initialData = initialSelections.get(detailId);
      const saleDetail = saleData.detalles.find((d) => d.id === detailId);

      if (!saleDetail) return;

      // Es nuevo si no existía antes
      const isNew = !initialData;

      // Hay cambio si es nuevo O si la cantidad cambió
      const hasChanged =
        isNew || (initialData && initialData.cantidad !== tempData.cantidad);

      if (hasChanged) {
        changes.push({
          almacen_out_det_id: detailId,
          cantidad: tempData.cantidad,
          precio: saleDetail.precio - saleDetail.descuento,
          comentario: tempData.comentario,
          sale_id: saleData.id,
          product: {
            id: saleDetail.producto.id,
            descripcion: saleDetail.producto.descripcion,
            codigo_oem: saleDetail.producto.codigo_oem || "",
            codigo_upc: saleDetail.producto.codigo_upc || "",
            precio_venta: saleDetail.precio,
          },
          isNew,
          maxQuantity: saleDetail.cantidad, // Incluir cantidad máxima
        });
      }
    });

    // Detectar eliminados (existían antes pero ya no están)
    initialSelections.forEach((_initialData, detailId) => {
      if (!tempSelections.has(detailId)) {
        const saleDetail = saleData.detalles.find((d) => d.id === detailId);
        if (saleDetail) {
          changes.push({
            almacen_out_det_id: detailId,
            cantidad: 0, // Cantidad 0 indica eliminación
            precio: saleDetail.precio - saleDetail.descuento,
            comentario: "",
            sale_id: saleData.id,
            product: {
              id: saleDetail.producto.id,
              descripcion: saleDetail.producto.descripcion,
              codigo_oem: saleDetail.producto.codigo_oem || "",
              codigo_upc: saleDetail.producto.codigo_upc || "",
              precio_venta: saleDetail.precio,
            },
            isNew: false,
            maxQuantity: saleDetail.cantidad,
          });
        }
      }
    });

    if (changes.length > 0) {
      onConfirm(changes);
    }

    onCloseDialog(false);
  }, [tempSelections, initialSelections, onConfirm, onCloseDialog, saleData]);

  // Cancelar y restaurar estado
  const handleCancel = useCallback(() => {
    setTempSelections(new Map(initialSelections));
    onCloseDialog(false);
  }, [initialSelections, onCloseDialog]);

  const columns = useMemo<ColumnDef<SaleItemGetById>[]>(
    () => [
      {
        accessorFn: (row) => row.producto.codigo_interno,
        id: "cod_interno",
        header: "Cód. Int.",
        size: 50,
        minSize: 30,
        enableHiding: false,
        cell: ({ getValue }) => (
          <span className="text-center text-xs">{getValue<number>()}</span>
        ),
      },
      {
        accessorFn: (row) => row.producto.descripcion,
        id: "descripcion",
        header: "Descripción",
        size: 250,
        minSize: 200,
        cell: ({ getValue }) => {
          const descripcion = getValue<string>();
          return (
            <div className="space-y-0.5">
              <h3
                title="Descripción"
                className="text-xs font-medium text-primary truncate"
              >
                {descripcion}
              </h3>
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.producto.codigo_oem,
        id: "cod_oem",
        header: "Cód. OEM",
      },
      {
        accessorKey: "cantidad",
        header: "Cantidad",
        size: 90,
        minSize: 80,
        cell: ({ row, getValue }) => {
          const product = row.original.producto;
          const cantidad =
            typeof getValue() === "string"
              ? parseFloat(getValue() as string)
              : getValue<number>();
          const cantidadDev = row.original.cantidad_dev ?? 0;
          const cantidadReal = cantidad - cantidadDev;

          const cantidadDisplay = isFinite(cantidadReal)
            ? cantidadReal.toFixed(0)
            : "0";
          const tempQty = getTempQuantity(row.original.id);

          return (
            <div className="text-center">
              <div className="text-sm font-medium">
                {cantidadDisplay}
                {tempQty > 0 && (
                  <span className="text-xs text-blue-600 ml-1">
                    ({tempQty} selec.)
                  </span>
                )}
              </div>
              {product.unidad_medida && (
                <div className="text-[10px] text-gray-500">
                  {product.unidad_medida.unidad_medida}
                </div>
              )}
            </div>
          );
        },
        sortingFn: "alphanumeric",
      },
      {
        accessorKey: "cantidad_dev",
        header: "Devoluciones",
        size: 90,
        minSize: 80,
        cell: ({ row, getValue }) => {
          const product = row.original.producto;

          const cantidadDev = getValue<number>() ?? 0;
          const cantidadDisplay = isFinite(cantidadDev)
            ? cantidadDev.toFixed(0)
            : "0";

          return (
            <div className="flex gap-3 items-center justify-center">
              <div className="text-center">
                <div className="text-sm font-medium">{cantidadDisplay}</div>
                {product.unidad_medida && (
                  <div className="text-[10px] text-gray-500">
                    {product.unidad_medida.unidad_medida}
                  </div>
                )}
              </div>
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
          const porcentaje = row.original.porcentaje_descuento;
          const discountPercent =
            typeof porcentaje === "string"
              ? parseFloat(porcentaje)
              : porcentaje;
          const discountPercentDisplay = isFinite(discountPercent)
            ? discountPercent.toFixed(2)
            : null;

          return (
            <div className="font-medium flex items-end justify-center flex-col">
              {discountPercentDisplay && (
                <span className="text-red-500">{discountPercentDisplay}%</span>
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
          const subtotal =
            product.precio * (product.cantidad - product.cantidad_dev);
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
      {
        id: "actions",
        header: "Acciones",
        size: 140,
        cell: ({ row }) => {
          const product = row.original;
          const tempQty = getTempQuantity(product.id);
          const maxQuantity = product.cantidad - product.cantidad_dev;
          const isMaxReached = tempQty >= maxQuantity;

          const cantidadDev = row.original.cantidad_dev ?? 0;
          const isFullyReturned = cantidadDev === product.cantidad;

          return (
            <div className="flex items-center justify-center gap-1">
              {tempQty > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemoveTemp(product.id)}
                  className="h-7 w-7 p-0 cursor-pointer"
                >
                  <Minus className="size-3" />
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                variant={tempQty > 0 ? "default" : "outline"}
                disabled={isMaxReached}
                onClick={() => handleAddTemp(product)}
                className={cn(
                  "h-7 px-2 min-w-[80px] text-xs cursor-pointer",
                  isMaxReached && "cursor-not-allowed"
                )}
              >
                {isMaxReached ? (
                  <>
                    <span>
                      {isFullyReturned
                        ? "Prod. Devuelto"
                        : `${tempQty} Agregados`}
                    </span>
                  </>
                ) : tempQty > 0 ? (
                  <>
                    <span className="font-bold">{tempQty}</span>
                    <span className="mx-1">/</span>
                    <span className="text-xs">{maxQuantity}</span>
                  </>
                ) : (
                  <>
                    <Plus className="size-3 mr-1" />
                    Agregar
                  </>
                )}
              </Button>
            </div>
          );
        },
      },
    ],
    [getTempQuantity, initialSelections, handleAddTemp, handleRemoveTemp]
  );

  const { table } = useCustomTable({
    data: filteredSaleDetailData ?? [],
    columns,
    enableSorting: true,
    enableColumnResizing: true,
    enableRowSelection: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,
    columnResizeMode: "onChange",
    persistColumnOrder: true,
  });

  const totalAmount = useMemo(() => {
    return (
      filteredSaleDetailData?.reduce((total, item) => {
        const subtotal = item.precio * (item.cantidad - item.cantidad_dev);
        const descuento =
          item.porcentaje_descuento != null
            ? 1 - item.porcentaje_descuento / 100
            : 1;
        return total + subtotal * descuento;
      }, 0) ?? 0
    );
  }, [filteredSaleDetailData]);

  // Calcular total de items temporales seleccionados Y cambios
  const { tempTotalItems, totalChanges } = useMemo(() => {
    const totalItems = Array.from(tempSelections.values()).reduce(
      (sum, data) => sum + data.cantidad,
      0
    );

    let changes = 0;
    tempSelections.forEach((tempData, id) => {
      const initialData = initialSelections.get(id);
      if (!initialData || initialData.cantidad !== tempData.cantidad) {
        changes++;
      }
    });

    // Contar eliminados
    initialSelections.forEach((_, id) => {
      if (!tempSelections.has(id)) {
        changes++;
      }
    });

    return { tempTotalItems: totalItems, totalChanges: changes };
  }, [tempSelections, initialSelections]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-6xl max-h-[80vh] flex flex-col overflow-hidden p-3">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            Seleccionar Productos • Venta {saleData?.nro}
            {tempTotalItems > 0 && (
              <Badge variant="accent" className="ml-2">
                {tempTotalItems} items
              </Badge>
            )}
            {totalChanges > 0 && (
              <Badge variant="default" className="ml-2">
                {totalChanges} cambios
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <DialogDescription asChild>
          <div className="space-y-4 flex-shrink-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {isLoadingSale ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="w-full h-8" />
                ))
              ) : (
                <>
                  <h3
                    className={cn(
                      "font-semibold text-primary flex items-center gap-2",
                      !saleData?.cliente &&
                        "text-muted-foreground italic font-normal"
                    )}
                  >
                    <User className="size-4" />
                    {saleData?.cliente
                      ? saleData?.cliente?.cliente
                      : "Sin cliente"}
                  </h3>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="size-4" />
                    {formatDate(saleData?.fecha ?? "")}
                  </p>
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calculator className="size-4" />
                    {saleData?.cantidad_detalles} productos
                  </span>
                </>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto por descripción..."
                value={searchSaleDetail}
                onChange={(e) => setSearchSaleDetail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </DialogDescription>

        <div className="space-y-2 flex-1 min-h-0 overflow-auto">
          {isErrorSale ? (
            <ErrorDataComponent errorMessage="No se pudo cargar la venta." />
          ) : (
            <>
              <CustomizableTable
                table={table}
                isLoading={isLoadingSale}
                rows={filteredSaleDetailData?.length || 5}
                isFetching={isRefetchingSale}
                isError={isErrorSale}
                renderBottomRow={() => {
                  const colSpan = table.getVisibleFlatColumns().length;
                  return (
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={colSpan} className="p-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-gray-500">
                            Total de ítems:{" "}
                            <span className="font-medium text-gray-900">
                              {saleData?.cantidad_detalles}
                            </span>
                          </div>
                          <div className="text-gray-500">
                            <span className="text-sm font-bold text-emerald-600">
                              {formatCurrency(totalAmount)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }}
              />
            </>
          )}
        </div>
        {onConfirm && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="gap-2"
              disabled={totalChanges === 0}
            >
              <Check className="h-4 w-4" />
              Confirmar {totalChanges > 0 && `(${totalChanges} cambios)`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SelectSalesReturnModal;
