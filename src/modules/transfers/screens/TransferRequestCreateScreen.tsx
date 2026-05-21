import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Separator } from "@/components/atoms/separator";
import { Textarea } from "@/components/atoms/textarea";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  useMessagingUsersFlat,
  useMessagingUsersGrouped,
  useUserAllSucursalesMap,
} from "@/modules/messaging/hooks/useMessagingUsers";
import type { MessagingUser } from "@/modules/messaging/types/MessagingUser.types";
import { useGetBranchById } from "@/modules/settings/hooks/branch/useGetBranchById";
import { useBranchStore } from "@/states/branchStore";
import {
  ArrowLeftRight,
  CornerUpLeft,
  Loader2,
  Plus,
  Save,
  Search,
  ShieldAlert,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useCreateTransferRequest } from "../hooks/useCreateTransferRequest";
import type {
  CreateTransferRequestItem,
  TransferRequest,
} from "../types/transferRequest.types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ProductRow {
  /** Unique row key — product ID (one row per product for simplicity) */
  producto_id: number;
  descripcion: string;
  cantidad_solicitada: number;
}

interface Props {
  /** Called after a successful request creation. Phase 4 wires this to ChatStore. */
  onSuccess?: (request: TransferRequest) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUCURSAL BADGES (reused pattern from UserSelectorPanel)
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
// USER PICKER INLINE (based on UserSelectorPanel pattern)
// ─────────────────────────────────────────────────────────────────────────────

interface UserPickerProps {
  selectedUser: MessagingUser | null;
  onSelect: (user: MessagingUser) => void;
  onClear: () => void;
  error?: string;
}

function UserPicker({ selectedUser, onSelect, onClear, error }: UserPickerProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { users, isLoading } = useMessagingUsersFlat(search.trim() || undefined);
  const allSucursalesMap = useUserAllSucursalesMap();

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
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
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
          <span className="flex-1 text-muted-foreground">
            Seleccionar destinatario...
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-background shadow-md max-h-60 overflow-y-auto">
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
// PRODUCT SEARCH ROW (inline search for adding product rows)
// ─────────────────────────────────────────────────────────────────────────────

interface ProductSearchRowProps {
  onAdd: (producto_id: number, descripcion: string) => void;
  existingIds: Set<number>;
}

function ProductSearchRow({ onAdd, existingIds }: ProductSearchRowProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<{ id: number; descripcion: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const { productsService } = await import(
        "@/modules/products/services/productService"
      );
      const data = await productsService.getAll({
        descripcion: query,
        pagina: 1,
        pagina_registros: 20,
      });
      setResults(
        (data?.data ?? []).map((p: { id: number; descripcion: string }) => ({
          id: p.id,
          descripcion: p.descripcion,
        }))
      );
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (producto_id: number, descripcion: string) => {
    if (existingIds.has(producto_id)) return;
    onAdd(producto_id, descripcion);
    setSearch("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-background">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          placeholder="Buscar producto para agregar..."
          value={search}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onChange={(e) => {
            handleSearch(e.target.value);
            setIsOpen(true);
          }}
        />
        {isSearching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        {search && !isSearching && (
          <button
            type="button"
            onClick={() => { setSearch(""); setResults([]); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-background shadow-md max-h-52 overflow-y-auto">
          {results.map((p) => {
            const alreadyAdded = existingIds.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                disabled={alreadyAdded}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                  alreadyAdded
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-accent/40"
                )}
                onMouseDown={() => handleSelect(p.id, p.descripcion)}
              >
                <Plus className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{p.descripcion}</span>
                {alreadyAdded && (
                  <span className="text-[10px] text-muted-foreground">ya agregado</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const TransferRequestCreateScreen = ({ onSuccess }: Props) => {
  const navigate = useNavigate();
  const { selectedBranchId } = useBranchStore();

  // ── Form state ───────────────────────────────────────────────────────────
  const [destinatario, setDestinatario] = useState<MessagingUser | null>(null);
  const [items, setItems] = useState<ProductRow[]>([]);
  const [notas, setNotas] = useState("");

  // ── Errors ───────────────────────────────────────────────────────────────
  const [destinatarioError, setDestinatarioError] = useState("");
  const [itemsError, setItemsError] = useState("");

  // ── Hooks ────────────────────────────────────────────────────────────────
  const { mutateAsync: createRequest, isPending } = useCreateTransferRequest();
  const { handleError } = useErrorHandler();

  // Origin branch name
  const { data: originBranchData } = useGetBranchById(
    Number(selectedBranchId) || 1
  );

  // Build userId → sucursalId map for resolving destinatario's branch
  const { groups } = useMessagingUsersGrouped();
  const userBranchMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const group of groups) {
      for (const u of group.usuarios) {
        if (!map.has(u.id)) {
          map.set(u.id, group.sucursal.id);
        }
      }
    }
    return map;
  }, [groups]);

  const existingProductIds = new Set(items.map((i) => i.producto_id));

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAddProduct = (producto_id: number, descripcion: string) => {
    setItems((prev) => [
      ...prev,
      { producto_id, descripcion, cantidad_solicitada: 1 },
    ]);
    if (itemsError) setItemsError("");
  };

  const handleRemoveProduct = (producto_id: number) => {
    setItems((prev) => prev.filter((r) => r.producto_id !== producto_id));
  };

  const handleCantidadChange = (producto_id: number, raw: string) => {
    const value = parseFloat(raw);
    if (isNaN(value) || value <= 0) return;
    setItems((prev) =>
      prev.map((r) =>
        r.producto_id === producto_id
          ? { ...r, cantidad_solicitada: value }
          : r
      )
    );
  };

  const validate = (): boolean => {
    let valid = true;

    if (!destinatario) {
      setDestinatarioError("Debes seleccionar un destinatario");
      valid = false;
    } else {
      setDestinatarioError("");
    }

    if (items.length === 0) {
      setItemsError("Debes agregar al menos un producto");
      valid = false;
    } else {
      setItemsError("");
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const sucursalDestinatariaId = userBranchMap.get(destinatario!.id);
    if (!sucursalDestinatariaId) {
      showErrorToast({
        title: "Error de validación",
        description: "No se pudo determinar la sucursal del destinatario",
        duration: 4000,
      });
      return;
    }

    const payload = {
      sucursal_solicitante_id: Number(selectedBranchId) || 1,
      sucursal_destinataria_id: sucursalDestinatariaId,
      usuario_destinatario_id: destinatario!.id,
      items: items.map(
        (r): CreateTransferRequestItem => ({
          producto_id: r.producto_id,
          cantidad_solicitada: r.cantidad_solicitada,
        })
      ),
      notas: notas.trim() || undefined,
    };

    try {
      const result = await createRequest(payload);
      showSuccessToast({
        title: "Solicitud creada",
        description: `Solicitud de transferencia creada con ${items.length} producto${items.length !== 1 ? "s" : ""}`,
        duration: 4000,
      });
      onSuccess?.(result);
    } catch (error) {
      handleError({
        error,
        customTitle: "No se pudo crear la solicitud",
      });
    }
  };

  const handleGoBack = () => {
    navigate("/dashboard/transfers");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="h-full flex flex-col">
      <ProtectedAction
        permission={PERMISSIONS.TRA.REQUEST_CREATE}
        roles={["Super Admin", "Administrador", "Vendedor"]}
        showLoader={true}
      >
        <form
          onSubmit={handleSubmit}
          className="h-full flex flex-col gap-2 p-2"
        >
          {/* Header */}
          <header className="border-border border bg-background rounded-lg p-2 sm:px-3 flex-shrink-0">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  onClick={handleGoBack}
                  className="h-8 w-8"
                >
                  <CornerUpLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold text-foreground leading-tight">
                    Nueva Solicitud de Transferencia
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Solicita productos a otra sucursal
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* 1. Datos de la solicitud */}
          <Card className="shadow-none flex-shrink-0">
            <CardContent className="py-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Destinatario */}
                <div className="w-full">
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
                    />
                    {destinatarioError && (
                      <p className="text-destructive text-xs mt-0.5">
                        {destinatarioError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Sucursal solicitante (read-only — current branch) */}
                <div className="w-full">
                  <Label className="text-xs">Sucursal Solicitante</Label>
                  <Input
                    disabled
                    value={originBranchData?.nombre ?? "Cargando..."}
                    className="bg-muted text-xs h-8 mt-1"
                  />
                </div>

                {/* Notas */}
                <div className="w-full sm:col-span-2">
                  <Label htmlFor="notas" className="text-xs">
                    Notas
                  </Label>
                  <Textarea
                    id="notas"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Notas adicionales sobre la solicitud..."
                    rows={2}
                    className="w-full text-xs min-h-8 mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Productos */}
          <Card className="shadow-none flex-1 min-h-0 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowLeftRight className="size-4" />
                Productos Solicitados
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col gap-3">
              {/* Product search input */}
              <ProductSearchRow
                onAdd={handleAddProduct}
                existingIds={existingProductIds}
              />

              {itemsError && (
                <p className="text-destructive text-xs">{itemsError}</p>
              )}

              {/* Product rows */}
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground flex-1 flex flex-col items-center justify-center">
                  <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm">Sin productos agregados</p>
                  <p className="text-xs">
                    Buscá un producto arriba para agregarlo a la solicitud
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                          Producto
                        </th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground w-28">
                          Cantidad
                        </th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row) => (
                        <tr
                          key={row.producto_id}
                          className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-2 px-2 font-medium truncate max-w-0">
                            <span className="block truncate">
                              {row.descripcion}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right">
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={row.cantidad_solicitada}
                              onChange={(e) =>
                                handleCantidadChange(
                                  row.producto_id,
                                  e.target.value
                                )
                              }
                              className="h-7 text-xs text-right w-24 ml-auto"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                handleRemoveProduct(row.producto_id)
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {items.length > 0 && (
                <>
                  <Separator className="h-[0.5px] flex-shrink-0" />
                  <div className="flex justify-between items-center px-2 flex-shrink-0">
                    <span className="font-medium text-muted-foreground text-xs">
                      Total de productos:
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      {items.length} producto{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <Card className="border border-border shadow-none pt-3 flex-shrink-0">
            <CardContent className="space-y-2">
              <footer className="flex gap-2 items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  * Campos requeridos
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="font-medium"
                    onClick={handleGoBack}
                  >
                    Cancelar
                  </Button>
                  <ProtectedAction
                    permission={PERMISSIONS.TRA.REQUEST_CREATE}
                    roles={["Super Admin", "Administrador", "Vendedor"]}
                    fallback={
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled
                      >
                        <ShieldAlert className="mr-2 size-4" />
                        Sin permisos
                      </Button>
                    }
                    showUnauthorizedMessage={false}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isPending}
                      variant="default"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Creando solicitud...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 size-4" />
                          Crear Solicitud
                        </>
                      )}
                    </Button>
                  </ProtectedAction>
                </div>
              </footer>
            </CardContent>
          </Card>
        </form>
      </ProtectedAction>
    </main>
  );
};

export default TransferRequestCreateScreen;
