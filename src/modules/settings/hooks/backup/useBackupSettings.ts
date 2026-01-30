import { useQuery } from "@tanstack/react-query";
import { getBackupSettings } from "../../services/backupService";

export const useBackupSettings = () => {
    return useQuery({
        queryKey: ["backup-settings"],
        queryFn: getBackupSettings,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
};
