import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { Button } from "@/components/atoms/button";
import {
  AlertTriangle,
  Check,
  CircleCheck,
  Package,
  Trash2,
  TrendingDown,
  FileText,
  AlertCircle,
} from "lucide-react";
import { ScrollArea } from "@/components/atoms/scroll-area";
import { useCartWithUtils } from "../hooks/useCartWithUtils";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import { Badge } from "@/components/atoms/badge";
import type {
  CartMode,
  ConversionModalContext,
  ConversionPreview,
} from "../types/cart.types";
import { useEffect, useState } from "react";
import { Label } from "@/components/atoms/label";
import { RadioGroup, RadioGroupItem } from "@/components/atoms/radio-group";
import { useGoBack } from "@/hooks/useGoBack";

interface CartModeConversionModalProps {
  open: boolean;
  onClose: () => void;
  targetMode: CartMode;
  shouldGoBackOnClose?: boolean;
  onConfirm?: (selectedMode: CartMode) => void;

  context?: ConversionModalContext;
  previewData?: ConversionPreview | null;
  executeCloseOnConfirm?: boolean;
}

const CartModeConversionModal: React.FC<CartModeConversionModalProps> = ({
  open,
  onClose,
  targetMode: initialTargetMode,
  shouldGoBackOnClose = false,
  onConfirm,
  context = "conversion",
  previewData: externalPreview,
  executeCloseOnConfirm = true,
}) => {
  const user = authSDK.getCurrentUser();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const handleGoBack = useGoBack("/dashboard/products");

  const {
    previewConversion,
    convertToSaleStrictWithToast,
    setCartMode,
    clearCart,
  } = useCartWithUtils(user?.name || "", selectedBranchId ?? "");

  const [selectedMode, setSelectedMode] = useState<
    "sale-strict" | "sale-permissive"
  >(initialTargetMode === "sale-strict" ? "sale-strict" : "sale-permissive");

  // USAR PREVIEW EXTERNO O CALCULAR INTERNO
  const preview = externalPreview || previewConversion(selectedMode);
  const willHaveChanges =
    selectedMode === "sale-strict" ? preview.willHaveChanges : false;

  useEffect(() => {
    if (open) {
      setSelectedMode(
        initialTargetMode === "sale-strict" ? "sale-strict" : "sale-permissive"
      );
    }
  }, [open, initialTargetMode]);

  // TEXTOS DINÁMICOS SEGÚN CONTEXTO
  const titles = {
    conversion: "Configurar Modo de Venta",
    import: "Importar Cotización",
  };

  const descriptions = {
    conversion:
      "Selecciona el modo de venta y revisa los cambios que se aplicarán al carrito",
    import: "Revisa los productos que se importarán de la cotización",
  };

  const icons = {
    conversion: Package,
    import: FileText,
  };

  const modeLabels = {
    conversion: {
      strict: {
        title: "Venta Estricta",
        description:
          "Valida stock estrictamente. No permite productos sin stock ni exceder cantidades.",
      },
      permissive: {
        title: "Venta Permisiva",
        description:
          "Permite productos sin stock y cantidades que excedan el inventario (con advertencias).",
      },
    },
    import: {
      strict: {
        title: "Importar con Validación",
        description:
          "Solo importa productos con stock disponible. Ajusta cantidades si exceden el stock.",
      },
      permissive: {
        title: "Importar Todo",
        description:
          "Importa todos los productos de la cotización, incluso sin stock (con advertencias).",
      },
    },
  };

  const alerts = {
    conversion: {
      strict:
        "Al convertir a Venta Estricta, se validará el stock y se realizarán ajustes automáticos en el carrito.",
      permissive:
        "El modo permisivo permite agregar productos sin validación estricta de stock. Recibirás advertencias pero podrás continuar.",
    },
    import: {
      strict:
        "Al importar con validación, solo se agregarán productos con stock disponible y cantidades ajustadas.",
      permissive:
        "Se importarán todos los productos de la cotización, incluso los que no tienen stock.",
    },
  };

  const sections = {
    conversion: {
      kept: "Confirmados",
      removed: "Serán Removidos",
      adjusted: "Serán Ajustados",
    },
    import: {
      kept: "Se Importarán",
      removed: "No se Importarán",
      adjusted: "Se Ajustarán",
    },
  };

  const noChangesMessage = {
    conversion:
      "Todos los productos tienen stock suficiente. No se realizarán cambios.",
    import:
      "Todos los productos de la cotización se pueden importar sin ajustes.",
  };

  const buttons = {
    conversion: {
      clear: "Limpiar y empezar nuevo",
      confirm: "Confirmar y continuar",
    },
    import: {
      clear: "Cancelar importación",
      confirm: "Confirmar Importación",
    },
  };

  const handleConvert = () => {
    if (onConfirm) {
      onConfirm(selectedMode);
    } else {
      // Modo conversion: comportamiento por defecto
      if (selectedMode === "sale-strict") {
        convertToSaleStrictWithToast();
      } else {
        setCartMode("sale-permissive");
      }
    }
    if (executeCloseOnConfirm) {
      onClose();
    }
  };

  const handleClearAndStart = () => {
    if (context === "import") {
      // En modo import, solo cancelar
      onClose();
    } else {
      // En modo conversion, limpiar carrito
      clearCart();
      setCartMode(selectedMode);
      onClose();
    }
  };

  const handleCancel = () => {
    if (shouldGoBackOnClose) {
      handleGoBack();
    }
    onClose();
  };

  const hasRemoved = preview.removedCount > 0;
  const hasAdjusted = preview.adjustedCount > 0;
  const hasKept = preview.keptCount > 0;

  const Icon = icons[context];
  const currentModeLabels = modeLabels[context];
  const currentAlerts = alerts[context];
  const currentSections = sections[context];

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] h-full flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {titles[context]}
          </DialogTitle>
          <DialogDescription>{descriptions[context]}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 h-full flex flex-col overflow-hidden">
          {/* Selector de Modo */}
          <div className="flex-shrink-0 space-y-2">
            <RadioGroup
              value={selectedMode}
              onValueChange={(value) =>
                setSelectedMode(value as "sale-strict" | "sale-permissive")
              }
              className="grid-cols-2"
            >
              <div className="flex items-center justify-start space-x-2 rounded-lg border border-border p-2 cursor-pointer hover:bg-accent transition-colors">
                <RadioGroupItem value="sale-strict" id="strict" />
                <Label htmlFor="strict" className="flex-1 cursor-pointer">
                  <span className="font-medium">
                    {currentModeLabels.strict.title}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    {currentModeLabels.strict.description}
                  </div>
                </Label>
              </div>

              <div className="flex items-center justify-start space-x-2 rounded-lg border border-border p-2 cursor-pointer hover:bg-accent transition-colors">
                <RadioGroupItem value="sale-permissive" id="permissive" />
                <Label htmlFor="permissive" className="flex-1 cursor-pointer">
                  <span className="font-medium">
                    {currentModeLabels.permissive.title}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    {currentModeLabels.permissive.description}
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* Alerta según modo y contexto */}
            {selectedMode === "sale-strict" && willHaveChanges && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800">
                <AlertTriangle className="size-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-900 dark:text-blue-200">
                  {currentAlerts.strict}
                </div>
              </div>
            )}

            {selectedMode === "sale-permissive" && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/50 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-900 dark:text-amber-200">
                  {currentAlerts.permissive}
                </div>
              </div>
            )}
          </div>

          {/* Preview de Cambios (solo si hay cambios y modo strict seleccionado) */}
          {selectedMode === "sale-strict" && willHaveChanges && (
            <div className="flex-1 min-h-0">
              <ScrollArea className="pr-4 h-full">
                <div className="space-y-2">
                  {/* Badges de resumen */}
                  <div className="flex flex-wrap gap-2">
                    {hasRemoved && (
                      <Badge
                        variant="danger"
                        className="gap-1 border border-red-300 dark:border-red-800 py-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {preview.removedCount} sin stock
                      </Badge>
                    )}
                    {hasAdjusted && (
                      <Badge
                        variant="warning"
                        className="gap-1 border border-amber-300 dark:border-amber-800 py-1"
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        {preview.adjustedCount} ajustados
                      </Badge>
                    )}
                    {hasKept && (
                      <Badge
                        variant="success"
                        className="gap-1 border border-emerald-300 dark:border-emerald-800 py-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {preview.keptCount} confirmados
                      </Badge>
                    )}
                  </div>

                  {/* Items que se mantienen/importan */}
                  {hasKept && (
                    <div className="border-b border-border pb-2">
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wide mb-2 flex items-center gap-2">
                        <CircleCheck className="w-4 h-4 text-emerald-400" />
                        {currentSections.kept} ({preview.keptCount})
                      </h3>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {preview.itemsToKeep.map((item) => (
                          <div
                            key={item.product.id}
                            className="text-sm flex justify-between items-start gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {item.product.descripcion}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.product.codigo_oem}
                              </p>
                            </div>
                            <span className="inline-block bg-emerald-100 dark:bg-emerald-400 text-emerald-700 dark:text-emerald-950 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                              {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items que se remueven/no se importan */}
                  {hasRemoved && (
                    <div className="border-b border-border pb-2">
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wide mb-2 flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        {currentSections.removed} ({preview.removedCount})
                      </h3>
                      <div className="space-y-2">
                        {preview.itemsToRemove.map((item) => (
                          <div
                            key={item.product.id}
                            className="text-sm flex justify-between items-start gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {item.product.descripcion}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.product.codigo_oem} • Sin stock
                              </p>
                            </div>
                            <span className="inline-block bg-red-100 dark:bg-red-300 text-red-700 dark:text-red-950 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                              {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items que se ajustan */}
                  {hasAdjusted && (
                    <div>
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wide mb-2 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        {currentSections.adjusted} ({preview.adjustedCount})
                      </h3>
                      <div className="space-y-2">
                        {preview.itemsToAdjust.map((adjustment) => (
                          <div
                            key={adjustment.productId}
                            className="text-sm flex justify-between items-start gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {adjustment.productName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {context === "import"
                                  ? `En cotización: ${adjustment.originalQuantity} → Stock disponible: ${adjustment.adjustedQuantity}`
                                  : `Cantidad excede stock disponible: ${adjustment.adjustedQuantity}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className="inline-block bg-red-100 dark:bg-red-300 text-red-700 dark:text-red-950 px-2 py-0.5 rounded text-xs font-semibold">
                                {adjustment.originalQuantity}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="inline-block bg-green-100 dark:bg-emerald-400 text-green-700 dark:text-emerald-950 px-2 py-0.5 rounded text-xs font-semibold">
                                {adjustment.adjustedQuantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Mensaje cuando no hay cambios */}
          {selectedMode === "sale-strict" && !willHaveChanges && (
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/50 rounded-lg border border-green-200 dark:border-green-800">
              <Check className="size-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-green-900 dark:text-green-200">
                {noChangesMessage[context]}
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClearAndStart}
            className="flex-1"
          >
            {buttons[context].clear}
          </Button>
          <Button onClick={handleConvert} className="flex-1">
            {buttons[context].confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CartModeConversionModal;
