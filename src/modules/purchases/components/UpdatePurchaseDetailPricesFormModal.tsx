import { Button } from "@/components/atoms/button";
import { Checkbox } from "@/components/atoms/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { Label } from "@/components/atoms/label";
import { Slider } from "@/components/atoms/slider";
import { AlertCircle, X } from "lucide-react";
import { useUpdatePriceForm } from "../hooks/useUpdatePriceForm";
import { useUpdatePurchaseDetailPrices } from "../hooks/useUpdatePurchaseDetailPrices";
import { format } from "date-fns";
import type { ProductStock } from "@/modules/products/types/productStock";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useMemo } from "react";
import { EditableField } from "@/components/common/EditableField";

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
  } = useUpdatePriceForm(detail);

  const { mutate: updatePrices, isPending } = useUpdatePurchaseDetailPrices();

  // Obtener todos los detalles únicos (sin duplicados por ID)
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

  // Calcular qué detalles se van a actualizar
  const getDetailsToUpdate = (): number[] => {
    if (!detail) return [];

    if (formData.assignToAllBranches) {
      // Todos los detalles únicos de ambas tablas
      return allUniqueDetails.map((d) => d.id);
    }

    if (formData.assignToAllBalances) {
      // Solo detalles según el tipo de sucursal
      return branchType === "current"
        ? currentBranchDetails.map((d) => d.id)
        : otherBranchesDetails.map((d) => d.id);
    }

    // Solo el detalle seleccionado
    return [detail.id];
  };

  const handleSave = () => {
    if (!detail) return;

    const detailsIds = getDetailsToUpdate();

    updatePrices(
      {
        precio_venta: formData.salePrice,
        precio_venta_alt: formData.alternativeSalePrice,
        incremento_p_venta: formData.salePriceIncrement,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-lg">Actualizar Precios</DialogTitle>
              <div className="flex flex-col gap-2 mt-2">
                <p className="text-xs text-muted-foreground">
                  Última modificación:{" "}
                  {detail.fecha_actualizacion
                    ? format(
                        new Date(detail.fecha_actualizacion),
                        "dd/MM/yyyy HH:mm"
                      )
                    : "Sin modificaciones previas"}
                </p>
              </div>
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
          <div className="space-y-3 bg-muted/20 p-4 rounded-lg border border-border">
            <Label>Incremento de Precio</Label>
            <Slider
              value={[formData.incrementSlider]}
              onValueChange={handleIncrementSlider}
              min={-50}
              max={200}
              step={0.1}
              className="w-full"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">-50%</span>
              <span className="text-base font-semibold text-foreground">
                {formData.incrementSlider.toFixed(2)}%
              </span>
              <span className="text-xs text-muted-foreground">+200%</span>
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
              <Label>Incremento sobre costo %</Label>
              <div className="relative">
                <EditableField
                  value={formData.salePriceIncrement}
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
                {/* Asignar a todos los saldos de sucursal actual */}
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

                {/* Asignar a todas las sucursales */}
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
                {/* Asignar a todas las demás sucursales */}
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

                {/* Asignar a todas las sucursales */}
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

          {/* Info Alert */}
          {(formData.assignToAllBalances || formData.assignToAllBranches) && (
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
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-black hover:bg-black/90"
          >
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePurchaseDetailPricesFormModal;
