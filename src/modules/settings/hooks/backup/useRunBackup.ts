import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runBackup } from "../../services/backupService";
import { toast } from "sonner";

export const useRunBackup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: runBackup,
        onSuccess: () => {
            toast.success("Backup iniciado en segundo plano");
            queryClient.invalidateQueries({ queryKey: ["backup-files"] });
        },
        onError: (error: any) => {
            const message = error?.message || "Error al iniciar el backup";
            toast.error(message);
        },
    });
};
