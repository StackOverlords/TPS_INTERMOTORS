import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import ConfirmationModal from "@/components/common/confirmationModal";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { PERMISSIONS } from "@/lib/permissions";
import { useBranchStore } from "@/states/branchStore";
import { cn } from "@/lib/utils";
import { showSuccessToast, showErrorToast } from "@/hooks/use-toast-enhanced";
import { ArrowLeft, FileDown, Minus, Plus, Receipt, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CashExpenseModal } from "../components/modals/CashExpenseModal";
import { CashIncomeModal } from "../components/modals/CashIncomeModal";
import { CashWithdrawalModal } from "../components/modals/CashWithdrawalModal";
import { CloseSessionModal } from "../components/modals/CloseSessionModal";
import { CashMovementsTable } from "../components/cashSessionDetail/cashMovementsTable";
import { useCashSessionDetail } from "../hooks/useCashSessionDetail";
import { useDeleteCashMovement } from "../hooks/useDeleteCashMovement";
import { cashService } from "../services/cash.service";
import type { CashMovement } from "../types/cashMovement.types";
import type { ArqueoFormaPago } from "../types/cashSession.types";

// ─── Summary Card ──────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  color?: "green" | "red" | "blue" | "neutral";
}

function SummaryCard({ label, value, color }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn("text-sm font-semibold", {
          "text-emerald-600 dark:text-emerald-400": color === "green",
          "text-destructive": color === "red",
          "text-blue-600 dark:text-blue-400": color === "blue",
          "text-foreground": !color || color === "neutral",
        })}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Arqueo por forma de pago ─────────────────────────────────────────────────

