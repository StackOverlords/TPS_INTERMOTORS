import { Button } from "@/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { formatCurrency } from "@/utils/formaters";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import type { AccountPayable } from "../../types/accountPayable";
import { PaymentsList } from "./PaymentsList";
import { useSaleGetById } from "@/modules/sales/hooks/useSaleGetById";
import SaleProductsSection from "@/modules/sales/components/saleDetail/SaleProducts";

interface AccountPayableDetailModalProps {
    accountPayable: AccountPayable | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPaymentChange?: () => void;
}

export const AccountPayableDetailModal = ({
    accountPayable,
    open,
    onOpenChange,
    onPaymentChange,
}: AccountPayableDetailModalProps) => {
    // Obtener detalles completos de la venta
    const { data: saleData, isLoading: isLoadingSale } = useSaleGetById(accountPayable?.id ?? 0);

    const saldoColor = useMemo(() => {
        if (!accountPayable) return "text-gray-600";
        if (accountPayable.saldo === 0) return "text-green-600";
        if (accountPayable.saldo > 0) return "text-red-600";
        return "text-gray-600";
    }, [accountPayable]);

    const totalVenta = useMemo(() => {
        if (!saleData?.detalles) return 0;
        return saleData.detalles.reduce((total, detalle) => {
            const subtotal = detalle.precio * detalle.cantidad;
            const descuento = detalle.porcentaje_descuento != null
                ? (1 - detalle.porcentaje_descuento / 100)
                : 1;
            return total + subtotal * descuento;
        }, 0);
    }, [saleData?.detalles]);

    if (!accountPayable) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-center h-96">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-2 flex-shrink-0">
                    <DialogTitle className="text-base">
                        Venta #{accountPayable.nro_venta} - {accountPayable.cliente.cliente}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Fecha: {new Date(accountPayable.fecha).toLocaleDateString("es-ES")} | Contexto: {accountPayable.contexto}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto space-y-2">
                    {/* Información General - Compacta */}
                    <div className="flex-shrink-0">
                        {/* Resumen Financiero - Grid de 5 columnas compacto */}
                        <div className="rounded-md p-2 border border-gray-200 bg-white shadow-sm">
                            <div className="grid grid-cols-5 gap-2 text-center text-xs">
                                <div>
                                    <span className="text-gray-500 block mb-0.5">Total Vendido</span>
                                    <p className="text-sm font-bold text-blue-600">
                                        {formatCurrency(accountPayable.total_vendido)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500 block mb-0.5">Total Pagado</span>
                                    <p className="text-sm font-bold text-green-600">
                                        {formatCurrency(accountPayable.total_pagado)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500 block mb-0.5">Saldo Pendiente</span>
                                    <p className={`text-sm font-bold ${saldoColor}`}>
                                        {formatCurrency(accountPayable.saldo)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500 block mb-0.5">Plazo de Pago</span>
                                    <p className="text-sm font-medium">
                                        {accountPayable.plazo_pago
                                            ? new Date(accountPayable.plazo_pago).toLocaleDateString("es-ES")
                                            : "Sin plazo"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500 block mb-0.5">Comprobantes</span>
                                    <p className="text-sm font-medium">{accountPayable.comprobantes || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grid de 2 columnas: Pagos | Productos */}
                    <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
                        {/* Columna Izquierda: Pagos */}
                        <div className="flex flex-col min-h-0">
                            <PaymentsList
                                id_venta={accountPayable.id}
                                saldoPendiente={accountPayable.saldo}
                                onPaymentChange={onPaymentChange}
                            />
                        </div>

                        {/* Columna Derecha: Productos */}
                        <div className="flex flex-col min-h-0">
                            <SaleProductsSection
                                products={saleData?.detalles ?? []}
                                isLoading={isLoadingSale}
                                totalAmount={totalVenta}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
