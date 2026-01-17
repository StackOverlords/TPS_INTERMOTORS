import { Button } from "@/components/atoms/button";
import { Checkbox } from "@/components/atoms/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { Label } from "@/components/atoms/label";
import { AlertCircle, Info, Loader2, X } from "lucide-react";
import { useUpdatePriceForm } from "../hooks/useUpdatePriceForm";
import { useUpdatePurchaseDetailPrices } from "../hooks/useUpdatePurchaseDetailPrices";
import { format } from "date-fns";
import type { ProductStock } from "@/modules/products/types/productStock";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useMemo, useRef, useEffect, useState, useLayoutEffect } from "react";
import { EditableField } from "@/components/common/EditableField";
import { Badge } from "@/components/atoms/badge";
import { Separator } from "@/components/atoms/separator";

interface UpdatePurchaseDetailPricesFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: ProductStock | null;
  branchType: "current" | "other";
  currentBranchDetails: ProductStock[];
  otherBranchesDetails: ProductStock[];
}

const UpdatePurchaseDetailPricesFormModal = ({
  open,
  onOpenChange,
  detail,
  branchType,
  currentBranchDetails,
  otherBranchesDetails,
}: UpdatePurchaseDetailPricesFormModalProps) => {
  const {
    formData,
    handleIncrementSlider,
    handleSalesPriceChange,
    handleSalePriceIncrementChange,
    handleAlternativeSalePriceChange,
    handleAlternativeSalePriceIncrementChange,
    handleAssignmentChange,
    getFinalSalePriceIncrement,
  } = useUpdatePriceForm(detail);

  const { mutate: updatePrices, isPending } = useUpdatePurchaseDetailPrices();
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startDeltaRef = useRef(0);
  const [isSliderActive, setIsSliderActive] = useState(false);

  // Guardar la función en una ref para mantener referencia estable
  const handleIncrementSliderRef = useRef(handleIncrementSlider);

  // Actualizar la ref cuando cambie la función
  useEffect(() => {
    handleIncrementSliderRef.current = handleIncrementSlider;
  }, [handleIncrementSlider]);

  // Resetear el estado cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setIsSliderActive(false);
      isDraggingRef.current = false;
    }
  }, [open]);

  // Obtener todos los detalles únicos
  const allUniqueDetails = useMemo(() => {
    const allIds = new Set<number>();
    const uniqueDetails: ProductStock[] = [];

    [...currentBranchDetails, ...otherBranchesDetails].forEach((detail) => {
      if (!allIds.has(detail.id)) {
        allIds.add(detail.id);
        uniqueDetails.push(detail);
      }
    });

    return uniqueDetails;
  }, [currentBranchDetails, otherBranchesDetails]);

  // Custom slider handler - VERSIÓN COMPLETAMENTE CORREGIDA
  useLayoutEffect(() => {
    if (!open) return;

    let rafId: number;

    const setup = () => {
      const slider = sliderRef.current;
      if (!slider) {
        // Espera al próximo frame si aún no existe
        rafId = requestAnimationFrame(setup);
        return;
      }

      // 🔹 AQUÍ el DOM YA EXISTE

      // Función para aplicar snap al 0 (si está cerca, lo pone en 0)
      const applySnapToZero = (value: number): number => {
        const snapThreshold = 3; // Si está entre -3 y +3, snap a 0
        if (Math.abs(value) <= snapThreshold) return 0;
        return value;
      };

      const handleMouseDown = (e: MouseEvent) => {
        isDraggingRef.current = true;
        startXRef.current = e.clientX;
        const currentValue = parseFloat(
          slider.getAttribute("data-slider-value") || "0"
        );
        startDeltaRef.current = currentValue;
        setIsSliderActive(true);
        e.preventDefault();
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const deltaX = e.clientX - startXRef.current;
        // Shift = precisión (±1%), Normal = (±5%)
        const isPrecisionMode = e.shiftKey;
        const stepSize = isPrecisionMode ? 1 : 5;
        const pixelsPerStep = isPrecisionMode ? 8 : 15;
        const steps = Math.round(deltaX / pixelsPerStep);
        const newValue = startDeltaRef.current + steps * stepSize;
        // Solo aplicar snap si NO está en modo precisión
        handleIncrementSliderRef.current([isPrecisionMode ? newValue : applySnapToZero(newValue)]);
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        setIsSliderActive(false);
      };

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const currentDelta = parseFloat(
          slider.getAttribute("data-slider-value") || "0"
        );
        const direction = e.deltaY < 0 ? 1 : -1;
        // Shift = precisión (±1%), Normal = (±5%)
        const isPrecisionMode = e.shiftKey;
        const stepSize = isPrecisionMode ? 1 : 5;
        const newValue = currentDelta + direction * stepSize;
        // Solo aplicar snap si NO está en modo precisión
        handleIncrementSliderRef.current([isPrecisionMode ? newValue : applySnapToZero(newValue)]);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          const currentDelta = parseFloat(
            slider.getAttribute("data-slider-value") || "0"
          );
          const direction = e.key === "ArrowRight" ? 1 : -1;
          // Shift = precisión (±1%), Normal = (±5%)
          const isPrecisionMode = e.shiftKey;
          const stepSize = isPrecisionMode ? 1 : 5;
          const newValue = currentDelta + direction * stepSize;
          // Solo aplicar snap si NO está en modo precisión
          handleIncrementSliderRef.current([isPrecisionMode ? newValue : applySnapToZero(newValue)]);
        }
      };

      slider.addEventListener("mousedown", handleMouseDown);
      slider.addEventListener("wheel", handleWheel, { passive: false });
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        slider.removeEventListener("mousedown", handleMouseDown);
        slider.removeEventListener("wheel", handleWheel);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("keydown", handleKeyDown);
      };
    };

    setup();

    return () => cancelAnimationFrame(rafId);
  }, [open]);

  // Calcular qué detalles se van a actualizar
  const getDetailsToUpdate = (): number[] => {
    if (!detail) return [];

    if (formData.assignToAllBranches) {
      return allUniqueDetails.map((d) => d.id);
    }

    if (formData.assignToAllBalances) {
      return branchType === "current"
        ? currentBranchDetails.map((d) => d.id)
        : otherBranchesDetails.map((d) => d.id);
    }

    return [detail.id];
  };

  const handleSave = () => {
    if (!detail) return;

    const detailsIds = getDetailsToUpdate();
    const finalIncrement = getFinalSalePriceIncrement();

    updatePrices(
      {
        precio_venta: formData.salePrice,
        precio_venta_alt: formData.alternativeSalePrice,
        incremento_p_venta: finalIncrement,
        incremento_p_venta_alt: formData.alternativeSalePriceIncrement,
        detalles: detailsIds,
      },
      {
        onSuccess: () => {
          showSuccessToast({
            title: "Precios actualizados",
            description: `Se actualizaron ${detailsIds.length} detalle(s) correctamente`,
          });
          onOpenChange(false);
        },
        onError: (error) => {
          showErrorToast({
            title: "Error al actualizar precios",
            description:
              error.message || "Ocurrió un error al actualizar los precios",
          });
        },
      }
    );
  };

  if (!detail) return null;

  const hasAssignmentSelected =
    formData.assignToAllBalances || formData.assignToAllBranches;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl"
        aria-describedby="update-prices-description"
      >
        <p id="update-prices-description" className="sr-only">
          Formulario para actualizar precios y aplicar incrementos.
        </p>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg">Actualizar Precios</DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  Nro. Adquisición: {detail.nro_adquisicion}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Sucursal: {detail.sucursal}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Última modificación:{" "}
                {detail.fecha_actualizacion
                  ? format(
                      new Date(detail.fecha_actualizacion),
                      "dd/MM/yyyy HH:mm"
                    )
                  : "Sin modificaciones previas"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Costo - Deshabilitado */}
          <div className="space-y-2">
            <Label>Costo</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm z-10">
                Bs.
              </span>
              <EditableField
                value={formData.costPrice}
                onSubmit={() => {}}
                type="number"
                formatter={(val) =>
                  typeof val === "number"
                    ? val.toFixed(2)
                    : parseFloat(val.toString()).toFixed(2)
                }
                numberProps={{ min: 0, step: 0.01 }}
                disabled={true}
                showEditIcon={false}
                inputClassName="pl-10 bg-muted/30"
              />
            </div>
          </div>

          {/* Incremento Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ajuste de Incremento (Delta)</Label>
              <span
                className={`text-base font-semibold tabular-nums transition-all ${
                  isSliderActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {formData.incrementSlider >= 0 ? "+" : ""}
                {formData.incrementSlider.toFixed(2)}%
              </span>
            </div>
            <div
              ref={sliderRef}
              data-slider-value={formData.incrementSlider}
              className={`relative h-10 bg-muted/50 rounded-md border cursor-ew-resize select-none transition-all ${
                isSliderActive
                  ? "border-foreground/30"
                  : "border-border hover:border-foreground/20"
              }`}
            >
              {/* Track de fondo */}
              <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-1 bg-border rounded-full" />

              {/* Marcas visuales en valores clave usando la misma escala asintótica */}
              {/* ±100: (1 - 1/2) * 44 = 22% */}
              <div className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-muted-foreground/30 rounded-full" style={{ left: "calc(50% - 22%)" }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-muted-foreground/30 rounded-full" style={{ left: "calc(50% + 22%)" }} />
              {/* ±50: (1 - 1/1.5) * 44 ≈ 14.67% */}
              <div className="absolute top-1/2 -translate-y-1/2 w-px h-2 bg-muted-foreground/20 rounded-full" style={{ left: "calc(50% - 14.67%)" }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-px h-2 bg-muted-foreground/20 rounded-full" style={{ left: "calc(50% + 14.67%)" }} />

              {/* Marcador central (cero) - más prominente */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-5 bg-muted-foreground/50 rounded-full" />

              {/* Fill desde el centro hasta el thumb - escala no lineal */}
              {formData.incrementSlider !== 0 && (() => {
                const value = formData.incrementSlider;
                // Función asintótica: posición = (1 - 1/(1 + |valor|/100)) * 44
                // Nunca llega al 44%, permite valores infinitos
                const visualPos = (1 - 1 / (1 + Math.abs(value) / 100)) * 44;
                return (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-1 bg-foreground/60 rounded-full transition-all duration-100"
                    style={{
                      left: value > 0 ? "50%" : `calc(50% - ${visualPos}%)`,
                      width: `${visualPos}%`,
                    }}
                  />
                );
              })()}

              {/* Thumb que se mueve - escala no lineal */}
              {(() => {
                const value = formData.incrementSlider;
                // Misma función asintótica con signo
                const sign = value >= 0 ? 1 : -1;
                const visualPos = sign * (1 - 1 / (1 + Math.abs(value) / 100)) * 44;
                return (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-100"
                    style={{
                      left: `calc(50% + ${visualPos}%)`,
                    }}
                  >
                    <div
                      className={`relative -translate-x-1/2 w-4 h-7 rounded-md border shadow-sm transition-all flex items-center justify-center ${
                        isSliderActive
                          ? "bg-foreground border-foreground scale-105"
                          : "bg-background border-foreground/30 hover:border-foreground/50"
                      }`}
                    >
                      {/* Líneas de grip */}
                      <div className="flex gap-px">
                        <div className={`w-px h-3 rounded-full ${isSliderActive ? "bg-background/50" : "bg-foreground/30"}`} />
                        <div className={`w-px h-3 rounded-full ${isSliderActive ? "bg-background/50" : "bg-foreground/30"}`} />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="flex justify-center text-[11px] text-muted-foreground">
              <span>Arrastra, scroll o flechas ← → (±5%) · Shift para precisión (±1%)</span>
            </div>
          </div>

          {/* Precios Principal y Alternativo */}
          <div className="grid grid-cols-2 gap-4">
            {/* Precio Venta Principal */}
            <div className="space-y-2">
              <Label>Precio Venta</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm z-10">
                  Bs.
                </span>
                <EditableField
                  value={formData.salePrice}
                  onSubmit={(val) =>
                    handleSalesPriceChange(
                      typeof val === "number"
                        ? val
                        : parseFloat(val.toString()) || 0
                    )
                  }
                  type="number"
                  formatter={(val) =>
                    typeof val === "number"
                      ? val.toFixed(2)
                      : parseFloat(val.toString()).toFixed(2)
                  }
                  numberProps={{ min: 0, step: 0.01 }}
                  showEditIcon={false}
                  focusNextOnEnter={true}
                  inputClassName="pl-10 font-semibold"
                  autoSelect={true}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ajuste de Incremento %</Label>
              <div className="relative">
                <EditableField
                  value={formData.displaySalePriceIncrement}
                  onSubmit={(val) =>
                    handleSalePriceIncrementChange(
                      typeof val === "number"
                        ? val
                        : parseFloat(val.toString()) || 0
                    )
                  }
                  type="number"
                  formatter={(val) =>
                    typeof val === "number"
                      ? val.toFixed(1)
                      : parseFloat(val.toString()).toFixed(1)
                  }
                  numberProps={{ step: 0.1 }}
                  showEditIcon={false}
                  focusNextOnEnter={true}
                  inputClassName="pr-8 font-semibold"
                  autoSelect={true}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none z-10">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Precio Venta Alternativo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Precio Venta Alt.</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm z-10">
                  Bs.
                </span>
                <EditableField
                  value={formData.alternativeSalePrice}
                  onSubmit={(val) =>
                    handleAlternativeSalePriceChange(
                      typeof val === "number"
                        ? val
                        : parseFloat(val.toString()) || 0
                    )
                  }
                  type="number"
                  formatter={(val) =>
                    typeof val === "number"
                      ? val.toFixed(2)
                      : parseFloat(val.toString()).toFixed(2)
                  }
                  numberProps={{ min: 0, step: 0.01 }}
                  showEditIcon={false}
                  focusNextOnEnter={true}
                  inputClassName="pl-10"
                  autoSelect={true}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Incremento sobre precio %</Label>
              <div className="relative">
                <EditableField
                  value={formData.alternativeSalePriceIncrement}
                  onSubmit={(val) =>
                    handleAlternativeSalePriceIncrementChange(
                      typeof val === "number"
                        ? val
                        : parseFloat(val.toString()) || 0
                    )
                  }
                  type="number"
                  formatter={(val) =>
                    typeof val === "number"
                      ? val.toFixed(1)
                      : parseFloat(val.toString()).toFixed(1)
                  }
                  numberProps={{ step: 0.1 }}
                  showEditIcon={false}
                  focusNextOnEnter={true}
                  inputClassName="pr-8"
                  autoSelect={true}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none z-10">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Opciones de Asignación */}
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium text-foreground">
              Asignación de Precios
            </p>

            {branchType === "current" ? (
              <>
                <div
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() =>
                    handleAssignmentChange(
                      "assignToAllBalances",
                      !formData.assignToAllBalances
                    )
                  }
                >
                  <Checkbox
                    checked={formData.assignToAllBalances}
                    onCheckedChange={(checked) =>
                      handleAssignmentChange(
                        "assignToAllBalances",
                        checked as boolean
                      )
                    }
                  />
                  <div className="flex-1">
                    <Label className="text-sm font-medium cursor-pointer">
                      Aplicar a todos los lotes de la sucursal actual
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Actualizará todos los lotes/compras disponibles en esta
                      sucursal
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() =>
                    handleAssignmentChange(
                      "assignToAllBranches",
                      !formData.assignToAllBranches
                    )
                  }
                >
                  <Checkbox
                    checked={formData.assignToAllBranches}
                    onCheckedChange={(checked) =>
                      handleAssignmentChange(
                        "assignToAllBranches",
                        checked as boolean
                      )
                    }
                  />
                  <div className="flex-1">
                    <Label className="text-sm font-medium cursor-pointer">
                      Aplicar a todos los lotes de todas las sucursales
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Actualizará el inventario completo del producto en todas
                      las ubicaciones
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() =>
                    handleAssignmentChange(
                      "assignToAllBalances",
                      !formData.assignToAllBalances
                    )
                  }
                >
                  <Checkbox
                    checked={formData.assignToAllBalances}
                    onCheckedChange={(checked) =>
                      handleAssignmentChange(
                        "assignToAllBalances",
                        checked as boolean
                      )
                    }
                  />
                  <div className="flex-1">
                    <Label className="text-sm font-medium cursor-pointer">
                      Aplicar a todos los lotes de otras sucursales
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Actualizará los lotes en todas las sucursales excepto la
                      actual
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() =>
                    handleAssignmentChange(
                      "assignToAllBranches",
                      !formData.assignToAllBranches
                    )
                  }
                >
                  <Checkbox
                    checked={formData.assignToAllBranches}
                    onCheckedChange={(checked) =>
                      handleAssignmentChange(
                        "assignToAllBranches",
                        checked as boolean
                      )
                    }
                  />
                  <div className="flex-1">
                    <Label className="text-sm font-medium cursor-pointer">
                      Aplicar a todos los lotes de todas las sucursales
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Actualizará el inventario completo del producto en todas
                      las ubicaciones
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <Separator />
          {/* Info inicial */}
          {!hasAssignmentSelected && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-lg flex gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Los cambios solo se aplicarán al detalle seleccionado.
              </p>
            </div>
          )}

          {/* Info Alert cuando hay selección */}
          {hasAssignmentSelected && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-lg flex gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {branchType === "current"
                  ? formData.assignToAllBranches
                    ? `Se actualizarán ${allUniqueDetails.length} lote(s) en todas las sucursales`
                    : `Se actualizarán ${currentBranchDetails.length} lote(s) en la sucursal actual`
                  : formData.assignToAllBranches
                    ? `Se actualizarán ${allUniqueDetails.length} lote(s) en todas las sucursales`
                    : `Se actualizarán ${otherBranchesDetails.length} lote(s) en otras sucursales`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePurchaseDetailPricesFormModal;
