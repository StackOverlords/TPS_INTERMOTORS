import { useMutation } from "@tanstack/react-query";
import { returnService } from "../services/return.service";

export const useDeleteReturnDetail = () => {
    // const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (idDetail: number) => returnService.deleteDetail(idDetail),
        onSuccess: () => { },
        retry: false,
        networkMode: "offlineFirst",
        gcTime: 1000 * 60 * 3,
    });
};
