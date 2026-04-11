import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ACCOUNTS_PAYABLE_QUERY_KEYS, CXP_QUERY_KEYS } from "@/lib/queryKeys";
import { creditNoteService } from "../../services/creditNoteService";
import type { CreateCreditNoteData } from "../../schemas/creditNote.schema";

interface CreateCreditNoteParams extends Omit<CreateCreditNoteData, "id_compra"> {
    id_compra: number;
}

const useCreateCreditNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id_compra, ...data }: CreateCreditNoteParams) =>
            creditNoteService.create(id_compra, data),
        onSuccess: (_data, variables) => {
            // Invalidar notas de crédito de esta compra específica
            queryClient.invalidateQueries({
                queryKey: CXP_QUERY_KEYS.creditNotes(variables.id_compra),
            });
            // Invalidar lista paginada de CxP para refrescar saldos
            queryClient.invalidateQueries({
                queryKey: ACCOUNTS_PAYABLE_QUERY_KEYS.lists(),
            });
        },
    });
};

export default useCreateCreditNote;
