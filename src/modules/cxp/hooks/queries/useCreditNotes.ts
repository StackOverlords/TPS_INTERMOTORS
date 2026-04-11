import { useQuery } from "@tanstack/react-query";
import { CXP_QUERY_KEYS } from "@/lib/queryKeys";
import { creditNoteService } from "../../services/creditNoteService";

const useCreditNotes = (id_compra: number, enabled = true) => {
    return useQuery({
        queryKey: CXP_QUERY_KEYS.creditNotes(id_compra),
        queryFn: () => creditNoteService.list(id_compra),
        enabled: enabled && !!id_compra,
    });
};

export default useCreditNotes;
