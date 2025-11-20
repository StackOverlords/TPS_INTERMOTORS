import { useMutation } from "@tanstack/react-query";
import { salesService } from "../services/salesService";

export const useDeleteSaleDetail = () => {
    // const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (idDetail: number) => salesService.deleteDetail(idDetail),
        onSuccess: () => {
            // queryClient.invalidateQueries({ queryKey: ["quotations", "details"] });
        },
        retry: false,
        networkMode: "offlineFirst",
        gcTime: 1000 * 60 * 3,
    });
};
