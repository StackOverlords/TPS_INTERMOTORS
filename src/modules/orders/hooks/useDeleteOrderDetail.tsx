import { useMutation } from "@tanstack/react-query";
import { orderService } from "../services/order.service";

export const useDeleteOrderDetail = () => {
    // const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (idDetail: number) => orderService.deleteDetail(idDetail),
        onSuccess: () => { },
        retry: false,
        networkMode: "offlineFirst",
        gcTime: 1000 * 60 * 3,
    });
};
