import { useQuery } from "@tanstack/react-query";
import { fetchBackups } from "../../services/backupService";

export const useFetchBackups = (pagina: number = 1, pagina_registros: number = 20) => {
    return useQuery({
        queryKey: ["backup-files", pagina, pagina_registros],
        queryFn: () => fetchBackups(pagina, pagina_registros),
        staleTime: 1000 * 30, // 30 segundos
    });
};
