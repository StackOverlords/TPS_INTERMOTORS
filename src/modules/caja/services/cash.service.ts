import { ApiService } from "@/lib/apiService";
import apiClient from "@/services/axios";
import { downloadPDF } from "@/lib/pdfUtils";
import { useDownloadStore } from "@/states/downloadStore";
import { Logger } from "@/lib/logger";
import { CashMovementSchema, CashMovementListResponseSchema } from "../schemas/cashMovement.schema";
import { CashSessionSchema, CashSessionListResponseSchema, CashSessionArqueoSchema } from "../schemas/cashSession.schema";
import { ExpenseTypeSchema, ExpenseTypeListSchema } from "../schemas/expenseType.schema";
import { CashFlowReportSchema } from "../schemas/cashFlowReport.schema";
import type { CashFlowReport } from "../types/cashFlowReport.types";
import type { CloseSessionPayload, OpenSessionPayload, CashSession, CashSessionArqueo } from "../types/cashSession.types";
import type { ExpenseType, CreateExpenseTypePayload, UpdateExpenseTypePayload } from "../types/expenseType.types";
import type { CashMovement, IncomePayload, WithdrawalPayload, ExpensePayload } from "../types/cashMovement.types";
import type { CashSessionFilters, CashMovementFilters } from "../types/cashFilters.types";
import { CASH_ENDPOINTS } from "./cashEndpoints.service";
import type { CashSessionListResponse } from "../schemas/cashSession.schema";
import type { CashMovementListResponse } from "../schemas/cashMovement.schema";
import { z } from "zod";

const MODULE_NAME = 'CASH_SERVICE';

