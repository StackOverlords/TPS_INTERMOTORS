import { Button } from "@/components/atoms/button";
import { Label } from "@/components/atoms/label";
import { Switch } from "@/components/atoms/switch";
import { BrushCleaning, CreditCard, FileText } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import type { CartMode } from "../types/cart.types";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import { useCartWithUtils } from "../hooks/useCartWithUtils";
import CartModeConversionModal from "./CartModeConversionModal";
import { useCallback, useRef, useState } from "react";
import ShortcutKey from "@/components/common/ShortcutKey";
import { useTabHotkeys } from "@/hooks/tabs/useTabHotkeys";

const modeConfig = {
  "sale-strict": {
    icon: CreditCard,
    label: "Proceder a la Venta",
    path: "/dashboard/create-sale",
  },
  "sale-permissive": {
    icon: CreditCard,
    label: "Proceder a la Venta",
    path: "/dashboard/create-sale",
  },
  quote: {
    icon: FileText,
    label: "Proceder a la Cotización",
    path: "/dashboard/create-quotation",
  },
} as const;

interface CartActionBarProps {
  onAction?: (path: string) => void;
  onAfterNavigate?: () => void;
  className?: string;
  showhClearBottom?: boolean;
}

export const CartActionBar = ({
  onAction,
  onAfterNavigate,
  className,
  showhClearBottom = false,
}: CartActionBarProps) => {
  const DEFAULT_SALE_MODE: CartMode = "sale-strict" as CartMode;

  const [showModeConversionModal, setShowModeConversionModal] = useState(false);
  const [targetModeForModal, setTargetModeForModal] =
    useState<CartMode>("sale-strict");
  const pendingNavigationPath = useRef<string | null>(null);

  const user = authSDK.getCurrentUser();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const navigate = useNavigate();
  const {
    items: cart,
    clearCart,
    mode,
    setCartMode,
    previewConversion,
    convertToSaleStrictWithToast,
  } = useCartWithUtils(user?.name || "", selectedBranchId ?? "");

  const config = modeConfig[mode] ?? modeConfig[DEFAULT_SALE_MODE];
  const { icon: Icon, label, path } = config;

  const handleNavigate = useCallback(
    (targetPath: string) => {
      if (onAction) {
        onAction(targetPath);
        return;
      }
      navigate(targetPath);
      onAfterNavigate?.();
    },
    [onAction, navigate, onAfterNavigate]
  );

  const handleManualModeChange = useCallback(
    (newMode: CartMode) => {
      if (mode === newMode) return;

      if (newMode === "sale-strict" && cart.length > 0) {
        const preview = previewConversion("sale-strict");
        if (preview.willHaveChanges) {
          setTargetModeForModal("sale-strict");
          pendingNavigationPath.current = null; // cambio manual, sin navegación pendiente
          setShowModeConversionModal(true);
        } else {
          setCartMode("sale-strict");
        }
      } else {
        setCartMode(newMode);
      }
    },
    [mode, cart.length, previewConversion, setCartMode]
  );

  const handleProceedAs = useCallback(
    (targetMode: CartMode) => {
      const targetPath = modeConfig[targetMode].path;

      if (mode === targetMode) {
        handleNavigate(targetPath);
        return;
      }

      if (targetMode === "sale-strict" && cart.length > 0) {
        const preview = previewConversion("sale-strict");
        if (preview.willHaveChanges) {
          setTargetModeForModal("sale-strict");
          pendingNavigationPath.current = targetPath; // navegación pendiente tras confirmar
          setShowModeConversionModal(true);
          return;
        }
      }

      setCartMode(targetMode);
      handleNavigate(targetPath);
    },
    [mode, cart.length, previewConversion, setCartMode, handleNavigate]
  );

  const handleModalConfirm = useCallback(
    (selectedMode: CartMode) => {
      // Ejecutar la conversión (lo que haría el modal internamente sin onConfirm)
      if (selectedMode === "sale-strict") {
        convertToSaleStrictWithToast();
      } else {
        setCartMode(selectedMode);
      }

      // Si hay navegación pendiente (viene de F10/F9), navegar
      if (pendingNavigationPath.current) {
        handleNavigate(pendingNavigationPath.current);
        pendingNavigationPath.current = null;
      }
    },
    [convertToSaleStrictWithToast, setCartMode, handleNavigate]
  );

  const handleCloseModal = useCallback(() => {
    setShowModeConversionModal(false);
    pendingNavigationPath.current = null; // limpiar si cancela
  }, []);

  // F10 → Venta, F9 → Cotización
  useTabHotkeys(
    "f10",
    (e) => {
      e.preventDefault();
      handleProceedAs("sale-strict");
    },
    { enableOnFormTags: true }
  );

  useTabHotkeys(
    "f9",
    (e) => {
      e.preventDefault();
      handleProceedAs("quote");
    },
    { enableOnFormTags: true }
  );

  return (
    <div className={cn("flex justify-between items-center gap-2", className)}>
      <div className="flex gap-2">
        {(mode === "sale-strict" || mode === "sale-permissive") && (
          <>
            <Button
              onClick={() => handleManualModeChange("sale-strict")}
              variant={mode === "sale-strict" ? "default" : "secondary"}
            >
              Estricta
            </Button>
            <Button
              onClick={() => handleManualModeChange("sale-permissive")}
              variant={mode === "sale-permissive" ? "default" : "secondary"}
            >
              Permisiva
            </Button>
          </>
        )}
        <div className="flex items-center gap-2 h-8 px-2 rounded-sm border-border border">
          <Switch
            id="cart-mode-switch"
            checked={mode === "quote"}
            onCheckedChange={(checked) =>
              handleManualModeChange(checked ? "quote" : DEFAULT_SALE_MODE)
            }
          />
          <Label htmlFor="cart-mode-switch">Cotización</Label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button className="cursor-pointer" onClick={() => handleNavigate(path)}>
          <Icon className="size-4" />
          {label}
          <ShortcutKey combo={mode === "quote" ? "F9" : "F10"} variant="dark" />
        </Button>
        {cart.length > 0 && showhClearBottom && (
          <Button
            className="cursor-pointer"
            size={"sm"}
            onClick={clearCart}
            variant={"destructive"}
          >
            <BrushCleaning />
            Limpiar
          </Button>
        )}
      </div>

      <CartModeConversionModal
        open={showModeConversionModal}
        onClose={handleCloseModal}
        targetMode={targetModeForModal}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};
