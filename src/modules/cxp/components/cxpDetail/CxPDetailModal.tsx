import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/atoms/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/atoms/tabs";
import { formatCurrency } from "@/utils/formaters";
import { Loader2 } from "lucide-react";
import type { CxPListItem } from "../../schemas/cxpReport.schema";
import { CxPPaymentsList } from "./CxPPaymentsList";
import { CreditNotesList } from "./CreditNotesList";

interface CxPDetailModalProps {
    cxp: CxPListItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDataChange?: () => void;
}

export const CxPDetailModal = ({
    cxp,
    open,
    onOpenChange,
    onDataChange,
}: CxPDetailModalProps) => {
    if (!cxp) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-center h-96">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const saldoColor =
        cxp.saldo === 0
            ? "text-emerald-600 dark:text-emerald-400"
            : cxp.saldo > 0
            ? "text-destructive"
            : "text-muted-foreground";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-2 flex-shrink-0">
                    <DialogTitle className="text-base">
                        Compra #{cxp.nro_compra} — {cxp.proveedor.proveedor}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Fecha: {new Date(cxp.fecha).toLocaleDateString("es-ES")}
                        {cxp.plazo_pago && (
                            <> | Plazo: {new Date(cxp.plazo_pago).toLocaleDateString("es-ES")}</>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto space-y-2">
                    {/* Resumen financiero */}
                    <div className="rounded-md p-2 border border-border bg-card shadow-sm flex-shrink-0">
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div>
                                <span className="text-muted-foreground block mb-0.5">Total Compra</span>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(cxp.total_comprado)}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-0.5">Total Pagado</span>
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(cxp.total_pagado)}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-0.5">Saldo Pendiente</span>
                                <p className={`text-sm font-bold ${saldoColor}`}>
                                    {formatCurrency(cxp.saldo)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs: Pagos | Notas de Crédito */}
                    <Tabs defaultValue="pagos" className="flex-1 min-h-0">
                        <TabsList className="w-full">
                            <TabsTrigger value="pagos" className="flex-1">
                                Pagos
                            </TabsTrigger>
                            <TabsTrigger value="notas-credito" className="flex-1">
                                Notas de Crédito
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pagos" className="mt-2">
                            <CxPPaymentsList
                                id_compra={cxp.id}
                                proveedor_id={cxp.proveedor.id}
                                saldoPendiente={cxp.saldo}
                                onPaymentChange={onDataChange}
                            />
                        </TabsContent>

                        <TabsContent value="notas-credito" className="mt-2">
                            <CreditNotesList
                                id_compra={cxp.id}
                                proveedor_id={cxp.proveedor.id}
                                saldoPendiente={cxp.saldo}
                                onCreditNoteChange={onDataChange}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
