import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBackupSettings } from "../../services/backupService";
import { toast } from "sonner";

export const useUpdateBackupSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ cron, dias_retencion }: { cron: string; dias_retencion: number }) =>
            updateBackupSettings(cron, dias_retencion),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["backup-settings"] });
            toast.success("Configuración de backups actualizada correctamente");
        },
        onError: (error: any) => {
            const message = error?.message || "Error al actualizar la configuración";
            toast.error(message);
        },
    });
};
