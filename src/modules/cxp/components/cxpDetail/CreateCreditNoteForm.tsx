import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Textarea } from "@/components/atoms/textarea";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useBranchStore } from "@/states/branchStore";
import { formatCurrency } from "@/utils/formaters";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import useCreateCreditNote from "../../hooks/mutations/useCreateCreditNote";

interface CreateCreditNoteFormProps {
    id_compra: number;
    proveedor_id: number;
    saldoMaximo: number;
    onSuccess: () => void;
    onCancel: () => void;
}

export const CreateCreditNoteForm = ({
    id_compra,
    proveedor_id,
    saldoMaximo,
    onSuccess,
    onCancel,
}: CreateCreditNoteFormProps) => {
    const { selectedBranchId } = useBranchStore();
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split("T")[0],
        monto: 0,
        comentarios: "",
    });

    const { mutate: createCreditNote, isPending } = useCreateCreditNote();

    const montoValidation = useMemo(() => {
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
                message: "Nota de crédito total del saldo pendiente",
                type: "success" as const,
            };
        }
        return {
            isValid: true,
            message: `Nota parcial. Restará: ${formatCurrency(saldoRounded - montoRounded)}`,
            type: "info" as const,
        };
    }, [formData.monto, saldoMaximo]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const montoRedondeado = parseFloat(formData.monto.toFixed(2));

        if (!formData.fecha) {
            showErrorToast({ title: "Error", description: "La fecha es requerida" });
            return;
        }
        if (montoRedondeado <= 0) {
            showErrorToast({ title: "Error", description: "El monto debe ser mayor a 0" });
            return;
        }

        createCreditNote(
            {
                id_compra,
                proveedor_id,
                unidad_organizativa_id: Number(selectedBranchId),
                fecha: formData.fecha,
                monto: montoRedondeado,
                comentarios: formData.comentarios || null,
            },
            {
                onSuccess: () => {
                    showSuccessToast({
                        title: "Nota de crédito registrada",
                        description: "La nota de crédito se registró exitosamente",
                    });
                    onSuccess();
                },
                onError: (error) => {
                    showErrorToast({
                        title: "Error al registrar nota de crédito",
                        description: error instanceof Error ? error.message : "Error desconocido",
                    });
                },
            }
        );
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-lg p-4 bg-accent/30 space-y-4">
            <h4 className="font-semibold text-md">Registrar Nota de Crédito</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fecha */}
                <div className="space-y-1">
                    <Label htmlFor="nc-fecha" className="text-sm">
                        Fecha <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="nc-fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        required
                        className="h-9"
                    />
                </div>

                {/* Monto */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="nc-monto" className="text-sm">
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
                                const rounded = parseFloat(saldoMaximo.toFixed(2));
                                setFormData({ ...formData, monto: rounded });
                            }}
                            className="h-5 text-[10px] px-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50"
                        >
                            Total
                        </Button>
                    </div>
                    <div className="relative">
                        <Input
                            id="nc-monto"
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
                <Label htmlFor="nc-comentarios" className="text-sm">
                    Comentarios
                </Label>
                <Textarea
                    id="nc-comentarios"
                    value={formData.comentarios}
                    onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                    placeholder="Comentarios sobre la nota de crédito..."
                    rows={2}
                    className="resize-none"
                />
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isPending || !montoValidation.isValid}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar Nota
                </Button>
            </div>
        </form>
    );
};
