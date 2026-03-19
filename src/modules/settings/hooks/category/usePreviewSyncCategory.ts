import { useQuery } from "@tanstack/react-query";
import { CATEGORY_QUERY_KEYS } from "../../constants/categoryQueryKeys";
import { categoriesService } from "../../services/category.service";

export const usePreviewSyncCategory = (id: number, patron_descripcion: string) => {
    return useQuery({
        queryKey: CATEGORY_QUERY_KEYS.syncPreview(id, patron_descripcion),
        queryFn: () => categoriesService.syncPreview(id, patron_descripcion),
        enabled: !!id && patron_descripcion.trim().length > 0,
        staleTime: 1000 * 30, // 30 segundos — es un preview, puede cambiar
    });
};
