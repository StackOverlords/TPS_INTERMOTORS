import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Textarea } from "@/components/atoms/textarea";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useCreatePayment } from "../../hooks/mutations/useCreatePayment";
import { usePaymentTypes } from "../../hooks/queries/usePaymentTypes";
import type { CreatePaymentData } from "../../schemas/createPayment.schema";

interface CreatePaymentFormProps {
    id_venta: number;
    saldoMaximo: number;
    onSuccess: () => void;
    onCancel: () => void;
}

export const CreatePaymentForm = ({
    id_venta,
    saldoMaximo,
    onSuccess,
    onCancel,
}: CreatePaymentFormProps) => {
    const [formData, setFormData] = useState<Omit<CreatePaymentData, "id_venta">>({
        fecha: new Date().toISOString().split("T")[0],
        tipo_pago: "EFECTIVO",
        monto: 0,
        comentarios: "",
    });

    const { data: paymentTypesData } = usePaymentTypes();
    const { mutate: createPayment, isPending } = useCreatePayment();

    const paymentTypeOptions = useMemo(() => {
        if (!paymentTypesData) return [];
        return Object.entries(paymentTypesData).map(([id, label]) => ({
            id,
            label: label as string,
        }));
    }, [paymentTypesData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones
        if (!formData.fecha) {
            showErrorToast({
                title: "Error",
                description: "La fecha es requerida",
            });
            return;
        }

        if (formData.monto <= 0) {
            showErrorToast({
                title: "Error",
                description: "El monto debe ser mayor a 0",
            });
            return;
        }

        if (formData.monto > saldoMaximo) {
            showErrorToast({
                title: "Error",
                description: `El monto no puede ser mayor al saldo pendiente (${saldoMaximo})`,
            });
            return;
        }

        const paymentData: CreatePaymentData = {
            id_venta,
            ...formData,
        };

        createPayment(paymentData, {
            onSuccess: () => {
                showSuccessToast({
                    title: "Pago registrado",
                    description: "El pago se registró exitosamente",
                });
                onSuccess();
            },
            onError: (error) => {
                showErrorToast({
                    title: "Error al registrar pago",
                    description: error instanceof Error ? error.message : "Error desconocido",
                });
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="font-semibold text-md">Registrar Nuevo Pago</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fecha */}
                <div className="space-y-1">
                    <Label htmlFor="fecha" className="text-sm">
                        Fecha <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={(e) =>
                            setFormData({ ...formData, fecha: e.target.value })
                        }
                        required
                        className="h-9"
                    />
                </div>

                {/* Tipo de Pago */}
                <div className="space-y-1">
                    <Label htmlFor="tipo_pago" className="text-sm">
                        Tipo de Pago <span className="text-red-500">*</span>
                    </Label>
                    <ComboboxSelect
                        value={formData.tipo_pago}
                        onChange={(value) =>
                            setFormData({
                                ...formData,
                                tipo_pago: value as "EFECTIVO" | "CHEQUE" | "TRASNF",
                            })
                        }
                        options={paymentTypeOptions}
                        optionTag="label"
                        enableAllOption={false}
                    />
                </div>

                {/* Monto */}
                <div className="space-y-1">
                    <Label htmlFor="monto" className="text-sm">
                        Monto <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="monto"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={saldoMaximo}
                        value={formData.monto}
                        onChange={(e) =>
                            setFormData({ ...formData, monto: Number(e.target.value) })
                        }
                        required
                        className="h-9"
                        placeholder={`Máx: ${saldoMaximo}`}
                    />
                </div>
            </div>

            {/* Comentarios */}
            <div className="space-y-1">
                <Label htmlFor="comentarios" className="text-sm">
                    Comentarios
                </Label>
                <Textarea
                    id="comentarios"
                    value={formData.comentarios}
                    onChange={(e) =>
                        setFormData({ ...formData, comentarios: e.target.value })
                    }
                    placeholder="Comentarios adicionales sobre el pago..."
                    rows={2}
                    className="resize-none"
                />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar Pago
                </Button>
            </div>
        </form>
    );
};
