import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/atoms/resizable";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { showSuccessToast, showErrorToast } from "@/hooks/use-toast-enhanced";
import { getWindowManager } from "@/platform";
import { Check, Package, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SaleGetAll } from "@/modules/sales/types/salesGetResponse";
import { useBranchStore } from "@/states/branchStore";
import authSDK from "@/services/sdk-simple-auth";
import SaleReturnList from "@/modules/returns/components/SalesReturnList";
import SelectSalesReturnModal from "@/modules/returns/components/SelectSalesReturnModal";
import ReturnDetailTable, {
  type ReturnDetailTableRef,
} from "@/modules/returns/components/returnDetailTable";
import type { UIReturnDetailCreate } from "@/modules/returns/types/returnCreate.types";
import type { ProductChange } from "@/modules/returns/hooks/useReturnDetails";
import type { UIReturnDetailUpdate } from "@/modules/returns/types/returnUpdate.types";
import type { SalesFilters } from "../types/salesFilters";

interface WindowConfig {
  windowId: string;
  context: string;
  mode: "create" | "edit";
  selectedItems: (UIReturnDetailCreate | UIReturnDetailUpdate)[];
}

interface SelectedItemWithSale {
  almacen_out_det_id: number;
  cantidad: number;
  precio: number;
  comentario: string;
  orden: number;
  almacen_out_id: number;
  sale_id: number;
  product: {
    id: number;
    descripcion: string;
    codigo_oem: string | null;
    codigo_upc: string | null;
    precio_venta: number;
  };
  maxQuantity: number;
  almacen_out_dev_det_id?: number | null;
}

