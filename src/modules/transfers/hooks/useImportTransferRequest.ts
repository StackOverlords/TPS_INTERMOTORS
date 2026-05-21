import { useMutation } from "@tanstack/react-query";
import { transferRequestService } from "../services/transferRequestService";

export const useImportTransferRequest = (id: number) => {
    return useMutation({
        mutationFn: () => transferRequestService.import(id),
        // No cache invalidation — caller receives ImportResult and navigates away.
        // The estado transition (IMPORTED) is handled server-side; the request
        // query cache will be stale but the user is no longer on this screen.
    });
};
