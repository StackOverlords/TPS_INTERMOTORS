/**
 * TransferRequestCard
 *
 * Renders inside MessageBubble when message.referencia_tipo === "transfer_request".
 * - Fetches full request details via useTransferRequestById
 * - Shows product summary, branch-to-branch direction, estado badge
 * - Action buttons ("Importar" / "Enviar directo") are visible ONLY to the
 *   destinatario (currentUserId === request.usuario_destinatario_id)
 * - Terminal estados (FULFILLED, IMPORTED, CANCELLED) hide action buttons
 * - "Enviar directo" shows a confirm modal, then a result modal
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, ArrowRight, Package, CheckCircle2, XCircle } from "lucide-react";
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
import type { TransferRequestEstado, FulfillDirectResult } from "@/modules/transfers/types/transferRequest.types";
import { useTransferRequestById } from "@/modules/transfers/hooks/useTransferRequestById";
import { useImportTransferRequest } from "@/modules/transfers/hooks/useImportTransferRequest";
import { useFulfillTransferRequest } from "@/modules/transfers/hooks/useFulfillTransferRequest";

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO BADGE
// ─────────────────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<
  TransferRequestEstado,
  { label: string; variant: "warning" | "success" | "accent" | "info" | "danger" }
> = {
  pending:   { label: "Pendiente",  variant: "warning" },
  fulfilled: { label: "Completado", variant: "success" },
  partial:   { label: "Parcial",    variant: "accent" },
  imported:  { label: "Importado",  variant: "info" },
  cancelled: { label: "Cancelado",  variant: "danger" },
};

const TERMINAL_ESTADOS: TransferRequestEstado[] = ["fulfilled", "imported", "cancelled"];

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
  result: FulfillDirectResult;
}

function FulfillResultModal({ open, onClose, result }: FulfillResultModalProps) {
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
                    className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1.5 text-xs"
                  >
                    <span className="text-foreground">{item.producto_descripcion}</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300 ml-2">
                      ×{item.cantidad}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.skipped_items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5">
                No despachados ({result.skipped_items.length})
              </p>
              <div className="space-y-1">
                {result.skipped_items.map((item) => (
                  <div
                    key={item.producto_id}
                    className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5 text-xs"
                  >
                    <div>
                      <span className="text-foreground">{item.producto_descripcion}</span>
                      <span className="block text-[10px] text-muted-foreground">
                        {item.reason === "NO_STOCK" || item.reason === "INSUFFICIENT_STOCK"
                          ? "Sin stock disponible"
                          : "Producto inactivo"}
                      </span>
                    </div>
                    <span className="font-semibold text-amber-700 dark:text-amber-300 ml-2">
                      ×{item.cantidad_solicitada}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM FULFILL MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface ConfirmFulfillModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function ConfirmFulfillModal({
  open,
  onClose,
  onConfirm,
  isPending,
}: ConfirmFulfillModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isPending && onClose()}>
      <DialogContent className="max-w-sm z-[9999]">
        <DialogHeader>
          <DialogTitle>Enviar directo</DialogTitle>
          <DialogDescription>
            Se creará una transferencia con los productos disponibles en tu
            sucursal. Los productos sin stock serán omitidos. Esta acción no
            se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Enviando…
              </>
            ) : (
              "Confirmar envío"
            )}
          </Button>
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
  /** Whether the bubble itself is mine (affects subtle styling) */
  isMine?: boolean;
}

export function TransferRequestCard({ requestId, currentUserId, isMine = false }: Props) {
  const navigate = useNavigate();

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

  // ── Derived state ─────────────────────────────────────────────────────────
  const isRecipient =
    !!request && String(request.usuario_destinatario_id) === String(currentUserId);
  const isTerminal = !!request && TERMINAL_ESTADOS.includes(request.estado);
  const showActions = isRecipient && !isTerminal;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFulfillConfirm = async () => {
    try {
      const result = await fulfill.mutateAsync();
      setConfirmFulfillOpen(false);
      setFulfillResult(result);
    } catch {
      setConfirmFulfillOpen(false);
    }
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
      <div className="mt-1.5 rounded-xl border border-border/50 bg-card/50 p-3 space-y-2 min-w-[220px]">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    );
  }

  if (!request) return null;

  const itemCount = request.items.length;

  return (
    <>
      <div
        className={cn(
          "mt-1.5 rounded-xl border px-3 py-2.5 min-w-[220px] max-w-[300px] space-y-2",
          isMine
            ? "border-background/15 bg-background/20"
            : "border-border/50 bg-card/50"
        )}
      >
        {/* Header row: icon + title + estado */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-primary/70 shrink-0" />
            <span className={cn("text-[11px] font-semibold", isMine ? "text-primary-foreground" : "text-foreground")}>
              Solicitud de transferencia
            </span>
          </div>
          <EstadoBadge estado={request.estado} />
        </div>

        {/* Branch direction */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="truncate max-w-[80px]">{request.sucursal_solicitante_nombre}</span>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[80px]">{request.sucursal_destinataria_nombre}</span>
        </div>

        {/* Product summary */}
        <div
          className={cn(
            "text-[11px]",
            isMine ? "text-primary-foreground/80" : "text-muted-foreground"
          )}
        >
          {itemCount === 1
            ? `1 producto solicitado`
            : `${itemCount} productos solicitados`}
        </div>

        {/* Product list (up to 3 items shown) */}
        {request.items.length > 0 && (
          <ul className="space-y-0.5">
            {request.items.slice(0, 3).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between text-[10px]"
              >
                <span
                  className={cn(
                    "truncate",
                    isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {item.producto_descripcion}
                </span>
                <span
                  className={cn(
                    "ml-2 shrink-0 font-semibold",
                    isMine ? "text-primary-foreground" : "text-foreground"
                  )}
                >
                  ×{item.cantidad_solicitada}
                </span>
              </li>
            ))}
            {request.items.length > 3 && (
              <li
                className={cn(
                  "text-[10px] italic",
                  isMine ? "text-primary-foreground/50" : "text-muted-foreground/70"
                )}
              >
                +{request.items.length - 3} más…
              </li>
            )}
          </ul>
        )}

        {/* Terminal estado indicator (no buttons) */}
        {isTerminal && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>Esta solicitud ya fue procesada</span>
          </div>
        )}

        {/* Action buttons — only for recipient on non-terminal estados */}
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
                ) : (
                  "Importar"
                )}
              </Button>
            )}

            {canFulfill && (
              <Button
                size="sm"
                className="h-7 flex-1 text-[11px] px-2"
                disabled={fulfill.isPending}
                onClick={() => setConfirmFulfillOpen(true)}
              >
                {fulfill.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Enviar directo"
                )}
              </Button>
            )}
          </div>
        )}

        {/* Permission-based notice when recipient but no permissions */}
        {isRecipient && !isTerminal && !canImport && !canFulfill && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <XCircle className="h-3 w-3 shrink-0 text-muted-foreground/60" />
            <span>Sin permisos para actuar sobre esta solicitud</span>
          </div>
        )}
      </div>

      {/* Confirm fulfill modal */}
      <ConfirmFulfillModal
        open={confirmFulfillOpen}
        onClose={() => setConfirmFulfillOpen(false)}
        onConfirm={() => void handleFulfillConfirm()}
        isPending={fulfill.isPending}
      />

      {/* Fulfill result modal */}
      {fulfillResult && (
        <FulfillResultModal
          open={!!fulfillResult}
          onClose={() => setFulfillResult(null)}
          result={fulfillResult}
        />
      )}
    </>
  );
}
