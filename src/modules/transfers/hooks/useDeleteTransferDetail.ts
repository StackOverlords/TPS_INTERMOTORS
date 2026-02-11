import { useMutation } from "@tanstack/react-query";
import { transferService } from "../services/transfer.service";

export const useDeleteTransferDetail = () => {
    return useMutation({
        mutationFn: (idDetail: number) => transferService.deleteDetail(idDetail),
        retry: false,
        networkMode: "offlineFirst",
        gcTime: 1000 * 60 * 3,
    });
};
