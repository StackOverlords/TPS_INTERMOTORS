import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import { PurchaseDetailSchema } from "../schemas/purchase.schema";
import { PurchaseListResponseSchema } from "../schemas/purchaseResponse.schema";
import type { UpdatePricesFormData } from "../schemas/updatePrices.schema";
import { UpdatePricesResponseSchema } from "../schemas/updatePricesResponse.schema";
import type { PurchaseDetail } from "../types/PurchaseDetail";
import type { PurchaseFilters } from "../types/purchaseFilters";
import type { PurchaseListResponse } from "../types/purchaseListResponse";
import type { UpdatePricesResponse } from "../types/UpdatePricesResponse";
import { PURCHASE_ENDPOINTS } from "./endpoints";

const MODULE_NAME = 'PURCHASE_SERVICE';

export const purchaseService = {
  /**
   * Crear una nueva compra
   * @param data - Datos de la compra a crear
  */
  // async create(data: PurchaseCreate): Promise<unknown> { -- falta definir PurchaseCreate
  async create(data: any): Promise<unknown> {
    Logger.info('Creating purchase', { data }, MODULE_NAME);

    const response = await ApiService.post(
      PURCHASE_ENDPOINTS.create,
      data,
    );

    Logger.info(
      "Purchase created successfully",
      undefined,
      // response.data.id && { id: response.data.id },
      MODULE_NAME
    );
    return response
  },

  /**
   * Obtener todas las compras con filtros opcionales
   */
  async getAll(filters: Partial<PurchaseFilters>): Promise<PurchaseListResponse> {
    Logger.info('Fetching purchases', { filters }, MODULE_NAME);

    const response = await ApiService.get(
      PURCHASE_ENDPOINTS.all,
      PurchaseListResponseSchema,
      { params: filters }
    );

    Logger.info('Purchases fetched successfully', {
      count: response.data.length,
    }, MODULE_NAME);

    return response;
  },

  /**
   * Obtener una compra por ID
   * @param id - ID de la compra
   */
  async getById(id: number): Promise<PurchaseDetail> {
    Logger.info('Fetching purchase detail', { id }, MODULE_NAME);

    const response = await ApiService.get(
      PURCHASE_ENDPOINTS.byId(id),
      PurchaseDetailSchema,
      undefined,
      { unwrapData: true }
    );

    Logger.info('Purchase detail fetched successfully', { id }, MODULE_NAME);

    return response as PurchaseDetail;
  },

  /**
   * Actualizar una cotizacion por ID
   * @param id - ID de la cotizacion
   * @param data - Datos para actualizar la cotizacion
   */
  // async update(id: number, data: QuotationUpdate): Promise<PurchaseDetail> { -- falta definir QuotationUpdate
  async update(id: number, data: any): Promise<PurchaseDetail> {
    Logger.info('Updating purchase', { id, data }, MODULE_NAME);

    const response = await ApiService.put(
      PURCHASE_ENDPOINTS.update(id),
      data,
      PurchaseDetailSchema,
      undefined,
      { unwrapData: true }
    );

    Logger.info('Purchase updated successfully', {
      id
    }, MODULE_NAME);
    return response as PurchaseDetail;
  },

  /**
   * Eliminar una compra por ID
   * @param id - ID de la compra
   */
  async delete(id: number): Promise<void> {
    Logger.info('Deleting purchase', { id }, MODULE_NAME);

    await ApiService.delete(PURCHASE_ENDPOINTS.delete(id));

    Logger.info('Purchase deleted successfully', { id }, MODULE_NAME);
  },

  // /**
  // * Eliminar detalle de una compra por ID
  // * @param id - ID del detalle de compra
  // */
  // async deleteDetail(id: number): Promise<void> {
  //   Logger.info('Deleting purchase detail', { id }, MODULE_NAME);

  //   await ApiService.delete(PURCHASE_ENDPOINTS.details.delete(id));

  //   Logger.info('Purchase detail deleted successfully', { id }, MODULE_NAME);
  // },

  /**
   * Actualizar precios de productos por categoría
   * @param data - Datos para la actualización de precios
   */
  async updatePrices(data: UpdatePricesFormData): Promise<UpdatePricesResponse> {
    Logger.info('Updating prices', { data }, MODULE_NAME);

    const response = await ApiService.post(
      PURCHASE_ENDPOINTS.updatePrices,
      undefined, // No body, params go in query string
      UpdatePricesResponseSchema,
      { params: data }, // Send as query params
      { unwrapData: false }
    );

    // Logger.info('Prices updated successfully', {
    //   updated_count: response.updated_count,
    //   affected_products: response.affected_products
    // }, MODULE_NAME);
    
    return response as UpdatePricesResponse;
  },

};