import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import {
    CreditNoteListResponseSchema,
    CreditNoteSchema,
    type CreditNote,
    type CreditNoteListResponse,
    type CreateCreditNoteData,
} from "../schemas/creditNote.schema";
import { CXP_ENDPOINTS } from "./endpoints";

const MODULE_NAME = "CREDIT_NOTE_SERVICE";

export const creditNoteService = {
    /**
     * Obtener todas las notas de crédito de una compra
     */
    async list(id_compra: number): Promise<CreditNoteListResponse> {
        Logger.info("Fetching credit notes", { id_compra }, MODULE_NAME);
        const response = await ApiService.get(
            CXP_ENDPOINTS.createCreditNote(id_compra),
            CreditNoteListResponseSchema,
        );
        Logger.info("Credit notes fetched successfully", { count: response.data.length }, MODULE_NAME);
        return response as CreditNoteListResponse;
    },

    /**
     * Crear una nota de crédito contra una compra
     *
     * POST /api/v1/accounts-payable/actions/credit-notes/{id_compra}
     */
    async create(id_compra: number, data: Omit<CreateCreditNoteData, 'id_compra'>): Promise<CreditNote> {
        Logger.info("Creating credit note", { id_compra, data }, MODULE_NAME);
        const response = await ApiService.post(
            CXP_ENDPOINTS.createCreditNote(id_compra),
            data,
            CreditNoteSchema,
        );
        Logger.info("Credit note created successfully", {}, MODULE_NAME);
        return response as CreditNote;
    },
};
