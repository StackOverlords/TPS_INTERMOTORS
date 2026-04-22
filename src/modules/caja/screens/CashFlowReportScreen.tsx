import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Card, CardContent } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/tabs";
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

const formatCurrency = (amount: number) => `Bs ${amount.toFixed(2)}`;

const toISO = (d: Date) => d.toISOString().slice(0, 10);

const getPreset = (preset: '15d' | '1m' | '3m') => {
  const end = new Date();
  const start = new Date();
  if (preset === '15d') start.setDate(start.getDate() - 14);
  if (preset === '1m')  start.setMonth(start.getMonth() - 1);
  if (preset === '3m')  start.setMonth(start.getMonth() - 3);
  return { start: toISO(start), end: toISO(end) };
};

const CashFlowReportScreen = () => {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const branchId = Number(selectedBranchId);

  const initial = getPreset('15d');

  const [fechaInicio, setFechaInicio] = useState(initial.start);
  const [fechaFin, setFechaFin] = useState(initial.end);
  const [appliedFilters, setAppliedFilters] = useState({
    sucursalId: branchId,
    fechaInicio: initial.start,
    fechaFin: initial.end,
  });

  const { data, isLoading, isError } = useCashFlowReport({
    sucursalId: appliedFilters?.sucursalId ?? 0,
    fechaInicio: appliedFilters?.fechaInicio ?? '',
    fechaFin: appliedFilters?.fechaFin ?? '',
  });

  const handleGenerateReport = (inicio = fechaInicio, fin = fechaFin) => {
    if (!branchId || !inicio || !fin) return;
    setAppliedFilters({ sucursalId: branchId, fechaInicio: inicio, fechaFin: fin });
  };

  const handlePreset = (preset: '15d' | '1m' | '3m') => {
    const { start, end } = getPreset(preset);
    setFechaInicio(start);
    setFechaFin(end);
    handleGenerateReport(start, end);
  };

  return (
    <main className="h-full p-2 gap-2 flex flex-col overflow-hidden">
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
            onClick={() => handleGenerateReport()}
            disabled={!branchId || !fechaInicio || !fechaFin || isLoading}
          >
            {isLoading ? 'Cargando...' : 'Generar reporte'}
          </Button>
          <div className="flex gap-1 ml-auto">
            <Button size="sm" variant="outline" disabled={!branchId || isLoading} onClick={() => handlePreset('15d')}>
              Últimos 15 días
            </Button>
            <Button size="sm" variant="outline" disabled={!branchId || isLoading} onClick={() => handlePreset('1m')}>
              Último mes
            </Button>
            <Button size="sm" variant="outline" disabled={!branchId || isLoading} onClick={() => handlePreset('3m')}>
              Últimos 3 meses
            </Button>
          </div>
        </div>
      </header>

      {isError && (
        <p className="text-sm text-destructive p-2 flex-shrink-0">
          Ocurrió un error al cargar el reporte. Intentá de nuevo.
        </p>
      )}

      {data && (
        <Tabs defaultValue="concepto" className="flex flex-col flex-1 min-h-0">
          {/* Resumen fijo arriba — siempre visible sin importar el tab */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-shrink-0">
            <Card>
              <CardContent className="p-3 flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Total ingresos</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(data.total_ingresos)}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Total egresos</span>
                <span className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(data.total_egresos)}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Saldo neto</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(data.saldo_neto)}
                </span>
              </CardContent>
            </Card>
          </div>

          <TabsList className="flex-shrink-0 w-full justify-start">
            <TabsTrigger value="concepto">Por concepto</TabsTrigger>
            <TabsTrigger value="forma_pago">Por forma de pago</TabsTrigger>
            <TabsTrigger value="flujo_diario">Flujo diario</TabsTrigger>
          </TabsList>

          <TabsContent value="concepto" className="flex-1 min-h-0 overflow-auto mt-0">
            <Card className="h-full rounded-t-none border-t-0">
              <CardContent className="p-0">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forma_pago" className="flex-1 min-h-0 overflow-auto mt-0">
            <Card className="h-full rounded-t-none border-t-0">
              <CardContent className="p-0">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flujo_diario" className="flex-1 min-h-0 overflow-auto mt-0">
            <Card className="h-full rounded-t-none border-t-0">
              <CardContent className="p-0">
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
};

export default CashFlowReportScreen;
