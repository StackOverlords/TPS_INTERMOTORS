/**
 * TransferRequestCard
 *
 * Renders inside MessageBubble when message.referencia_tipo === "transfer_request".
 * - Fetches full request details via useTransferRequestById
 * - Shows product summary, branch-to-branch direction, estado badge
 * - Action buttons ("Importar" / "Enviar directo") are visible ONLY to the
 *   destinatario (currentUserId === request.usuario_destinatario_id)
 * - Terminal estados (FULFILLED, PARTIAL, CANCELLED) hide action buttons
 * - "imported" is transitional: shows "Retomar importación" + "Enviar directo"
 * - "in_progress": transfer created but not yet confirmed — shows link
 * - "Enviar directo" shows a confirm modal, then a result modal with navigation
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Loader2, ArrowRight, Package, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { showErrorToast, showWarningToast } from "@/hooks/use-toast-enhanced";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import { Skeleton } from "@/components/atoms/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/atoms/dialog";
import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { usePermissionCheck } from "@/hooks/usePermissionCheck";
import type { TransferRequestEstado, FulfillDirectResult, FulfilledItem, SkippedItem } from "@/modules/transfers/types/transferRequest.types";
import { useTransferRequestById } from "@/modules/transfers/hooks/useTransferRequestById";
import { useImportTransferRequest } from "@/modules/transfers/hooks/useImportTransferRequest";
import { useFulfillTransferRequest } from "@/modules/transfers/hooks/useFulfillTransferRequest";
import { transferRequestService } from "@/modules/transfers/services/transferRequestService";
import { transferService } from "@/modules/transfers/services/transfer.service";
import { TRANSFER_QUERY_KEYS } from "@/modules/transfers/constants/transferQueryKeys";
import { useChatUIStore } from "@/modules/messaging/stores/ChatUiStore";

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO BADGE
// ─────────────────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<
  TransferRequestEstado,
  { label: string; variant: "warning" | "success" | "accent" | "info" | "danger" }
> = {
  pending:     { label: "Pendiente",   variant: "warning" },
  fulfilled:   { label: "Completado",  variant: "success" },
  partial:     { label: "Parcial",     variant: "accent" },
  imported:    { label: "Importado",   variant: "info" },
  in_progress: { label: "En proceso",  variant: "info" },
  cancelled:   { label: "Cancelado",   variant: "danger" },
};

// States where the recipient can no longer take direct action — show transfer link instead
const TERMINAL_ESTADOS: TransferRequestEstado[] = ["fulfilled", "partial", "cancelled", "in_progress"];

// States where the recipient still needs to act
const ACTIONABLE_ESTADOS: TransferRequestEstado[] = ["pending", "imported"];

function EstadoBadge({ estado }: { estado: TransferRequestEstado }) {
  const config = ESTADO_CONFIG[estado] ?? { label: estado, variant: "warning" as const };
  return (
    <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
      {config.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FULFILL RESULT MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface FulfillResultModalProps {
  open: boolean;
  onClose: () => void;
  onGoToTransfer?: () => void;
  result: FulfillDirectResult;
}

function FulfillResultModal({ open, onClose, onGoToTransfer, result }: FulfillResultModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {result.request_estado === "fulfilled" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Package className="h-4 w-4 text-amber-500" />
            )}
            Resultado del envío
          </DialogTitle>
          <DialogDescription>
            Estado:{" "}
            <EstadoBadge estado={result.request_estado} />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {result.fulfilled_items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
                Despachados ({result.fulfilled_items.length})
              </p>
              <div className="space-y-1">
                {result.fulfilled_items.map((item) => (
                  <div
                    key={item.producto_id}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                      item.was_partial
                        ? "bg-amber-50 dark:bg-amber-500/10"
                        : "bg-emerald-50 dark:bg-emerald-500/10"
                    }`}
                  >
                    <div>
                      <span className="text-foreground">{item.producto_descripcion}</span>
                      {item.was_partial && (
                        <span className="block text-[10px] text-amber-600 dark:text-amber-400">
                          Stock insuficiente — enviado parcialmente
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-semibold ml-2 ${
                        item.was_partial
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {item.was_partial
                        ? `×${item.cantidad} de ${item.cantidad_solicitada}`
                        : `×${item.cantidad}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.skipped_items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5">
                Sin stock — no despachados ({result.skipped_items.length})
              </p>
              <div className="space-y-1">
                {result.skipped_items.map((item) => (
                  <div
                    key={item.producto_id}
                    className="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-500/10 px-2.5 py-1.5 text-xs"
                  >
                    <span className="text-foreground">{item.producto_descripcion}</span>
                    <span className="font-semibold text-red-700 dark:text-red-300 ml-2">
                      ×{item.cantidad_solicitada}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {onGoToTransfer && result.transfer_id && (
            <Button size="sm" onClick={onGoToTransfer} className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Ver transferencia
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM FULFILL MODAL
// ─────────────────────────────────────────────────────────────────────────────

type ProcessStep = "idle" | "creating" | "accepting" | "accept_failed";

function StepRow({
  label,
  status,
}: {
  label: string;
  status: "pending" | "loading" | "success" | "error";
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {status === "loading" && (
        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
      )}
      {status === "success" && (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
      )}
      {status === "error" && (
        <XCircle className="h-4 w-4 text-destructive shrink-0" />
      )}
      {status === "pending" && (
        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
      )}
      <span
        className={cn(
          "text-sm",
          status === "success" && "text-emerald-600 dark:text-emerald-400",
          status === "error" && "text-destructive",
          status === "pending" && "text-muted-foreground",
          status === "loading" && "text-foreground font-medium",
        )}
      >
        {label}
      </span>
    </div>
  );
}

interface ConfirmFulfillModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoadingPreview: boolean;
  fulfilledItems: FulfilledItem[];
  skippedItems: SkippedItem[];
  processStep: ProcessStep;
  isRetryingAccept: boolean;
  onRetryAccept: () => void;
  onSkipAccept: () => void;
}

function ConfirmFulfillModal({
  open,
  onClose,
  onConfirm,
  isLoadingPreview,
  fulfilledItems,
  skippedItems,
  processStep,
  isRetryingAccept,
  onRetryAccept,
  onSkipAccept,
}: ConfirmFulfillModalProps) {
  const isProcessing = processStep === "creating" || processStep === "accepting";

  const handleOpenChange = (v: boolean) => {
    if (v) return;
    if (isProcessing) return;
    if (processStep === "accept_failed") { onSkipAccept(); return; }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle>Enviar directo</DialogTitle>
          {processStep === "idle" && (
            <DialogDescription>
              Se creará una transferencia con los productos disponibles en tu
              sucursal y se recepcionará automáticamente. Esta acción no se puede deshacer.
            </DialogDescription>
          )}
        </DialogHeader>

        {processStep !== "idle" ? (
          <div className="py-2 divide-y divide-border">
            <StepRow
              label={
                processStep === "creating"
                  ? "Creando transferencia..."
                  : "Transferencia creada"
              }
              status={processStep === "creating" ? "loading" : "success"}
            />
            <StepRow
              label={
                processStep === "accepting" || isRetryingAccept
                  ? "Recepcionando..."
                  : processStep === "accept_failed"
                  ? "Error al recepcionar"
                  : "Recepcionando"
              }
              status={
                processStep === "accepting" || isRetryingAccept
                  ? "loading"
                  : processStep === "accept_failed"
                  ? "error"
                  : "pending"
              }
            />
          </div>
        ) : isLoadingPreview ? (
          <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando stock…
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {fulfilledItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
                  Se enviarán ({fulfilledItems.length})
                </p>
                <div className="space-y-1">
                  {fulfilledItems.map((item) => (
                    <div
                      key={item.producto_id}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                        item.was_partial
                          ? "bg-amber-50 dark:bg-amber-500/10"
                          : "bg-emerald-50 dark:bg-emerald-500/10"
                      }`}
                    >
                      <div>
                        <span className="text-foreground">{item.producto_descripcion}</span>
                        {item.was_partial && (
                          <span className="block text-[10px] text-amber-600 dark:text-amber-400">
                            Stock insuficiente — se ajustará la cantidad
                          </span>
                        )}
                      </div>
                      <span className={`font-semibold ml-2 ${item.was_partial ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                        {item.was_partial
                          ? `×${item.cantidad} de ${item.cantidad_solicitada}`
                          : `×${item.cantidad}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {skippedItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5">
                  Sin stock — se omitirán ({skippedItems.length})
                </p>
                <div className="space-y-1">
                  {skippedItems.map((item) => (
                    <div
                      key={item.producto_id}
                      className="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-500/10 px-2.5 py-1.5 text-xs"
                    >
                      <span className="text-foreground">{item.producto_descripcion}</span>
                      <span className="font-semibold text-red-700 dark:text-red-300 ml-2">
                        ×{item.cantidad_solicitada}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {fulfilledItems.length === 0 && skippedItems.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Sin productos para enviar.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {processStep === "idle" && (
            <>
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={onConfirm}
                disabled={isLoadingPreview || fulfilledItems.length === 0}
              >
                Confirmar envío
              </Button>
            </>
          )}
          {processStep === "accept_failed" && (
            <>
              <Button variant="outline" size="sm" onClick={onSkipAccept}>
                Cerrar sin recepcionar
              </Button>
              <Button size="sm" onClick={onRetryAccept} disabled={isRetryingAccept}>
                {isRetryingAccept ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Reintentando…
                  </>
                ) : (
                  "Reintentar recepción"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  requestId: number;
  currentUserId: string | number | undefined;
  isMine?: boolean;
}

export function TransferRequestCard({ requestId, currentUserId, isMine = false }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const closeChat = useChatUIStore((s) => s.close);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: request, isLoading } = useTransferRequestById(requestId);

  // ── Permission checks (always called — hooks must not be conditional) ────
  const { isAuthorized: canFulfill } = usePermissionCheck({
    permission: PERMISSIONS.TRA.REQUEST_FULFILL,
    roles: ["Super Admin", "Administrador", "Vendedor"],
  });
  const { isAuthorized: canImport } = usePermissionCheck({
    permission: PERMISSIONS.TRA.REQUEST_IMPORT,
    roles: ["Super Admin", "Administrador", "Vendedor"],
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const fulfill = useFulfillTransferRequest(requestId);
  const importMutation = useImportTransferRequest(requestId);

  // ── Modal states ──────────────────────────────────────────────────────────
  const [confirmFulfillOpen, setConfirmFulfillOpen] = useState(false);
  const [fulfillResult, setFulfillResult] = useState<FulfillDirectResult | null>(null);
  const [preview, setPreview] = useState<{ fulfilled_items: FulfilledItem[]; skipped_items: SkippedItem[] } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [processStep, setProcessStep] = useState<ProcessStep>("idle");
  const [pendingTransferId, setPendingTransferId] = useState<number | null>(null);
  const [pendingFulfillResult, setPendingFulfillResult] = useState<FulfillDirectResult | null>(null);
  const [isRetryingAccept, setIsRetryingAccept] = useState(false);

  // ── Derived state ─────────────────────────────────────────────────────────
  const isRecipient =
    !!request && String(request.usuario_destinatario_id) === String(currentUserId);
  const isTerminal = !!request && TERMINAL_ESTADOS.includes(request.estado);
  const isActionable = !!request && ACTIONABLE_ESTADOS.includes(request.estado);
  const isImportedState = request?.estado === "imported";
  // Recipient still needs to act (pending or stuck at imported with no transfer yet)
  const showActions = isRecipient && isActionable;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const finishFulfill = (result: FulfillDirectResult) => {
    setProcessStep("idle");
    setPendingTransferId(null);
    setPendingFulfillResult(null);
    setConfirmFulfillOpen(false);
    setFulfillResult(result);
  };

  const handleFulfillConfirm = async () => {
    try {
      setProcessStep("creating");
      const result = await fulfill.mutateAsync();

      if (result.transfer_id) {
        setProcessStep("accepting");
        setPendingTransferId(result.transfer_id);
        setPendingFulfillResult(result);
        try {
          await transferService.accept(result.transfer_id);
          queryClient.invalidateQueries({ queryKey: TRANSFER_QUERY_KEYS.lists() });
          finishFulfill(result);
        } catch {
          setProcessStep("accept_failed");
        }
      } else {
        finishFulfill(result);
      }
    } catch {
      setProcessStep("idle");
      setConfirmFulfillOpen(false);
    }
  };

  const handleRetryAccept = async () => {
    if (!pendingTransferId || !pendingFulfillResult) return;
    setIsRetryingAccept(true);
    try {
      await transferService.accept(pendingTransferId);
      queryClient.invalidateQueries({ queryKey: TRANSFER_QUERY_KEYS.lists() });
      setIsRetryingAccept(false);
      finishFulfill(pendingFulfillResult);
    } catch {
      setIsRetryingAccept(false);
    }
  };

  const handleSkipAccept = () => {
    const result = pendingFulfillResult;
    setProcessStep("idle");
    setPendingTransferId(null);
    setPendingFulfillResult(null);
    setConfirmFulfillOpen(false);
    if (result) setFulfillResult(result);
  };

  const handleImport = async () => {
    try {
      const result = await importMutation.mutateAsync();

      const withStock = result.items.filter((i) => i.lots && i.lots.length > 0);
      const withoutStock = result.items.filter((i) => !i.lots || i.lots.length === 0);

      if (withStock.length === 0) {
        showErrorToast({
          title: "Sin stock disponible",
          description: "Ningún producto de la solicitud tiene stock en tu sucursal. No se puede crear la transferencia.",
          duration: 5000,
        });
        return;
      }

      if (withoutStock.length > 0) {
        const names = withoutStock
          .map((i) => i.product?.descripcion ?? `Producto #${i.producto_id}`)
          .join(", ");
        showWarningToast({
          title: `${withoutStock.length} producto${withoutStock.length > 1 ? "s" : ""} sin stock`,
          description: `Se omitirán: ${names}`,
          duration: 6000,
        });
      }

      closeChat();
      navigate("/dashboard/create-transfer", {
        state: { transferRequestPrefill: result },
      });
    } catch {
      showErrorToast({
        title: "Error al importar",
        description: "No se pudo importar la solicitud. Intentá de nuevo.",
        duration: 4000,
      });
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cn(
        "mt-2 rounded-xl border w-full overflow-hidden px-3 py-2.5 space-y-2",
        isMine
          ? "border-border/40 bg-muted shadow-[0_4px_16px_rgba(0,0,0,0.2)] ring-1 ring-black/[0.07]"
          : "border-border bg-card shadow-md"
      )}>
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-2.5 w-1/2" />
        <Skeleton className="h-2.5 w-3/4" />
      </div>
    );
  }

  if (!request) return null;

  const visibleItems = request.items.slice(0, 3);

  return (
    <>
      <div
        className={cn(
          "mt-2 rounded-xl border w-full overflow-hidden px-3 py-2.5 space-y-2",
          isMine
            ? "border-border/40 bg-muted shadow-[0_4px_16px_rgba(0,0,0,0.2)] ring-1 ring-black/[0.07]"
            : "border-border bg-card shadow-md"
        )}
      >
        {/* Header: icono + título + badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Package className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span className="text-[11px] font-semibold truncate text-foreground">
              Solicitud de transferencia
            </span>
          </div>
          <EstadoBadge estado={request.estado} />
        </div>

        {/* Branch direction */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="truncate">{request.sucursal_solicitante_nombre}</span>
          <ArrowRight className="h-3 w-3 shrink-0 flex-none" />
          <span className="truncate">{request.sucursal_destinataria_nombre}</span>
        </div>

        {/* Item list con separadores gradient entre items */}
        {visibleItems.length > 0 && (
          <div>
            {visibleItems.map((item, idx) => (
              <div key={item.id}>
                <div className="flex items-center justify-between text-[10px] py-1">
                  <span className="truncate mr-2 text-muted-foreground">
                    {item.producto_descripcion}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-foreground">
                    ×{item.cantidad_solicitada}
                  </span>
                </div>
                {idx < visibleItems.length - 1 && (
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                )}
              </div>
            ))}
            {request.items.length > 3 && (
              <p className="text-[10px] italic text-muted-foreground/70 pt-1">
                +{request.items.length - 3} más…
              </p>
            )}
          </div>
        )}

        {/* Estado terminal: mensaje + link */}
        {isTerminal && (
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              {request.estado === "in_progress" ? (
                <>
                  <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                  <span>Esperando confirmación de envío</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>Solicitud ya procesada</span>
                </>
              )}
            </div>
            {request.product_transfer_id != null ? (
              <Button
                size="sm"
                variant="link"
                className="h-7 w-full text-[11px] px-2 gap-1.5"
                onClick={() => navigate(`/dashboard/transfers/${request.product_transfer_id}`)}
              >
                <ExternalLink className="h-3 w-3" />
                Ver transferencia
              </Button>
            ) : request.estado !== "cancelled" ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-full text-[11px] px-2 gap-1.5 text-muted-foreground"
                onClick={() => navigate("/dashboard/transfers")}
              >
                <ExternalLink className="h-3 w-3" />
                Ver transferencias
              </Button>
            ) : null}
          </div>
        )}

        {/* Botones de acción */}
        {showActions && (
          <div className="flex gap-1.5 pt-0.5">
            {canImport && (
              <Button
                size="sm"
                variant="secondary"
                className="h-7 flex-1 text-[11px] px-2"
                disabled={importMutation.isPending}
                onClick={() => void handleImport()}
              >
                {importMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isImportedState ? (
                  "Retomar"
                ) : (
                  "Importar"
                )}
              </Button>
            )}
            {canFulfill && (
              <Button
                size="sm"
                variant="default"
                className="h-7 flex-1 text-[11px] px-2"
                disabled={fulfill.isPending || isLoadingPreview}
                onClick={() => {
                  setPreview(null);
                  setIsLoadingPreview(true);
                  setConfirmFulfillOpen(true);
                  void transferRequestService.previewFulfillDirect(requestId).then((data) => {
                    setPreview(data);
                    setIsLoadingPreview(false);
                  }).catch(() => {
                    setConfirmFulfillOpen(false);
                    setIsLoadingPreview(false);
                  });
                }}
              >
                {isLoadingPreview ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Enviar directo"
                )}
              </Button>
            )}
          </div>
        )}

        {/* Sin permisos */}
        {isRecipient && isActionable && !canImport && !canFulfill && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <XCircle className="h-3 w-3 shrink-0 opacity-60" />
            <span>Sin permisos para actuar</span>
          </div>
        )}
      </div>

      {/* Confirm fulfill modal */}
      <ConfirmFulfillModal
        open={confirmFulfillOpen}
        onClose={() => { setConfirmFulfillOpen(false); setPreview(null); setProcessStep("idle"); }}
        onConfirm={() => void handleFulfillConfirm()}
        isLoadingPreview={isLoadingPreview}
        fulfilledItems={preview?.fulfilled_items ?? []}
        skippedItems={preview?.skipped_items ?? []}
        processStep={processStep}
        isRetryingAccept={isRetryingAccept}
        onRetryAccept={() => void handleRetryAccept()}
        onSkipAccept={handleSkipAccept}
      />

      {/* Fulfill result modal */}
      {fulfillResult && (
        <FulfillResultModal
          open={!!fulfillResult}
          onClose={() => setFulfillResult(null)}
          onGoToTransfer={
            fulfillResult.transfer_id
              ? () => {
                  const tid = fulfillResult.transfer_id;
                  setFulfillResult(null);
                  navigate(`/dashboard/transfers/${tid}`);
                }
              : undefined
          }
          result={fulfillResult}
        />
      )}
    </>
  );
}