function ArqueoSection({ desglose }: { desglose: ArqueoFormaPago[] }) {
  if (!desglose.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background p-3 flex-shrink-0">
      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
        Arqueo por forma de pago
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left pb-1 font-medium">Forma de pago</th>
              <th className="text-right pb-1 font-medium">Ingresos</th>
              <th className="text-right pb-1 font-medium">Egresos</th>
              <th className="text-right pb-1 font-medium">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {desglose.map((row) => (
              <tr key={row.forma_pago} className="border-b border-border/50 last:border-0">
                <td className="py-1 text-foreground">{row.forma_pago_label}</td>
                <td className="py-1 text-right text-emerald-600 dark:text-emerald-400">
                  Bs {row.total_ingresos.toFixed(2)}
                </td>
                <td className="py-1 text-right text-destructive">
                  Bs {row.total_egresos.toFixed(2)}
                </td>
                <td
                  className={cn("py-1 text-right font-semibold", {
                    "text-emerald-600 dark:text-emerald-400": row.saldo > 0,
                    "text-destructive": row.saldo < 0,
                    "text-foreground": row.saldo === 0,
                  })}
                >
                  Bs {row.saldo.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Movement filter options ───────────────────────────────────────────────────

const TIPO_OPTIONS = [
  { id: "", label: "Todos" },
  { id: "INGRESO", label: "Ingreso" },
  { id: "EGRESO", label: "Egreso" },
];

const CONCEPTO_OPTIONS = [
  { id: "", label: "Todos" },
  { id: "VENTA", label: "Venta" },
  { id: "COBRO_CUENTA", label: "Cobro a cuenta" },
  { id: "INGRESO_MANUAL", label: "Ingreso manual" },
  { id: "EGRESO_MANUAL", label: "Egreso manual" },
  { id: "GASTO", label: "Gasto" },
];

const ORIGEN_OPTIONS = [
  { id: "", label: "Todos" },
  { id: "AUTOMATICO", label: "Automático" },
  { id: "MANUAL", label: "Manual" },
];

// ─── Screen ────────────────────────────────────────────────────────────────────

interface MovementFilters {
  tipo_movimiento: string;
  concepto: string;
  origen: string;
}

const DEFAULT_FILTERS: MovementFilters = {
  tipo_movimiento: "",
  concepto: "",
  origen: "",
};

const CashSessionDetailScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);

  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const branchId = Number(selectedBranchId);

  const [incomeModal, setIncomeModal] = useState(false);
  const [withdrawalModal, setWithdrawalModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [filters, setFilters] = useState<MovementFilters>(DEFAULT_FILTERS);
  const [movementToAnular, setMovementToAnular] = useState<CashMovement | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const { data: session, isLoading, isFetching, isError, refetch } = useCashSessionDetail(sessionId);
  const { mutate: deleteMovement, isPending: isAnulando } = useDeleteCashMovement(sessionId);

  const filteredMovements = useMemo<CashMovement[]>(() => {
    const movements: CashMovement[] = session?.movimientos ?? [];
    return movements.filter((m) => {
      if (filters.tipo_movimiento && m.tipo_movimiento !== filters.tipo_movimiento)
        return false;
      if (filters.concepto && m.concepto !== filters.concepto) return false;
      if (filters.origen && m.origen !== filters.origen) return false;
      return true;
    });
  }, [session?.movimientos, filters]);

  const isClosed = session?.estado === "CERRADA";
  const diferencia = session?.diferencia ?? 0;

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await cashService.downloadSessionPdf(sessionId);
    } catch {
      showErrorToast({ title: "Error", description: "No se pudo descargar el PDF." });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleConfirmAnular = () => {
    if (!movementToAnular) return;
    deleteMovement(movementToAnular.id, {
      onSuccess: () => {
        showSuccessToast({
          title: "Movimiento anulado",
          description: "Se registró la anulación correctamente.",
        });
        setMovementToAnular(null);
      },
      onError: (error) => {
        showErrorToast({
          title: "Error al anular",
          description: error.message || "No se pudo anular el movimiento.",
        });
        setMovementToAnular(null);
      },
    });
  };

  return (
    <main className="h-full p-2 gap-2 flex flex-col overflow-auto">
      {/* Header */}
      <header className="bg-background rounded-lg p-2 border border-border flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-1"
            >
              <ArrowLeft className="size-4" />
              Volver
            </Button>
            <h1 className="text-lg font-bold text-primary">
              Sesión de Caja #{id}
            </h1>
            {session && (
              <Badge variant={session.estado === "ABIERTA" ? "success" : "secondary"}>
                {session.estado_label}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
              Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
            >
              <FileDown className="size-4" />
              PDF
            </Button>
            {session?.estado === "ABIERTA" && (
              <ProtectedAction
                permission={PERMISSIONS.CAJ.CLOSE_SESSION}
                roles={["Super Admin", "Administrador"]}
                fallback={null}
              >
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setCloseModal(true)}
                >
                  Cerrar Sesión
                </Button>
              </ProtectedAction>
            )}
          </div>
        </div>
      </header>

      {/* Summary cards */}
      {session && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 flex-shrink-0">
          <SummaryCard
            label="Monto Apertura"
            value={`Bs ${session.monto_apertura.toFixed(2)}`}
          />
          <SummaryCard
            label="Total Ingresos"
            value={`Bs ${session.total_ingresos.toFixed(2)}`}
            color="green"
          />
          <SummaryCard
            label="Total Egresos"
            value={`Bs ${session.total_egresos.toFixed(2)}`}
            color="red"
          />
          <SummaryCard
            label="Saldo Sistema"
            value={`Bs ${session.saldo_sistema.toFixed(2)}`}
            color="blue"
          />
          {isClosed && (
            <>
              <SummaryCard
                label="Monto Declarado"
                value={
                  session.monto_cierre_declarado != null
                    ? `Bs ${session.monto_cierre_declarado.toFixed(2)}`
                    : "—"
                }
              />
              <SummaryCard
                label="Diferencia"
                value={
                  session.diferencia != null
                    ? `Bs ${session.diferencia.toFixed(2)}`
                    : "—"
                }
                color={
                  diferencia < 0
                    ? "red"
                    : diferencia > 0
                    ? "green"
                    : "neutral"
                }
              />
            </>
          )}
        </div>
      )}

      {/* Arqueo por forma de pago */}
      {session?.arqueo_por_forma_pago && session.arqueo_por_forma_pago.length > 0 && (
        <ArqueoSection desglose={session.arqueo_por_forma_pago} />
      )}

      {/* Actions toolbar */}
      <div className="flex gap-2 flex-wrap flex-shrink-0">
        <Button
          size="sm"
          onClick={() => setIncomeModal(true)}
          disabled={isClosed}
          className="gap-1"
        >
          <Plus className="size-4" />
          Ingreso Manual
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setWithdrawalModal(true)}
          disabled={isClosed}
          className="gap-1"
        >
          <Minus className="size-4" />
          Retiro
        </Button>
        <ProtectedAction
          permission={PERMISSIONS.CAJ.CREATE_EXPENSE}
          roles={["Super Admin", "Administrador"]}
          fallback={null}
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpenseModal(true)}
            disabled={isClosed}
            className="gap-1"
          >
            <Receipt className="size-4" />
            Registrar Gasto
          </Button>
        </ProtectedAction>
      </div>

      {/* Movement filters */}
      <div className="flex gap-2 flex-wrap items-center flex-shrink-0">
        <div className="w-40">
          <ComboboxSelect
            value={filters.tipo_movimiento}
            onChange={(val) =>
              setFilters((prev) => ({ ...prev, tipo_movimiento: String(val ?? "") }))
            }
            options={TIPO_OPTIONS}
            optionTag="label"
            placeholder="Tipo..."
          />
        </div>
        <div className="w-48">
          <ComboboxSelect
            value={filters.concepto}
            onChange={(val) =>
              setFilters((prev) => ({ ...prev, concepto: String(val ?? "") }))
            }
            options={CONCEPTO_OPTIONS}
            optionTag="label"
            placeholder="Concepto..."
          />
        </div>
        <div className="w-40">
          <ComboboxSelect
            value={filters.origen}
            onChange={(val) =>
              setFilters((prev) => ({ ...prev, origen: String(val ?? "") }))
            }
            options={ORIGEN_OPTIONS}
            optionTag="label"
            placeholder="Origen..."
          />
        </div>
      </div>

      {/* Movements table */}
      <div className="bg-background rounded-lg border border-border flex-1 min-h-0 overflow-hidden flex flex-col">
        <CashMovementsTable
          data={filteredMovements}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          canAnular={!isClosed}
          onAnular={setMovementToAnular}
        />
      </div>

      {/* Modals */}
      <CashIncomeModal
        isOpen={incomeModal}
        onClose={() => setIncomeModal(false)}
        sessionId={sessionId}
        branchId={branchId}
      />
      <CashWithdrawalModal
        isOpen={withdrawalModal}
        onClose={() => setWithdrawalModal(false)}
        sessionId={sessionId}
        branchId={branchId}
      />
      <CashExpenseModal
        isOpen={expenseModal}
        onClose={() => setExpenseModal(false)}
        sessionId={sessionId}
        branchId={branchId}
      />
      {session && (
        <CloseSessionModal
          isOpen={closeModal}
          onClose={() => setCloseModal(false)}
          sessionId={sessionId}
          saldoSistema={session.saldo_sistema}
        />
      )}
      <ConfirmationModal
        isOpen={!!movementToAnular}
        onClose={() => setMovementToAnular(null)}
        onConfirm={handleConfirmAnular}
        isLoading={isAnulando}
        variant="danger"
        title="Anular movimiento"
        description={
          movementToAnular
            ? `¿Confirmas anular el movimiento #${movementToAnular.id} — ${movementToAnular.concepto_label} por Bs ${movementToAnular.monto.toFixed(2)}? Se creará un movimiento de anulación en la sesión activa.`
            : ""
        }
        confirmText="Anular"
      />
    </main>
  );
};

export default CashSessionDetailScreen;
