import { Button } from "@/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Textarea } from "@/components/atoms/textarea";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { cn } from "@/lib/utils";
import {
  useMessagingUsersFlat,
  useMessagingUsersGrouped,
  useUserAllSucursalesMap,
} from "@/modules/messaging/hooks/useMessagingUsers";
import type { MessagingUser } from "@/modules/messaging/types/MessagingUser.types";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import { useChatStore } from "@/modules/messaging/stores/ChatStore";
import { useBranchStore } from "@/states/branchStore";
import { ArrowLeftRight, Loader2, Search, User, X } from "lucide-react";
import { useState } from "react";
import { useCreateTransferRequest } from "../hooks/useCreateTransferRequest";

// ─────────────────────────────────────────────────────────────────────────────
// SUCURSAL BADGES
// ─────────────────────────────────────────────────────────────────────────────

function SucursalBadges({ siglas }: { siglas: string[] }) {
  if (!siglas.length) return null;
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {siglas.map((s) => (
        <span
          key={s}
          className="rounded px-1 py-0.5 text-[9px] font-bold bg-muted text-muted-foreground leading-none"
        >
          {s}
        </span>
      ))}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USER PICKER
// ─────────────────────────────────────────────────────────────────────────────

interface UserPickerProps {
  selectedUser: MessagingUser | null;
  onSelect: (user: MessagingUser) => void;
  onClear: () => void;
  error?: string;
  excludeUserIds?: Set<number>;
}

function UserPicker({ selectedUser, onSelect, onClear, error, excludeUserIds }: UserPickerProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const allSucursalesMap = useUserAllSucursalesMap();
  const { users: allUsers, isLoading } = useMessagingUsersFlat(search.trim() || undefined);
  const users = excludeUserIds?.size
    ? allUsers.filter((u) => !excludeUserIds.has(u.id))
    : allUsers;

  const handleSelect = (user: MessagingUser) => {
    onSelect(user);
    setIsOpen(false);
    setSearch("");
  };

  if (selectedUser) {
    const siglas = allSucursalesMap.get(selectedUser.id) ?? [];
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm",
          error ? "border-destructive" : "border-input"
        )}
      >
        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate font-medium">{selectedUser.nombre}</span>
        <SucursalBadges siglas={siglas} />
        <button type="button" onClick={onClear} className="shrink-0 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm cursor-pointer",
          error ? "border-destructive" : "border-input",
          isOpen && "ring-2 ring-ring ring-offset-background"
        )}
        onClick={() => setIsOpen((v) => !v)}
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        {isOpen ? (
          <input
            autoFocus
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-muted-foreground">Seleccionar destinatario...</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-background shadow-md max-h-52 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              {search.trim() ? `Sin resultados para "${search}"` : "Sin usuarios disponibles"}
            </div>
          ) : (
            users.map((u) => {
              const siglas = allSucursalesMap.get(u.id) ?? [];
              return (
                <button
                  key={u.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent/40 transition-colors"
                  onClick={() => handleSelect(u)}
                >
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate font-medium">{u.nombre}</span>
                  <SucursalBadges siglas={siglas} />
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  product: ProductGet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickTransferRequestModal({ product, open, onOpenChange }: Props) {
  const { selectedBranchId } = useBranchStore();
  const currentBranchId = Number(selectedBranchId) || 1;

  const [destinatario, setDestinatario] = useState<MessagingUser | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState("");
  const [destinatarioError, setDestinatarioError] = useState("");

  const { mutateAsync: createRequest, isPending } = useCreateTransferRequest();
  const { handleError } = useErrorHandler();
  const sendTransferRequest = useChatStore((s) => s.sendTransferRequest);

  const { groups } = useMessagingUsersGrouped();
  const userBranchMap = (() => {
    const map = new Map<number, number>();
    for (const group of groups) {
      for (const u of group.usuarios) {
        const existing = map.get(u.id);
        if (existing === undefined || existing === currentBranchId) {
          map.set(u.id, group.sucursal.id);
        }
      }
    }
    return map;
  })();

  const sameBranchUserIds = (() => {
    const ids = new Set<number>();
    for (const [userId, branchId] of userBranchMap) {
      if (branchId === currentBranchId) ids.add(userId);
    }
    return ids;
  })();

  const resetForm = () => {
    setDestinatario(null);
    setCantidad(1);
    setNotas("");
    setDestinatarioError("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!destinatario) {
      setDestinatarioError("Debes seleccionar un destinatario");
      return;
    }

    const sucursalDestinatariaId = userBranchMap.get(destinatario.id);
    if (!sucursalDestinatariaId) {
      showErrorToast({
        title: "Error de validación",
        description: "No se pudo determinar la sucursal del destinatario",
        duration: 4000,
      });
      return;
    }
    if (sucursalDestinatariaId === currentBranchId) {
      showErrorToast({
        title: "Sucursal inválida",
        description: "El destinatario debe pertenecer a una sucursal diferente a la tuya.",
        duration: 4000,
      });
      return;
    }

    try {
      const result = await createRequest({
        sucursal_solicitante_id: currentBranchId,
        sucursal_destinataria_id: sucursalDestinatariaId,
        usuario_destinatario_id: destinatario.id,
        items: [{ producto_id: product.id, cantidad_solicitada: cantidad }],
        notas: notas.trim() || undefined,
      });

      await sendTransferRequest({
        toUserId: result.usuario_destinatario_id,
        transferRequestId: result.id,
        itemCount: result.items.length,
      });

      showSuccessToast({
        title: "Solicitud enviada",
        description: `Solicitud de "${product.descripcion}" enviada a ${destinatario.nombre}`,
        duration: 4000,
      });
      handleOpenChange(false);
    } catch (error) {
      handleError({ error, customTitle: "No se pudo crear la solicitud" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Solicitar Transferencia
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Producto (read-only) */}
          <div>
            <Label className="text-xs">Producto</Label>
            <div className="mt-1 rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground truncate">
              {product?.descripcion ?? "—"}
            </div>
          </div>

          {/* Destinatario */}
          <div>
            <Label className="text-xs">Destinatario *</Label>
            <div className="mt-1">
              <UserPicker
                selectedUser={destinatario}
                onSelect={(u) => {
                  setDestinatario(u);
                  setDestinatarioError("");
                }}
                onClear={() => setDestinatario(null)}
                error={destinatarioError}
                excludeUserIds={sameBranchUserIds}
              />
              {destinatarioError && (
                <p className="text-destructive text-xs mt-0.5">{destinatarioError}</p>
              )}
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <Label htmlFor="qtr-cantidad" className="text-xs">
              Cantidad *
            </Label>
            <Input
              id="qtr-cantidad"
              type="number"
              min="0.01"
              step="0.01"
              value={cantidad}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v > 0) setCantidad(v);
              }}
              className="mt-1 h-8 text-sm"
            />
          </div>

          {/* Notas */}
          <div>
            <Label htmlFor="qtr-notas" className="text-xs">
              Notas
            </Label>
            <Textarea
              id="qtr-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
              className="mt-1 text-xs min-h-8"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Solicitar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