const SaleDetailSelectorWindow = () => {
  const platformWindows = getWindowManager();
  const tableRef = useRef<ReturnDetailTableRef>(null);

  const config: WindowConfig = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedItemsParam = params.get("selectedItems");
    let selectedItems: (UIReturnDetailCreate | UIReturnDetailUpdate)[] = [];

    if (selectedItemsParam) {
      try {
        selectedItems = JSON.parse(selectedItemsParam);
      } catch (e) {
        console.error("Error parsing selectedItems:", e);
      }
    }

    return {
      windowId: params.get("windowId") || "sale-detail-selector-default",
      context: params.get("context") || "default",
      mode: (params.get("mode") as "create" | "edit") || "create",
      selectedItems,
    };
  }, []);

  const STORAGE_KEY = config.windowId + "-sale-detail-filters";
  const FILTER_EXPIRATION_HOURS = 2;
  const [selectedSale, setSelectedSale] = useState<SaleGetAll | null>(null);

  // Hidratar el branch store desde localStorage — en ventanas secundarias de Tauri
  // el store arranca con selectedBranchId: null porque restoreForUser() nunca se llama.
  // authSDK.ready ya resolvió antes de este render (ver window-entry.tsx).
  useEffect(() => {
    const user = authSDK.getCurrentUser();
    useBranchStore.getState().restoreForUser(user?.id ?? "");
  }, []);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItemWithSale[]>(
    []
  );
  const [initialItems, setInitialItems] = useState<SelectedItemWithSale[]>([]);
  const [filters, setFilters] = useState<Partial<SalesFilters>>();
  const [isConfirming, setIsConfirming] = useState(false);

  // 🔥 Cargar filtros persistidos al montar
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { filters: parsed, timestamp } = JSON.parse(saved);

          // Verificar si los filtros han expirado
          const now = Date.now();
          const expirationTime = FILTER_EXPIRATION_HOURS * 60 * 60 * 1000; // en milisegundos

          if (now - timestamp > expirationTime) {
            // Filtros expirados, limpiar
            localStorage.removeItem(STORAGE_KEY);
            console.log("Filtros expirados, se han limpiado");
            return;
          }

          // Reconstruir fechas desde strings
          if (parsed.fecha_inicio && typeof parsed.fecha_inicio === "string") {
            parsed.fecha_inicio = new Date(parsed.fecha_inicio);
          }
          if (parsed.fecha_fin && typeof parsed.fecha_fin === "string") {
            parsed.fecha_fin = new Date(parsed.fecha_fin);
          }

          // Aplicar filtros guardados
          setFilters({
            pagina: parsed.pagina ?? 1,
            pagina_registros: parsed.pagina_registros ?? 10,
            sucursal: parsed.sucursal ?? 0,
            keywords: parsed.keywords ?? "",
            codigo_interno: parsed.codigo_interno ?? undefined,
            cliente: parsed.cliente ?? undefined,
            fecha_inicio: parsed.fecha_inicio ?? undefined,
            fecha_fin: parsed.fecha_fin ?? undefined,
            codigo_oem_producto: parsed.codigo_oem_producto ?? undefined,
          });
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    };
    loadFilters();
  }, []);

  // 🔥 Guardar filtros cuando cambien
  const saveFilters = useCallback((newFilters: Partial<SalesFilters>) => {
    try {
      const dataToSave = {
        filters: newFilters,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setFilters(newFilters);
    } catch (e) {
      console.error("Error saving filters:", e);
    }
  }, []);

  const reorderItems = useCallback(
    (items: SelectedItemWithSale[]): SelectedItemWithSale[] => {
      return items.map((item, index) => ({
        ...item,
        orden: index + 1,
      }));
    },
    []
  );

  useEffect(() => {
    if (config.selectedItems.length > 0) {
      const itemsWithSaleId: SelectedItemWithSale[] = config.selectedItems.map(
        (item) => {
          const almacenOutId = item.almacen_out_id ?? 0;
          const saleId =
            ("sale_id" in item ? (item as any).sale_id : null) ?? almacenOutId;

          return {
            almacen_out_det_id: item.almacen_out_det_id,
            cantidad: item.cantidad,
            precio: item.precio,
            comentario: item.comentario ?? "",
            orden: item.orden,
            almacen_out_id: almacenOutId || saleId,
            sale_id: saleId || almacenOutId,
            product: item.product,
            maxQuantity: item.maxQuantity,
            ...("almacen_out_dev_det_id" in item && {
              almacen_out_dev_det_id: (item as any).almacen_out_dev_det_id,
            }),
          };
        }
      );

      const orderedItems = reorderItems(itemsWithSaleId);
      setSelectedItems(orderedItems);
      setInitialItems(orderedItems);
    }
  }, [config.selectedItems, reorderItems]);

  const handleSelectSale = useCallback((sale: SaleGetAll) => {
    setSelectedSale(sale);
    setIsDialogOpen(true);
  }, []);

  const handleCloseSelectDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedSale(null);
  }, []);

  // 🔥 Calcular cambios desde items actuales vs iniciales
  const calculateChanges = useCallback(
    (
      currentItems: SelectedItemWithSale[],
      initialItems: SelectedItemWithSale[]
    ): ProductChange[] => {
      const changes: ProductChange[] = [];

      currentItems.forEach((item) => {
        const initialItem = initialItems.find(
          (i) => i.almacen_out_det_id === item.almacen_out_det_id
        );
        const isNew = !initialItem;
        const hasChanged =
          isNew ||
          initialItem.cantidad !== item.cantidad ||
          initialItem.precio !== item.precio ||
          initialItem.comentario !== item.comentario;

        if (hasChanged) {
          changes.push({
            almacen_out_det_id: item.almacen_out_det_id,
            cantidad: item.cantidad,
            precio: item.precio,
            comentario: item.comentario || "",
            sale_id: item.sale_id,
            product: item.product,
            isNew,
            maxQuantity: item.maxQuantity,
          });
        }
      });

      initialItems.forEach((initialItem) => {
        const stillExists = currentItems.some(
          (i) => i.almacen_out_det_id === initialItem.almacen_out_det_id
        );
        if (!stillExists) {
          changes.push({
            almacen_out_det_id: initialItem.almacen_out_det_id,
            cantidad: 0,
            precio: initialItem.precio,
            comentario: "",
            sale_id: initialItem.sale_id,
            product: initialItem.product,
            isNew: false,
            maxQuantity: initialItem.maxQuantity,
          });
        }
      });

      return changes;
    },
    []
  );

  // 🔥 Confirmar selección directamente
  const confirmAndClose = useCallback(
    async (itemsToConfirm: SelectedItemWithSale[]) => {
      if (isConfirming) return;
      setIsConfirming(true);

      try {
        const changes = calculateChanges(itemsToConfirm, initialItems);

        if (changes.length === 0) {
          showErrorToast({
            title: "Sin cambios",
            description: "No has realizado ningún cambio",
            duration: 3000,
          });
          return;
        }

        showSuccessToast({
          title: "Cambios confirmados",
          description: `${changes.length} cambio${changes.length !== 1 ? "s" : ""} aplicado${changes.length !== 1 ? "s" : ""}`,
          duration: 2000,
        });

        await platformWindows.emitToWindow(
          config.windowId,
          "sale-details-changes-applied",
          changes
        );

        await platformWindows.closeCurrentWindow();
      } catch (error) {
        console.error("Error confirming selection:", error);
        showErrorToast({
          title: "Error",
          description: "No se pudieron aplicar los cambios",
          duration: 3000,
        });
      } finally {
        setIsConfirming(false);
      }
    },
    [
      isConfirming,
      initialItems,
      calculateChanges,
      config.windowId,
      platformWindows,
    ]
  );

  // 🔥 Manejar confirmación del modal - VERSIÓN CORREGIDA
  const handleConfirmModal = useCallback(
    (changes: ProductChange[]) => {
      if (changes.length === 0) {
        setIsDialogOpen(false);
        setSelectedSale(null);
        return;
      }

      // Calcular los nuevos items con los cambios aplicados
      let newItems = [...selectedItems];

      changes.forEach((change) => {
        const existingIndex = newItems.findIndex(
          (item) => item.almacen_out_det_id === change.almacen_out_det_id
        );

        if (change.cantidad === 0) {
          if (existingIndex >= 0) {
            newItems.splice(existingIndex, 1);
          }
          return;
        }

        if (existingIndex >= 0) {
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            cantidad: change.cantidad,
            precio: change.precio,
            comentario: change.comentario || newItems[existingIndex].comentario,
            maxQuantity: change.maxQuantity,
          };
        } else {
          const newItem: SelectedItemWithSale = {
            almacen_out_det_id: change.almacen_out_det_id,
            cantidad: change.cantidad,
            precio: change.precio,
            comentario: change.comentario || "",
            orden: newItems.length + 1,
            almacen_out_id: change.sale_id,
            sale_id: change.sale_id,
            product: change.product,
            maxQuantity: change.maxQuantity,
            almacen_out_dev_det_id: null,
          };
          newItems.push(newItem);
        }
      });

      const orderedItems = reorderItems(newItems);

      // Actualizar el estado
      setSelectedItems(orderedItems);
      setIsDialogOpen(false);
      setSelectedSale(null);

      // 🔥 CLAVE: Confirmar directamente con los nuevos items
      setTimeout(() => {
        confirmAndClose(orderedItems);
      }, 100);

      // Enfocar el primer input
      setTimeout(() => {
        if (changes.length > 0) {
          tableRef.current?.focusQuantityInputByProductId(
            changes[0].almacen_out_det_id
          );
        }
      }, 150);
    },
    [selectedItems, reorderItems, confirmAndClose]
  );

  const handleUpdateCantidad = useCallback(
    (id_detalle: number, cantidad: number) => {
      setSelectedItems((prev) =>
        prev.map((item) => {
          if (item.almacen_out_det_id !== id_detalle) return item;

          if (cantidad > item.maxQuantity) {
            showErrorToast({
              title: "Cantidad excedida",
              description: `La cantidad máxima disponible es ${item.maxQuantity}`,
              duration: 3000,
            });
            return item;
          }

          return { ...item, cantidad };
        })
      );
    },
    []
  );

  const handleUpdatePrecio = useCallback(
    (id_detalle: number, precio: number) => {
      setSelectedItems((prev) =>
        prev.map((item) =>
          item.almacen_out_det_id === id_detalle ? { ...item, precio } : item
        )
      );
    },
    []
  );

  const handleUpdateComentario = useCallback(
    (id_detalle: number, comentario: string) => {
      setSelectedItems((prev) =>
        prev.map((item) =>
          item.almacen_out_det_id === id_detalle
            ? { ...item, comentario }
            : item
        )
      );
    },
    []
  );

  const handleRemoveProduct = useCallback(
    (id_detalle: number) => {
      setSelectedItems((prev) => {
        const filtered = prev.filter(
          (item) => item.almacen_out_det_id !== id_detalle
        );
        return reorderItems(filtered);
      });
    },
    [reorderItems]
  );

  const handleConfirmSelection = useCallback(async () => {
    await confirmAndClose(selectedItems);
  }, [selectedItems, confirmAndClose]);

  const handleClose = useCallback(async () => {
    await platformWindows.emitToWindow(config.windowId, "window-closed", { canceled: true });
    await platformWindows.closeCurrentWindow();
  }, [config.windowId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const contextTitle = useMemo(() => {
    const titles: Record<string, string> = {
      return: "Seleccionar Productos de Venta",
      devolution: "Agregar Productos para Devolución",
    };
    return titles[config.context] || "Seleccionar Productos";
  }, [config.context]);

  const pendingChanges = useMemo(() => {
    return calculateChanges(selectedItems, initialItems).length;
  }, [selectedItems, initialItems, calculateChanges]);

  return (
    <main className="h-full p-2 flex flex-col bg-background gap-2">
      <header className="bg-background rounded-lg p-2 border border-border flex-shrink-0">
        <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
          <div className="flex items-center gap-2 md:gap-4 grow">
            <Package className="h-5 w-5 text-primary" />
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-primary">{contextTitle}</h1>
              <Badge variant={config.mode === "edit" ? "default" : "secondary"}>
                {config.mode === "edit" ? "Editando" : "Nuevo"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedItems.length > 0 && (
              <Badge variant="accent">
                {selectedItems.length} seleccionados
              </Badge>
            )}

            {pendingChanges > 0 && (
              <Badge variant="default">{pendingChanges} cambios</Badge>
            )}

            <Button
              onClick={handleClose}
              variant="ghost"
              disabled={isConfirming}
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>

            <Button
              onClick={handleConfirmSelection}
              className="gap-2"
              disabled={pendingChanges === 0 || isConfirming}
            >
              <Check className="h-4 w-4" />
              Confirmar {pendingChanges > 0 && `(${pendingChanges})`}
            </Button>
          </div>
        </section>
      </header>

      <ResizablePanelGroup
        direction="vertical"
        className="flex-1 min-h-0 overflow-hidden gap-2"
      >
        <ResizablePanel defaultSize={60} minSize={15}>
          <SaleReturnList
            selectedSales={selectedItems}
            onSaleSelect={handleSelectSale}
            defaultSearchMode="manual"
            onlySelectWithStock={false}
            savedFilters={filters}
            onSavedFiltersChange={saveFilters}
            onResetSavedFilters={() => {
              localStorage.removeItem(STORAGE_KEY);
              setFilters(undefined);
            }}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={40}>
          <Card className="h-full flex flex-col shadow-none">
            <CardHeader className="flex-shrink-0 p-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Productos Seleccionados</span>
                {selectedItems.length > 0 && (
                  <Badge variant="secondary">
                    {selectedItems.length} items
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-auto p-2">
              {selectedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-200" />
                  <p className="font-medium">No hay productos seleccionados</p>
                  <p className="text-sm">
                    Selecciona una venta y agrega productos
                  </p>
                </div>
              ) : (
                <ReturnDetailTable
                  ref={tableRef}
                  details={selectedItems}
                  onUpdateCantidad={handleUpdateCantidad}
                  onUpdatePrecio={handleUpdatePrecio}
                  onUpdateComentario={handleUpdateComentario}
                  onRemoveProduct={handleRemoveProduct}
                />
              )}
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>

      <SelectSalesReturnModal
        isDialogOpen={isDialogOpen}
        onCloseDialog={handleCloseSelectDialog}
        saleId={selectedSale?.id ?? null}
        selectedProducts={selectedItems.map((item) => ({
          almacen_out_det_id: item.almacen_out_det_id,
          cantidad: item.cantidad,
          comentario: item.comentario,
        }))}
        onConfirm={handleConfirmModal}
      />
    </main>
  );
};

export default SaleDetailSelectorWindow;