export const cashService = {
    /**
     * Obtener sesiones de caja paginadas con filtros opcionales
     */
    async getSessions(filters: Partial<CashSessionFilters>): Promise<CashSessionListResponse> {
        Logger.info('Fetching cash sessions', { filters }, MODULE_NAME);

        const response = await ApiService.get(
            CASH_ENDPOINTS.sessions.all,
            CashSessionListResponseSchema,
            { params: filters }
        );

        Logger.info('Cash sessions fetched successfully', {
            count: response.data.length,
        }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener la sesión activa de caja para una sucursal
     * @param sucursalId - ID de la sucursal
     */
    async getSessionActive(sucursalId: number): Promise<CashSession | null> {
        Logger.info('Fetching active cash session', { sucursalId }, MODULE_NAME);

        try {
            const response = await ApiService.get(
                CASH_ENDPOINTS.sessions.active,
                CashSessionSchema,
                { params: { sucursal: sucursalId } },
                { unwrapData: true }
            );

            Logger.info('Active cash session fetched successfully', { sucursalId }, MODULE_NAME);

            return response as CashSession;
        } catch {
            Logger.info('No active cash session found', { sucursalId }, MODULE_NAME);
            return null;
        }
    },

    /**
     * Obtener una sesión de caja por ID
     * @param id - ID de la sesión
     */
    async getSessionById(id: number): Promise<CashSession> {
        Logger.info('Fetching cash session detail', { id }, MODULE_NAME);

        const response = await ApiService.get(
            CASH_ENDPOINTS.sessions.byId(id),
            CashSessionSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Cash session detail fetched successfully', { id }, MODULE_NAME);

        return response as CashSession;
    },

    /**
     * Abrir una nueva sesión de caja
     * @param data - Datos de apertura
     */
    async openSession(data: OpenSessionPayload): Promise<CashSession> {
        Logger.info('Opening cash session', { data }, MODULE_NAME);

        const response = await ApiService.post(
            CASH_ENDPOINTS.sessions.all,
            data,
            CashSessionSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Cash session opened successfully', undefined, MODULE_NAME);

        return response as CashSession;
    },

    /**
     * Cerrar una sesión de caja
     * @param id - ID de la sesión
     * @param data - Datos de cierre
     */
    async closeSession(id: number, data: CloseSessionPayload): Promise<CashSession> {
        Logger.info('Closing cash session', { id, data }, MODULE_NAME);

        const response = await ApiService.post(
            CASH_ENDPOINTS.sessions.close(id),
            data,
            CashSessionSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Cash session closed successfully', { id }, MODULE_NAME);

        return response as CashSession;
    },

    /**
     * Obtener el arqueo de una sesión por forma de pago
     * @param id - ID de la sesión
     */
    async getSessionArqueo(id: number): Promise<CashSessionArqueo> {
        Logger.info('Fetching cash session arqueo', { id }, MODULE_NAME);

        const response = await ApiService.get(
            CASH_ENDPOINTS.sessions.arqueo(id),
            CashSessionArqueoSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Cash session arqueo fetched successfully', { id }, MODULE_NAME);

        return response as CashSessionArqueo;
    },

    /**
     * Descargar el PDF de reporte de una sesión de caja
     * @param id - ID de la sesión
     */
    async downloadSessionPdf(id: number): Promise<void> {
        Logger.info('Downloading cash session PDF', { id }, MODULE_NAME);

        const response = await apiClient.get(
            CASH_ENDPOINTS.sessions.pdf(id),
            { responseType: 'blob' }
        );

        const filename = `sesion-caja-${id}.pdf`;
        const { addDownload, updateDownload } = useDownloadStore.getState();
        const downloadId = addDownload({ filename, path: null, status: 'downloading', type: 'pdf' });

        try {
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const savedPath = await downloadPDF(blob, filename);
            updateDownload(downloadId, {
                status: savedPath ? 'success' : 'cancelled',
                path: savedPath,
            });
        } catch (err) {
            updateDownload(downloadId, { status: 'error', error: (err as Error).message });
            throw err;
        }

        Logger.info('Cash session PDF downloaded', { id }, MODULE_NAME);
    },

    /**
     * Anular un movimiento manual de caja
     * @param id - ID del movimiento a anular
     */
    async deleteMovement(id: number): Promise<CashMovement> {
        Logger.info('Deleting cash movement', { id }, MODULE_NAME);

        const response = await ApiService.delete(
            CASH_ENDPOINTS.movements.byId(id),
            CashMovementSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Cash movement deleted successfully', { id }, MODULE_NAME);

        return response as CashMovement;
    },

    /**
     * Obtener movimientos de una sesión de caja específica
     * @param sessionId - ID de la sesión
     */
    async getSessionMovements(sessionId: number): Promise<CashMovement[]> {
        Logger.info('Fetching session movements', { sessionId }, MODULE_NAME);

        const response = await ApiService.get(
            CASH_ENDPOINTS.sessions.movements(sessionId),
            z.array(CashMovementSchema),
            undefined
        );

        Logger.info('Session movements fetched successfully', { sessionId }, MODULE_NAME);

        return response as CashMovement[];
    },

    /**
     * Obtener movimientos de caja paginados con filtros opcionales
     */
    async getMovements(filters: Partial<CashMovementFilters>): Promise<CashMovementListResponse> {
        Logger.info('Fetching cash movements', { filters }, MODULE_NAME);

        const response = await ApiService.get(
            CASH_ENDPOINTS.movements.all,
            CashMovementListResponseSchema,
            { params: filters }
        );

        Logger.info('Cash movements fetched successfully', {
            count: response.data.length,
        }, MODULE_NAME);

        return response;
    },

    /**
     * Registrar un ingreso de caja
     * @param data - Datos del ingreso
     */
    async registerIncome(data: IncomePayload): Promise<CashMovement> {
        Logger.info('Registering cash income', { data }, MODULE_NAME);

        const response = await ApiService.post(
            CASH_ENDPOINTS.movements.income,
            data,
            CashMovementSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Cash income registered successfully', undefined, MODULE_NAME);

        return response as CashMovement;
    },

    /**
     * Registrar un retiro de caja
     * @param data - Datos del retiro
     */
    async registerWithdrawal(data: WithdrawalPayload): Promise<CashMovement> {
        Logger.info('Registering cash withdrawal', { data }, MODULE_NAME);

        const response = await ApiService.post(
            CASH_ENDPOINTS.movements.withdrawal,
            data,
            CashMovementSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Cash withdrawal registered successfully', undefined, MODULE_NAME);

        return response as CashMovement;
    },

    /**
     * Registrar un gasto de caja
     * @param data - Datos del gasto
     */
    async registerExpense(data: ExpensePayload): Promise<CashMovement> {
        Logger.info('Registering cash expense', { data }, MODULE_NAME);

        const response = await ApiService.post(
            CASH_ENDPOINTS.movements.expenses,
            data,
            CashMovementSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Cash expense registered successfully', undefined, MODULE_NAME);

        return response as CashMovement;
    },

    /**
     * Obtener tipos de gasto de una sucursal
     * @param sucursalId - ID de la sucursal
     */
    async getExpenseTypes(sucursalId: number): Promise<ExpenseType[]> {
        Logger.info('Fetching expense types', { sucursalId }, MODULE_NAME);

        const response = await ApiService.get(
            CASH_ENDPOINTS.expenseTypes.all,
            ExpenseTypeListSchema,
            { params: { sucursal: sucursalId } },
            { unwrapData: true }
        );

        Logger.info('Expense types fetched successfully', {
            count: response.length,
        }, MODULE_NAME);

        return response as ExpenseType[];
    },

    /**
     * Crear un tipo de gasto
     * @param data - Datos del tipo de gasto
     */
    async createExpenseType(data: CreateExpenseTypePayload): Promise<ExpenseType> {
        Logger.info('Creating expense type', { data }, MODULE_NAME);

        const response = await ApiService.post(
            CASH_ENDPOINTS.expenseTypes.all,
            data,
            ExpenseTypeSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Expense type created successfully', undefined, MODULE_NAME);

        return response as ExpenseType;
    },

    /**
     * Actualizar un tipo de gasto
     * @param id - ID del tipo de gasto
     * @param data - Datos para actualizar
     */
    async updateExpenseType(id: number, data: UpdateExpenseTypePayload): Promise<ExpenseType> {
        Logger.info('Updating expense type', { id, data }, MODULE_NAME);

        const response = await ApiService.put(
            CASH_ENDPOINTS.expenseTypes.byId(id),
            data,
            ExpenseTypeSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Expense type updated successfully', { id }, MODULE_NAME);

        return response as ExpenseType;
    },

    /**
     * Obtener el reporte de flujo de caja para una sucursal y rango de fechas
     * @param sucursalId - ID de la sucursal
     * @param fechaInicio - Fecha de inicio (YYYY-MM-DD)
     * @param fechaFin - Fecha de fin (YYYY-MM-DD)
     */
    async getFlowReport(sucursalId: number, fechaInicio: string, fechaFin: string): Promise<CashFlowReport> {
        Logger.info('Fetching cash flow report', { sucursalId, fechaInicio, fechaFin }, MODULE_NAME);

        const response = await ApiService.get(
            CASH_ENDPOINTS.reports.flow,
            CashFlowReportSchema,
            { params: { sucursal: sucursalId, fecha_inicio: fechaInicio, fecha_fin: fechaFin } },
            { unwrapData: true }
        );

        Logger.info('Cash flow report fetched successfully', { sucursalId }, MODULE_NAME);

        return response as CashFlowReport;
    },

    /**
     * Eliminar un tipo de gasto
     * @param id - ID del tipo de gasto
     */
    async deleteExpenseType(id: number): Promise<void> {
        Logger.info('Deleting expense type', { id }, MODULE_NAME);

        await ApiService.delete(CASH_ENDPOINTS.expenseTypes.byId(id));

        Logger.info('Expense type deleted successfully', { id }, MODULE_NAME);
    },
};
