import { Button } from "@/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/tabs";
import { formatCurrency } from "@/utils/formaters";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { AccountPayable } from "../../types/accountPayable";
import { PaymentsList } from "./PaymentsList";

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
    const [activeTab, setActiveTab] = useState<"info" | "payments">("payments");

    const saldoColor = useMemo(() => {
        if (!accountPayable) return "text-gray-600";
        if (accountPayable.saldo === 0) return "text-green-600";
        if (accountPayable.saldo > 0) return "text-red-600";
        return "text-gray-600";
    }, [accountPayable]);

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
            <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-lg">
                        Venta #{accountPayable.nro_venta} - {accountPayable.cliente.cliente}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Fecha: {new Date(accountPayable.fecha).toLocaleDateString("es-ES")} | Contexto: {accountPayable.contexto}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="payments">Pagos</TabsTrigger>
                        <TabsTrigger value="info">Información</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="flex-1 overflow-auto mt-2 space-y-3">
                        {/* Resumen Financiero - Lo más importante arriba */}
                        <div className="rounded-md p-3 bg-gray-50 border border-gray-200">
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div>
                                    <span className="text-gray-500 text-xs block mb-0.5">Total Vendido</span>
                                    <p className="text-lg font-bold text-blue-600">
                                        {formatCurrency(accountPayable.total_vendido)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs block mb-0.5">Total Pagado</span>
                                    <p className="text-lg font-bold text-green-600">
                                        {formatCurrency(accountPayable.total_pagado)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs block mb-0.5">Saldo Pendiente</span>
                                    <p className={`text-lg font-bold ${saldoColor}`}>
                                        {formatCurrency(accountPayable.saldo)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Grid de 2 columnas para aprovechar espacio */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Cliente */}
                            <div className="rounded-md p-2 border border-gray-200">
                                <h3 className="font-semibold text-sm mb-1.5 text-gray-700">Cliente</h3>
                                <div className="space-y-1 text-xs">
                                    <div>
                                        <span className="text-gray-500">Nombre:</span>
                                        <p className="font-medium">{accountPayable.cliente.cliente}</p>
                                    </div>
                                    {accountPayable.cliente.nit && (
                                        <div>
                                            <span className="text-gray-500">NIT:</span>
                                            <p className="font-medium">{accountPayable.cliente.nit}</p>
                                        </div>
                                    )}
                                    {accountPayable.cliente.contacto && (
                                        <div>
                                            <span className="text-gray-500">Contacto:</span>
                                            <p className="font-medium">{accountPayable.cliente.contacto}</p>
                                        </div>
                                    )}
                                    {accountPayable.cliente.direccion && (
                                        <div>
                                            <span className="text-gray-500">Dirección:</span>
                                            <p className="font-medium text-xs">{accountPayable.cliente.direccion}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detalles de Venta */}
                            <div className="rounded-md p-2 border border-gray-200">
                                <h3 className="font-semibold text-sm mb-1.5 text-gray-700">Detalles de Venta</h3>
                                <div className="space-y-1 text-xs">
                                    {accountPayable.plazo_pago && (
                                        <div>
                                            <span className="text-gray-500">Plazo de Pago:</span>
                                            <p className="font-medium">
                                                {new Date(accountPayable.plazo_pago).toLocaleDateString("es-ES")}
                                            </p>
                                        </div>
                                    )}
                                    {accountPayable.comprobantes && (
                                        <div>
                                            <span className="text-gray-500">Comprobantes:</span>
                                            <p className="font-medium">{accountPayable.comprobantes}</p>
                                        </div>
                                    )}
                                    {accountPayable.responsable && (
                                        <>
                                            <div className="pt-1 border-t border-gray-200 mt-1">
                                                <span className="text-gray-500 font-semibold">Responsable:</span>
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {accountPayable.responsable.nombre}{" "}
                                                    {accountPayable.responsable.apellido_paterno}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">{accountPayable.responsable.dni_tipo}:</span>
                                                <span className="font-medium ml-1">{accountPayable.responsable.dni}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Comentarios si existen */}
                        {accountPayable.comentarios && (
                            <div className="rounded-md p-2 border border-gray-200">
                                <h3 className="font-semibold text-sm mb-1 text-gray-700">Comentarios</h3>
                                <p className="text-xs text-gray-700">{accountPayable.comentarios}</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="payments" className="flex-1 overflow-hidden mt-2">
                        <PaymentsList
                            id_venta={accountPayable.id}
                            saldoPendiente={accountPayable.saldo}
                            onPaymentChange={onPaymentChange}
                        />
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
