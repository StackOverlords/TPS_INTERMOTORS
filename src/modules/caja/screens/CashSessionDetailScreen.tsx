import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { useBranchStore } from "@/states/branchStore";
import { cn } from "@/lib/utils";
import { ArrowLeft, Minus, Plus, Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CashExpenseModal } from "../components/modals/CashExpenseModal";
import { CashIncomeModal } from "../components/modals/CashIncomeModal";
import { CashWithdrawalModal } from "../components/modals/CashWithdrawalModal";
import { CloseSessionModal } from "../components/modals/CloseSessionModal";
import { CashMovementsTable } from "../components/cashSessionDetail/cashMovementsTable";
import { useCashSessionDetail } from "../hooks/useCashSessionDetail";
import type { CashMovement } from "../types/cashMovement.types";

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

  const { data: session, isLoading, isFetching, isError } = useCashSessionDetail(sessionId);

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

          {session?.estado === "ABIERTA" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCloseModal(true)}
            >
              Cerrar Sesión
            </Button>
          )}
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
    </main>
  );
};

export default CashSessionDetailScreen;
