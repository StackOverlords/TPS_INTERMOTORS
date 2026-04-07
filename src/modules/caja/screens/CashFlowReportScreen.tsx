import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/table";
import { useBranchStore } from "@/states/branchStore";
import { useState } from "react";
import { useCashFlowReport } from "../hooks/useCashFlowReport";

const formatCurrency = (amount: number) =>
    `Bs ${amount.toFixed(2)}`;

const CashFlowReportScreen = () => {
    const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
    const branchId = Number(selectedBranchId);

    const today = new Date().toISOString().slice(0, 10);
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .slice(0, 10);

    const [fechaInicio, setFechaInicio] = useState(firstOfMonth);
    const [fechaFin, setFechaFin] = useState(today);
    const [appliedFilters, setAppliedFilters] = useState<{
        sucursalId: number;
        fechaInicio: string;
        fechaFin: string;
    } | null>(null);

    const { data, isLoading, isError } = useCashFlowReport({
        sucursalId: appliedFilters?.sucursalId ?? 0,
        fechaInicio: appliedFilters?.fechaInicio ?? '',
        fechaFin: appliedFilters?.fechaFin ?? '',
    });

    const handleGenerateReport = () => {
        if (!branchId || !fechaInicio || !fechaFin) return;
        setAppliedFilters({ sucursalId: branchId, fechaInicio, fechaFin });
    };

    return (
        <main className="h-full p-2 gap-2 flex flex-col overflow-auto">
            <header className="bg-background rounded-lg p-2 space-y-2 border border-border flex-shrink-0">
                <h1 className="text-lg font-bold text-primary">Reporte de Flujo de Caja</h1>
                <div className="flex items-end gap-2 flex-wrap">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">Fecha inicio</label>
                        <Input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">Fecha fin</label>
                        <Input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <Button
                        size="sm"
                        onClick={handleGenerateReport}
                        disabled={!branchId || !fechaInicio || !fechaFin || isLoading}
                    >
                        {isLoading ? 'Cargando...' : 'Generar reporte'}
                    </Button>
                </div>
            </header>

            {isError && (
                <p className="text-sm text-destructive p-2">
                    Ocurrió un error al cargar el reporte. Intentá de nuevo.
                </p>
            )}

            {data && (
                <div className="flex flex-col gap-3">
                    {/* Totales */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen general</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Total ingresos</span>
                                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(data.total_ingresos)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Total egresos</span>
                                    <span className="text-xl font-bold text-red-600 dark:text-red-400">
                                        {formatCurrency(data.total_egresos)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Saldo neto</span>
                                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                        {formatCurrency(data.saldo_neto)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Por concepto */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Por concepto</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Concepto</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.por_concepto.map((item) => (
                                            <TableRow key={`${item.concepto}-${item.tipo_movimiento}`}>
                                                <TableCell className="font-medium">{item.concepto_label}</TableCell>
                                                <TableCell>
                                                    <Badge variant={item.tipo_movimiento === 'INGRESO' ? 'success' : 'danger'}>
                                                        {item.tipo_movimiento}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(item.total)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {data.por_concepto.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                    Sin datos
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Por forma de pago */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Por forma de pago</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Forma de pago</TableHead>
                                            <TableHead className="text-right">Ingresos</TableHead>
                                            <TableHead className="text-right">Egresos</TableHead>
                                            <TableHead className="text-right">Saldo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.por_forma_pago.map((item) => (
                                            <TableRow key={item.forma_pago}>
                                                <TableCell className="font-medium">{item.forma_pago_label}</TableCell>
                                                <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(item.total_ingresos)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-red-600 dark:text-red-400">
                                                    {formatCurrency(item.total_egresos)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-blue-600 dark:text-blue-400">
                                                    {formatCurrency(item.saldo)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {data.por_forma_pago.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                    Sin datos
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Flujo diario */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Flujo diario</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead className="text-right">Ingresos</TableHead>
                                            <TableHead className="text-right">Egresos</TableHead>
                                            <TableHead className="text-right">Saldo neto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.flujo_diario.map((item) => (
                                            <TableRow key={item.fecha}>
                                                <TableCell className="font-mono text-sm">{item.fecha}</TableCell>
                                                <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(item.total_ingresos)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-red-600 dark:text-red-400">
                                                    {formatCurrency(item.total_egresos)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-blue-600 dark:text-blue-400">
                                                    {formatCurrency(item.saldo_neto)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {data.flujo_diario.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                    Sin datos
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </main>
    );
};

export default CashFlowReportScreen;
