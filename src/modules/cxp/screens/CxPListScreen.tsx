import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import TooltipButton from "@/components/common/TooltipButton";
import { useCustomTable } from "@/hooks/useCustomTable";
import { formatCurrency } from "@/utils/formaters";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CxPDetailModal } from "../components/cxpDetail/CxPDetailModal";
import CxPFilters from "../components/cxpList/CxPFilters";
import useCxPPaginated, { type CxPPaginatedFilters } from "../hooks/queries/useCxPPaginated";
import type { CxPListItem } from "../schemas/cxpReport.schema";

const CxPListScreen = () => {
    const [filters, setFilters] = useState<CxPPaginatedFilters>({
        pagina: 1,
        pagina_registros: 20,
    });
    const [appliedFilters, setAppliedFilters] = useState<CxPPaginatedFilters>(filters);
    const [selectedCxPId, setSelectedCxPId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const {
        data: cxpData,
        isLoading,
        isFetching,
        isError,
        refetch,
        isRefetching,
    } = useCxPPaginated(appliedFilters);

    const [cxpList, setCxpList] = useState<CxPListItem[]>([]);

    useEffect(() => {
        if (!cxpData?.data || isFetching) return;
        setCxpList(cxpData.data);
    }, [cxpData?.data, isFetching]);

    const handleFilterChange = useCallback(
        (key: keyof CxPPaginatedFilters, value: string | number | undefined) => {
            setFilters((prev) => ({ ...prev, [key]: value, pagina: 1 }));
        },
        []
    );

    const handleSearch = useCallback(() => {
        setAppliedFilters({ ...filters, pagina: 1 });
    }, [filters]);

    const handleReset = useCallback(() => {
        const base: CxPPaginatedFilters = { pagina: 1, pagina_registros: 20 };
        setFilters(base);
        setAppliedFilters(base);
    }, []);

    const calcularDiasVencimiento = (plazo_pago: string | null): number | null => {
        if (!plazo_pago) return null;
        const hoy = new Date();
        const fechaPlazo = new Date(plazo_pago);
        const diferencia = fechaPlazo.getTime() - hoy.getTime();
        return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    };

    const columns = useMemo<ColumnDef<CxPListItem>[]>(
        () => [
            {
                accessorKey: "nro_compra",
                header: "Nro. Compra",
                size: 120,
                minSize: 30,
                enableHiding: true,
                cell: ({ getValue }) => (
                    <div className="text-center font-semibold">{getValue<string>()}</div>
                ),
            },
            {
                id: "proveedor_nombre",
                accessorFn: (row) => row.proveedor.proveedor,
                header: "Proveedor",
                size: 200,
                minSize: 30,
                enableHiding: true,
                cell: ({ getValue }) => (
                    <div className="font-medium">{getValue<string>()}</div>
                ),
            },
            {
                accessorKey: "fecha",
                header: "Fecha",
                size: 110,
                minSize: 30,
                enableHiding: true,
                cell: ({ getValue }) => (
                    <div className="text-center font-medium">
                        {new Date(getValue<string>()).toLocaleDateString("es-ES")}
                    </div>
                ),
            },
            {
                accessorKey: "plazo_pago",
                header: "Plazo de Pago",
                size: 120,
                minSize: 30,
                enableHiding: true,
                cell: ({ getValue }) => {
                    const plazo = getValue<string | null>();
                    return (
                        <div className="text-center font-medium">
                            {plazo ? new Date(plazo).toLocaleDateString("es-ES") : "-"}
                        </div>
                    );
                },
            },
            {
                id: "dias_vencimiento",
                accessorFn: (row) => row.plazo_pago,
                header: "Días Venc.",
                size: 110,
                minSize: 30,
                enableHiding: true,
                cell: ({ getValue }) => {
                    const plazo = getValue<string | null>();
                    const dias = calcularDiasVencimiento(plazo);
                    if (dias === null) {
                        return <div className="text-center text-muted-foreground/50">-</div>;
                    }
                    return (
                        <div
                            className={`text-center text-sm font-medium ${
                                dias < 0
                                    ? "text-destructive"
                                    : dias <= 15
                                    ? "text-yellow-600"
                                    : "text-emerald-600 dark:text-emerald-400"
                            }`}
                        >
                            {dias < 0 ? `Vencido (${Math.abs(dias)}d)` : `${dias} días`}
                        </div>
                    );
                },
            },
            {
                accessorKey: "total_comprado",
                header: "Total Compra",
                size: 130,
                minSize: 30,
                enableHiding: true,
                cell: ({ getValue }) => (
                    <div className="text-right font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(getValue<number>())}
                    </div>
                ),
            },
            {
                accessorKey: "total_pagado",
                header: "Total Pagado",
                size: 130,
                minSize: 30,
                enableHiding: true,
                cell: ({ getValue }) => (
                    <div className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(getValue<number>())}
                    </div>
                ),
            },
            {
                accessorKey: "saldo",
                header: "Saldo",
                size: 130,
                minSize: 30,
                enableHiding: true,
                cell: ({ getValue }) => {
                    const saldo = getValue<number>();
                    return (
                        <div className="text-center">
                            <Badge
                                variant={saldo === 0 ? "success" : saldo > 0 ? "danger" : "default"}
                                className="rounded font-bold"
                            >
                                {formatCurrency(saldo)}
                            </Badge>
                        </div>
                    );
                },
            },
            {
                id: "actions",
                header: "Acciones",
                size: 100,
                minSize: 60,
                enableHiding: false,
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCxPId(row.original.id);
                                setModalOpen(true);
                            }}
                        >
                            Ver detalle
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    const { table } = useCustomTable({
        data: cxpList,
        columns,
        enableSorting: true,
        enableColumnResizing: true,
        enableRowSelection: false,
        enableColumnVisibility: true,
        enableColumnOrdering: true,
        enablePagination: false,
        columnResizeMode: "onChange",
        persistenceKey: "cxp-list-table",
        persistColumnVisibility: true,
        persistColumnOrder: true,
    });

    const selectedCxP = useMemo(
        () => cxpList.find((c) => c.id === selectedCxPId) ?? null,
        [cxpList, selectedCxPId]
    );

    return (
        <main className="h-full p-2 gap-2 flex flex-col">
            {/* Header */}
            <header className="bg-background rounded-lg p-2 space-y-2 border border-border flex-shrink-0">
                <section className="flex items-center justify-between gap-2 flex-wrap">
                    <h1 className="text-lg font-bold text-primary">Cuentas por Pagar</h1>
                    <TooltipButton
                        onClick={() => refetch()}
                        buttonProps={{
                            className: "w-8",
                            disabled: isRefetching || isFetching,
                        }}
                        tooltip="Recargar cuentas por pagar"
                    >
                        <RefreshCcw
                            className={`size-4 ${isRefetching || isFetching ? "animate-spin" : ""}`}
                        />
                    </TooltipButton>
                </section>

                <CxPFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSearch={handleSearch}
                    onReset={handleReset}
                    searchMode="manual"
                />
            </header>

            {/* Tabla */}
            <div className="bg-background rounded-lg border border-border flex-1 min-h-0 flex flex-col">
                <div className="p-2 text-sm text-muted-foreground border-b border-border flex-shrink-0">
                    {cxpList.length > 0 ? (
                        (() => {
                            const pagina = appliedFilters.pagina ?? 1;
                            const porPagina = appliedFilters.pagina_registros ?? 20;
                            const inicio = (pagina - 1) * porPagina + 1;
                            const fin = pagina * porPagina;
                            return `Mostrando ${inicio} - ${fin} de ${cxpData?.meta.total ?? "?"} cuentas por pagar`;
                        })()
                    ) : (
                        <span>Sin resultados</span>
                    )}
                </div>

                <div className="flex-1 min-h-0">
                    <CustomizableTable
                        table={table}
                        isError={isError}
                        isFetching={isFetching}
                        isLoading={isLoading}
                        errorMessage="Ocurrió un error al cargar las cuentas por pagar"
                        rows={appliedFilters.pagina_registros}
                        noDataMessage="No se encontraron cuentas por pagar"
                        selectedRowIndex={null}
                        onRowClick={() => {}}
                        enableColumnReordering={true}
                        enableSorting={false}
                    />
                </div>

                {(cxpData?.data?.length ?? 0) > 0 && (
                    <Pagination
                        currentPage={appliedFilters.pagina || 1}
                        onPageChange={(page) =>
                            setAppliedFilters((prev) => ({ ...prev, pagina: page }))
                        }
                        totalData={cxpData?.meta.total || 1}
                        onShowRowsChange={(rows) =>
                            setAppliedFilters((prev) => ({ ...prev, pagina_registros: rows, pagina: 1 }))
                        }
                        showRows={appliedFilters.pagina_registros}
                    />
                )}
            </div>

            {/* Totales */}
            {cxpList.length > 0 && (
                <div className="p-3 border border-border flex-shrink-0 bg-background rounded-lg">
                    <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">Total Compra:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(cxpList.reduce((sum, c) => sum + c.total_comprado, 0))}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">Total Pagado:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(cxpList.reduce((sum, c) => sum + c.total_pagado, 0))}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">Saldo Pendiente:</span>
                            <span className="font-bold text-destructive">
                                {formatCurrency(cxpList.reduce((sum, c) => sum + c.saldo, 0))}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <CxPDetailModal
                cxp={selectedCxP}
                open={modalOpen}
                onOpenChange={setModalOpen}
                onDataChange={refetch}
            />
        </main>
    );
};

export default CxPListScreen;
