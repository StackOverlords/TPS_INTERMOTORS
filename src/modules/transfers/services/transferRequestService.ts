import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import type {
    CreateTransferRequestPayload,
    FulfillDirectResult,
    ImportResult,
    TransferRequest,
} from "../types/transferRequest.types";
import { TRANSFER_REQUEST_ENDPOINTS } from "./transferRequestEndpoints.service";

const MODULE_NAME = "TRANSFER_REQUEST_SERVICE";

export const transferRequestService = {
    /**
     * Create a new transfer request
     * @param data - Transfer request payload
     */
    async create(data: CreateTransferRequestPayload): Promise<TransferRequest> {
        Logger.info("Creating Transfer Request", { data }, MODULE_NAME);

        const response = await ApiService.post<TransferRequest>(
            TRANSFER_REQUEST_ENDPOINTS.base,
            data,
        );

        Logger.info("Transfer Request created successfully", undefined, MODULE_NAME);
        return response;
    },

    /**
     * Get a transfer request by ID
     * @param id - Transfer request ID
     */
    async getById(id: number): Promise<TransferRequest> {
        Logger.info("Fetching Transfer Request", { id }, MODULE_NAME);

        const response = await ApiService.get<TransferRequest>(
            TRANSFER_REQUEST_ENDPOINTS.byId(id),
        );

        Logger.info("Transfer Request fetched successfully", { id }, MODULE_NAME);
        return response;
    },

    /**
     * Dry-run FIFO check — returns what would be sent/adjusted/skipped without creating anything.
     * @param id - Transfer request ID
     */
    async previewFulfillDirect(id: number): Promise<Pick<FulfillDirectResult, "fulfilled_items" | "skipped_items">> {
        Logger.info("Previewing fulfill direct", { id }, MODULE_NAME);

        const response = await ApiService.get<Pick<FulfillDirectResult, "fulfilled_items" | "skipped_items">>(
            TRANSFER_REQUEST_ENDPOINTS.fulfillDirectPreview(id),
        );

        Logger.info("Preview fetched", { id }, MODULE_NAME);
        return response;
    },

    /**
     * Fulfill a transfer request directly from stock
     * @param id - Transfer request ID
     */
    async fulfillDirect(id: number): Promise<FulfillDirectResult> {
        Logger.info("Fulfilling Transfer Request directly", { id }, MODULE_NAME);

        const response = await ApiService.post<FulfillDirectResult>(
            TRANSFER_REQUEST_ENDPOINTS.fulfillDirect(id),
        );

        Logger.info("Transfer Request fulfilled successfully", { id }, MODULE_NAME);
        return response;
    },

    /**
     * Import a transfer request — resolves lot data and transitions estado to IMPORTED.
     * Uses POST because the call has a server-side state transition side effect.
     * @param id - Transfer request ID
     */
    async import(id: number): Promise<ImportResult> {
        Logger.info("Importing Transfer Request", { id }, MODULE_NAME);

        const response = await ApiService.post<ImportResult>(
            TRANSFER_REQUEST_ENDPOINTS.import(id),
        );

        Logger.info("Transfer Request imported successfully", { id }, MODULE_NAME);
        return response;
    },

    /**
     * Link a created transfer to an imported request and mark it as fulfilled.
     * Called after the recipient creates the actual transfer from an import prefill.
     * @param id - Transfer request ID
     * @param transferId - ID of the ProductTransfer that was created
     */
    async cancel(id: number): Promise<void> {
        Logger.info("Cancelling Transfer Request", { id }, MODULE_NAME);
        await ApiService.post(TRANSFER_REQUEST_ENDPOINTS.cancel(id));
        Logger.info("Transfer Request cancelled", { id }, MODULE_NAME);
    },

    async reject(id: number): Promise<void> {
        Logger.info("Rejecting Transfer Request", { id }, MODULE_NAME);
        await ApiService.post(TRANSFER_REQUEST_ENDPOINTS.reject(id));
        Logger.info("Transfer Request rejected", { id }, MODULE_NAME);
    },

    async linkTransfer(id: number, transferId: number): Promise<void> {
        Logger.info("Linking transfer to request", { id, transferId }, MODULE_NAME);

        await ApiService.post(
            TRANSFER_REQUEST_ENDPOINTS.linkTransfer(id),
            { transfer_id: transferId },
        );

        Logger.info("Transfer request linked and fulfilled", { id }, MODULE_NAME);
    },
};
