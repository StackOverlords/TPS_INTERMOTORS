import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Textarea } from "@/components/atoms/textarea";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { formatCurrency } from "@/utils/formaters";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
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

    // Validación en tiempo real del monto
    const montoValidation = useMemo(() => {
        // Redondear ambos valores a 2 decimales para comparación precisa
        const montoRounded = parseFloat(formData.monto.toFixed(2));
        const saldoRounded = parseFloat(saldoMaximo.toFixed(2));

        if (montoRounded <= 0) {
            return {
                isValid: false,
                message: "El monto debe ser mayor a 0",
                type: "error" as const,
            };
        }
        if (montoRounded > saldoRounded) {
            return {
                isValid: false,
                message: `El monto excede el saldo pendiente (${formatCurrency(saldoRounded)})`,
                type: "error" as const,
            };
        }
        if (montoRounded === saldoRounded) {
            return {
                isValid: true,
                message: "Pago total del saldo pendiente",
                type: "success" as const,
            };
        }
        if (montoRounded > 0 && montoRounded < saldoRounded) {
            return {
                isValid: true,
                message: `Pago parcial. Restará: ${formatCurrency(saldoRounded - montoRounded)}`,
                type: "info" as const,
            };
        }
        return {
            isValid: true,
            message: "",
            type: "info" as const,
        };
    }, [formData.monto, saldoMaximo]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Redondear valores para validación
        const montoRedondeado = parseFloat(formData.monto.toFixed(2));
        const saldoRedondeado = parseFloat(saldoMaximo.toFixed(2));

        // Validaciones
        if (!formData.fecha) {
            showErrorToast({
                title: "Error",
                description: "La fecha es requerida",
            });
            return;
        }

        if (montoRedondeado <= 0) {
            showErrorToast({
                title: "Error",
                description: "El monto debe ser mayor a 0",
            });
            return;
        }

        if (montoRedondeado > saldoRedondeado) {
            showErrorToast({
                title: "Error",
                description: `El monto no puede ser mayor al saldo pendiente (${formatCurrency(saldoRedondeado)})`,
            });
            return;
        }

        const paymentData: CreatePaymentData = {
            id_venta,
            ...formData,
            monto: montoRedondeado,
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
        <form onSubmit={handleSubmit} className="rounded-lg p-4 bg-accent/30 space-y-4">
            <h4 className="font-semibold text-md">Registrar Nuevo Pago</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fecha */}
                <div className="space-y-1">
                    <Label htmlFor="fecha" className="text-sm">
                        Fecha <span className="text-destructive">*</span>
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
                        Tipo de Pago <span className="text-destructive">*</span>
                    </Label>
                    <ComboboxSelect
                        value={formData.tipo_pago}
                        onChange={(value) =>
                            setFormData({
                                ...formData,
                                tipo_pago: value as "EFECTIVO" | "CHEQUE" | "TRASNF" | "QR" | "QR-EFECTIVO",
                            })
                        }
                        options={paymentTypeOptions}
                        optionTag="label"
                        enableAllOption={false}
                    />
                </div>

                {/* Monto */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="monto" className="text-sm">
                            Monto <span className="text-destructive">*</span>
                            <span className="text-xs text-muted-foreground ml-2">
                                (Máx: {formatCurrency(saldoMaximo)})
                            </span>
                        </Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                // Asegurar que el saldo máximo esté redondeado a 2 decimales
                                const rounded = parseFloat(saldoMaximo.toFixed(2));
                                setFormData({ ...formData, monto: rounded });
                            }}
                            className="h-5 text-[10px] px-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50"
                        >
                            Pago total
                        </Button>
                    </div>
                    <div className="relative">
                        <Input
                            id="monto"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formData.monto || ""}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                    setFormData({ ...formData, monto: 0 });
                                    return;
                                }
                                // Redondear a 2 decimales y parsear de nuevo para evitar errores de precisión
                                const rounded = parseFloat(Number(value).toFixed(2));
                                setFormData({ ...formData, monto: rounded });
                            }}
                            required
                            className={`h-9 pr-8 ${
                                formData.monto > 0 && !montoValidation.isValid
                                    ? "border-destructive focus-visible:ring-destructive"
                                    : formData.monto > 0 && montoValidation.type === "success"
                                    ? "border-green-500 focus-visible:ring-green-500"
                                    : ""
                            }`}
                            placeholder="0.00"
                        />
                        {formData.monto > 0 && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                {montoValidation.isValid ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                )}
                            </div>
                        )}
                    </div>
                    {/* Mensaje de validación */}
                    {formData.monto > 0 && montoValidation.message && (
                        <p
                            className={`text-xs flex items-center gap-1 ${
                                montoValidation.type === "error"
                                    ? "text-destructive"
                                    : montoValidation.type === "success"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-blue-600 dark:text-blue-400"
                            }`}
                        >
                            {montoValidation.message}
                        </p>
                    )}
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
                <Button type="submit" disabled={isPending || !montoValidation.isValid}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar Pago
                </Button>
            </div>
        </form>
    );
};
