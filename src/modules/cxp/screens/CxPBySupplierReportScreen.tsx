import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Label } from "@/components/atoms/label";
import VirtualizedCustomizableTable from "@/components/common/VirtualizedCustomizableTable";
import TooltipButton from "@/components/common/TooltipButton";
import { useCustomTable } from "@/hooks/useCustomTable";
import { useBranchStore } from "@/states/branchStore";
import { type ColumnDef } from "@tanstack/react-table";
import { Download, Loader2, RefreshCcw, Search, AlertCircle, Receipt } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { subMonths, format } from "date-fns";
import { formatCurrency } from "@/utils/formaters";
import { parseDateForUi } from "@/utils/dateFormatters";
import useCxPBySupplierReport, { useDownloadCxPBySupplierReport } from "../hooks/useCxPBySupplierReport";
import type { CxPListItem, CxPBySupplierReportFilter } from "../schemas/cxpReport.schema";
import authSDK from "@/services/sdk-simple-auth";
import { ComboboxSelect } from "@/components/common/SelectCombobox";

const CxPBySupplierReportScreen = () => {
    const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
    const branches = authSDK.getCurrentUser()?.sucursales || [];

    const [sucursal, setSucursal] = useState<number | null>(
        selectedBranchId ? Number(selectedBranchId) : null
    );
    const [fechaInicio, setFechaInicio] = useState<string>(
        format(subMonths(new Date(), 1), "yyyy-MM-dd")
    );
    const [fechaFin, setFechaFin] = useState<string>(format(new Date(), "yyyy-MM-dd"));

    useEffect(() => {
        setSucursal(selectedBranchId ? Number(selectedBranchId) : null);
    }, [selectedBranchId]);

    const [appliedFilters, setAppliedFilters] = useState<CxPBySupplierReportFilter | null>(null);

    const {
        data: reportData,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useCxPBySupplierReport(
        appliedFilters ?? { sucursal: sucursal ?? 0 },
        appliedFilters !== null
    );

    const { mutate: downloadReport, isPending: isDownloading } = useDownloadCxPBySupplierReport();

    const data = reportData?.data ?? [];

    const stats = useMemo(() => {
        const totalSaldo = data.reduce((sum, item) => sum + item.saldo_pendiente, 0);
        const proveedoresUnicos = new Set(data.map((item) => item.proveedor.id)).size;
        const cuentasPendientes = data.filter((item) => item.saldo_pendiente > 0).length;
        return { totalItems: data.length, totalSaldo, proveedoresUnicos, cuentasPendientes };
    }, [data]);

    const columns = useMemo<ColumnDef<CxPListItem>[]>(
        () => [
            {
                id: "rowNumber",
                header: "Nro",
                size: 60,
                minSize: 40,
                enableSorting: false,
                enableHiding: false,
                cell: ({ row }) => (
                    <div className="text-center text-xs font-semibold text-muted-foreground">
                        {row.index + 1}
                    </div>
                ),
            },
            {
                id: "proveedor_nombre",
                accessorFn: (row) => row.proveedor.nombre,
                header: "Proveedor",
                size: 250,
                minSize: 150,
                cell: ({ getValue }) => (
                    <div className="font-medium text-primary">{getValue<string>()}</div>
                ),
            },
            {
                accessorKey: "nro_compra",
                header: "Nro. Compra",
                size: 130,
                minSize: 100,
                cell: ({ getValue }) => (
                    <div className="font-mono font-medium">{getValue<string>()}</div>
                ),
            },
            {
                accessorKey: "fecha_in",
                header: "Fecha",
                size: 120,
                minSize: 100,
                cell: ({ getValue }) => (
                    <div className="text-sm">{parseDateForUi(getValue<string>())}</div>
                ),
            },
            {
                accessorKey: "plazo_pago",
                header: "Vencimiento",
                size: 120,
                minSize: 100,
                cell: ({ getValue }) => {
                    const val = getValue<string | null>();
                    return <div className="text-sm">{val ? parseDateForUi(val) : "—"}</div>;
                },
            },
            {
                accessorKey: "total_compra",
                header: "Total Compra",
                size: 140,
                minSize: 100,
                cell: ({ getValue }) => (
                    <div className="text-right">
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                            {formatCurrency(getValue<number>())}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: "total_pagado",
                header: "Pagado",
                size: 140,
                minSize: 100,
                cell: ({ getValue }) => (
                    <div className="text-right">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(getValue<number>())}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: "saldo_pendiente",
                header: "Saldo",
                size: 140,
                minSize: 100,
                cell: ({ getValue }) => {
                    const saldo = getValue<number>();
                    return (
                        <div className="text-right">
                            <Badge
                                variant={saldo > 0 ? "danger" : "success"}
                                className="rounded font-bold"
                            >
                                {formatCurrency(saldo)}
                            </Badge>
                        </div>
                    );
                },
            },
        ],
        []
    );

    const { table } = useCustomTable({
        data,
        columns,
        enableSorting: true,
        enableColumnResizing: true,
        enableColumnVisibility: true,
        enableColumnOrdering: true,
        columnResizeMode: "onChange",
        persistenceKey: "cxp-by-supplier-report-table",
        persistColumnVisibility: true,
        persistColumnOrder: true,
    });

    const handleSearch = (overrideFechaInicio?: string, overrideFechaFin?: string) => {
        if (!sucursal) return;
        setAppliedFilters({
            sucursal,
            fecha_inicio: overrideFechaInicio ?? fechaInicio,
            fecha_fin: overrideFechaFin ?? fechaFin,
        });
    };

    const handleDownload = () => {
        if (appliedFilters) downloadReport(appliedFilters);
    };

    const setLastMonth = () => {
        const start = format(subMonths(new Date(), 1), "yyyy-MM-dd");
        const end = format(new Date(), "yyyy-MM-dd");
        setFechaInicio(start);
        setFechaFin(end);
        handleSearch(start, end);
    };

    const setLast3Months = () => {
        const start = format(subMonths(new Date(), 3), "yyyy-MM-dd");
        const end = format(new Date(), "yyyy-MM-dd");
        setFechaInicio(start);
        setFechaFin(end);
        handleSearch(start, end);
    };

    return (
        <main className="h-full p-2 gap-2 flex flex-col">
            <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div>
                        <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                            Reporte CxP por Proveedor
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Cuentas pendientes agrupadas por proveedor
                        </p>
                    </div>
                </div>

                <section className="border-t border-border pt-2 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-medium">Rápido:</span>
                        <Button variant="outline" size="sm" onClick={setLastMonth} className="h-7 text-xs">
                            Último mes
                        </Button>
                        <Button variant="outline" size="sm" onClick={setLast3Months} className="h-7 text-xs">
                            Últimos 3 meses
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="cxp-bs-inicio" className="text-sm">Desde:</Label>
                            <input
                                id="cxp-bs-inicio"
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="h-8 px-2 rounded-md border border-border text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Label htmlFor="cxp-bs-fin" className="text-sm">Hasta:</Label>
                            <input
                                id="cxp-bs-fin"
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="h-8 px-2 rounded-md border border-border text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Label className="text-sm">Sucursal:</Label>
                            <ComboboxSelect
                                value={sucursal?.toString() || "all"}
                                onChange={(value) => {
                                    setSucursal(value === "all" ? null : parseInt(value as string, 10));
                                }}
                                options={branches}
                                enableAllOption={true}
                                optionTag="sucursal"
                                allowClear={false}
                            />
                        </div>

                        <Button variant="default" onClick={() => handleSearch()} disabled={isFetching || !sucursal}>
                            {isFetching ? (
                                <Loader2 className="size-4 mr-2 animate-spin" />
                            ) : (
                                <Search className="size-4 mr-2" />
                            )}
                            {isFetching ? "Buscando..." : "Buscar"}
                        </Button>

                        <div className="ml-auto flex items-center gap-2">
                            <TooltipButton
                                onClick={() => refetch()}
                                buttonProps={{ variant: "outline", size: "sm", disabled: isFetching }}
                                tooltip="Actualizar reporte"
                            >
                                <RefreshCcw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
                            </TooltipButton>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                disabled={data.length === 0 || isDownloading}
                            >
                                <Download className={`size-4 mr-2 ${isDownloading ? "animate-pulse" : ""}`} />
                                {isDownloading ? "Descargando..." : "Exportar"}
                            </Button>
                        </div>
                    </div>
                </section>
            </header>

            {isError && error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm flex-shrink-0">
                    <strong>Error:</strong> {(error as Error)?.message || "No se pudo cargar el reporte"}
                </div>
            )}

            <div className="flex-1 min-h-0">
                <div className="h-full bg-background rounded-lg border border-border flex flex-col">
                    <div className="flex items-center justify-between gap-2 border-b border-border p-2">
                        <div className="text-sm text-muted-foreground">
                            {!appliedFilters
                                ? "Presiona 'Buscar' para cargar el reporte"
                                : data.length > 0
                                ? `${data.length} cuentas — ${stats.proveedoresUnicos} proveedores — ${stats.cuentasPendientes} con saldo`
                                : "Sin resultados"}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            {(isFetching || isLoading) && (
                                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Cargando datos...
                                </div>
                            )}

                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10">
                                <Receipt className="size-4 text-primary" />
                                <span className="font-semibold text-primary">{stats.proveedoresUnicos}</span>
                                <span className="text-primary hidden sm:inline">proveedores</span>
                            </div>

                            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10">
                                <AlertCircle className="size-4 text-destructive" />
                                <span className="font-semibold text-destructive">
                                    {formatCurrency(stats.totalSaldo)}
                                </span>
                                <span className="text-destructive text-xs">por pagar</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0">
                        <VirtualizedCustomizableTable
                            table={table}
                            isLoading={isLoading}
                            isFetching={isFetching}
                            isError={isError}
                            errorMessage="Error al cargar el reporte por proveedor"
                            noDataMessage="No se encontraron cuentas en el período seleccionado"
                            rows={20}
                            enableColumnReordering
                            enableSorting
                            estimatedRowHeight={50}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
};

export default CxPBySupplierReportScreen;
