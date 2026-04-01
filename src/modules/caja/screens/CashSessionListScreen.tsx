import { Alert, AlertDescription } from "@/components/atoms/alert";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import Pagination from "@/components/common/pagination";
import { useBranchStore } from "@/states/branchStore";
import { Info } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CloseSessionModal } from "../components/modals/CloseSessionModal";
import { OpenSessionModal } from "../components/modals/OpenSessionModal";
import CashSessionFilterComponent from "../components/cashSessionList/cashSessionFilterComponent";
import CashSessionListTable from "../components/cashSessionList/cashSessionListTable";
import { useCashSessionActive } from "../hooks/useCashSessionActive";
import { useCashSessions } from "../hooks/useCashSessions";
import type { CashSession } from "../types/cashSession.types";
import type { CashSessionFilters } from "../types/cashFilters.types";
import { useOpenCashSession } from "../hooks/useOpenCashSession";

const DEFAULT_PAGE_SIZE = 15;

const CashSessionListScreen = () => {
  const navigate = useNavigate();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const branchId = Number(selectedBranchId);

  const [filters, setFilters] = useState<CashSessionFilters>({
    sucursal: branchId,
    pagina: 1,
    pagina_registros: DEFAULT_PAGE_SIZE,
  });

  const [appliedFilters, setAppliedFilters] = useState<CashSessionFilters>({
    sucursal: branchId,
    pagina: 1,
    pagina_registros: DEFAULT_PAGE_SIZE,
  });

  const [openSessionModal, setOpenSessionModal] = useState(false);
  const [closeSessionModal, setCloseSessionModal] = useState<{
    open: boolean;
    session: CashSession | null;
  }>({ open: false, session: null });

  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useCashSessions(appliedFilters);

  const {
    data: activeSession,
    isLoading: isLoadingActive,
  } = useCashSessionActive(branchId);

  const { isPending: openSessionMutationPending } = useOpenCashSession();

  const handleFiltersChange = (partial: Partial<CashSessionFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filters, pagina: 1 });
  };

  const handlePageChange = (page: number) => {
    setAppliedFilters((prev) => ({ ...prev, pagina: page }));
    setFilters((prev) => ({ ...prev, pagina: page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setAppliedFilters((prev) => ({ ...prev, pagina_registros: pageSize, pagina: 1 }));
    setFilters((prev) => ({ ...prev, pagina_registros: pageSize, pagina: 1 }));
  };

  const handleViewDetail = (id: number) => {
    navigate(`/dashboard/caja/sesiones/${id}`);
  };

  const handleCloseSession = (session: CashSession) => {
    setCloseSessionModal({ open: true, session });
  };

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      <header className="bg-background rounded-lg p-2 space-y-2 border border-border flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-lg font-bold text-primary">Sesiones de Caja</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {activeSession && (
              <Badge variant="success" className="text-xs">
                Sesión Activa #{activeSession.id} | Saldo: Bs{" "}
                {activeSession.saldo_sistema.toFixed(2)}
              </Badge>
            )}
            <Button
              onClick={() => setOpenSessionModal(true)}
              disabled={!!activeSession || openSessionMutationPending}
              size="sm"
            >
              Abrir Sesión
            </Button>
          </div>
        </div>

        {!activeSession && !isLoadingActive && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No hay sesión activa. Abrí una sesión para registrar movimientos.
            </AlertDescription>
          </Alert>
        )}

        <CashSessionFilterComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
        />
      </header>

      <div className="bg-background rounded-lg border border-border flex-1 min-h-0 overflow-hidden flex flex-col">
        <CashSessionListTable
          data={data?.data ?? []}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          onViewDetail={handleViewDetail}
          onClose={handleCloseSession}
        />

        {(data?.data?.length ?? 0) > 0 && (
          <div className="flex-shrink-0 border-t border-border bg-background">
            <Pagination
              currentPage={appliedFilters.pagina}
              totalData={data?.meta?.total ?? 0}
              onPageChange={handlePageChange}
              showRows={appliedFilters.pagina_registros}
              onShowRowsChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      <OpenSessionModal
        isOpen={openSessionModal}
        onClose={() => setOpenSessionModal(false)}
        branchId={branchId}
      />

      {closeSessionModal.session && (
        <CloseSessionModal
          isOpen={closeSessionModal.open}
          onClose={() => setCloseSessionModal({ open: false, session: null })}
          sessionId={closeSessionModal.session.id}
          saldoSistema={closeSessionModal.session.saldo_sistema}
        />
      )}
    </main>
  );
};

export default CashSessionListScreen;
