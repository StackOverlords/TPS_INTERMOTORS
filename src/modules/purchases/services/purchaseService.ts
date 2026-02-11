import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import { PurchaseListResponseSchema } from "../schemas/purchaseResponse.schema";
import type { PurchaseUpdate } from "../schemas/purchaseUpdate.schema";
import type { PurchaseFilters } from "../types/purchaseFilters";
import type { PurchaseListResponse } from "../types/purchaseListResponse";
import { PURCHASE_ENDPOINTS } from "./endpoints";
import type { PurchaseCreate } from "../schemas/purchaseCreate.schema";
import { PurchaseDetailSchema, type PurchaseDetail } from "../schemas/purchase.schema";
import { transformToApiFormat, type UpdatePricesFormData } from "../schemas/updatePrices.schema";
import type { UpdatePricesResponse } from "../types/UpdatePricesResponse";
import { UpdatePricesResponseSchema } from "../schemas/updatePricesResponse.schema";
import type { UpdatePurchaseDetailPricesFormData } from "../types/UpdatePurchaseDetailPrices.types";
import { updatePurchaseDetailPricesSchema } from "../schemas/updatePurchaseDetailPrices.schema";

const MODULE_NAME = "PURCHASE_SERVICE";

export const purchaseService = {
  /**
   * Crear una nueva compra
   * @param data - Datos de la compra a crear
   */
  async create(data: PurchaseCreate): Promise<PurchaseDetail> {
    Logger.info("Creating purchase", { data }, MODULE_NAME);

    const response = await ApiService.post(
      PURCHASE_ENDPOINTS.create,
      data,
      PurchaseDetailSchema,
      undefined,
      { unwrapData: true }
    );

    Logger.info("Purchase created successfully", undefined, MODULE_NAME);
    return response as PurchaseDetail;
  },

  /**
   * Obtener todas las compras con filtros opcionales
   */
  async getAll(filters: Partial<PurchaseFilters>): Promise<PurchaseListResponse> {
    Logger.info("Fetching purchases", { filters }, MODULE_NAME);

    const response = await ApiService.get(
      PURCHASE_ENDPOINTS.all,
      PurchaseListResponseSchema,
      { params: filters }
    );

    Logger.info("Purchases fetched successfully", {
      count: response.data.length,
    }, MODULE_NAME);

    return response;
  },

  /**
   * Obtener una compra por ID
   * @param id - ID de la compra
   */
  async getById(id: number): Promise<PurchaseDetail> {
    Logger.info("Fetching purchase detail", { id }, MODULE_NAME);

    const response = await ApiService.get(
      PURCHASE_ENDPOINTS.byId(id),
      PurchaseDetailSchema,
      undefined,
      { unwrapData: true }
    );

    Logger.info("Purchase detail fetched successfully", { id }, MODULE_NAME);

    return response as PurchaseDetail;
  },

  /**
   * Actualizar una compra por ID
   * @param id - ID de la compra
   * @param data - Datos para actualizar la compra
   */
  async update(id: number, data: PurchaseUpdate): Promise<PurchaseDetail> {
    Logger.info("Updating purchase", { id, data }, MODULE_NAME);

    const response = await ApiService.put(
      PURCHASE_ENDPOINTS.update(id),
      data,
      PurchaseDetailSchema,
      undefined,
      { unwrapData: true }
    );

    Logger.info("Purchase updated successfully", { id }, MODULE_NAME);
    return response as PurchaseDetail;
  },

  /**
   * Eliminar una compra por ID
   * @param id - ID de la compra
   */
  async delete(id: number): Promise<void> {
    Logger.info("Deleting purchase", { id }, MODULE_NAME);

    await ApiService.delete(PURCHASE_ENDPOINTS.delete(id));

    Logger.info("Purchase deleted successfully", { id }, MODULE_NAME);
  },

  /**
   * Eliminar detalle de una compra por ID
   * @param id - ID del detalle de compra
   */
  async deleteDetail(id: number): Promise<void> {
    Logger.info("Deleting purchase detail", { id }, MODULE_NAME);

    await ApiService.delete(PURCHASE_ENDPOINTS.details.delete(id));

    Logger.info("Purchase detail deleted successfully", { id }, MODULE_NAME);
  },

  /**
   * Actualizar precios de productos por categoría
   * @param data - Datos para la actualización de precios (formato del formulario)
   */
  async updatePrices(
    data: UpdatePricesFormData
  ): Promise<UpdatePricesResponse> {
    Logger.info("Updating prices", { data }, MODULE_NAME);

    // Transformar datos del formulario al formato del API
    const apiData = transformToApiFormat(data);

    const response = await ApiService.post(
      PURCHASE_ENDPOINTS.updatePrices,
      undefined, // No body, params go in query string
      UpdatePricesResponseSchema,
      { params: apiData }, // Send as query params (con formato transformado)
      { unwrapData: false }
    );

    // Logger.info('Prices updated successfully', {
    //   updated_count: response.updated_count,
    //   affected_products: response.affected_products
    // }, MODULE_NAME);

    return response as UpdatePricesResponse;
  },

  /**
   * Actualizar precios de venta del stock restante por detalle de compra
   */
  async updatePurchaseDetailPrices(
    params: UpdatePurchaseDetailPricesFormData
  ): Promise<void> {
    Logger.info("Updating purchase detail prices", { params }, MODULE_NAME);

    const transformedParams =
      updatePurchaseDetailPricesSchema.safeParse(params);

    await ApiService.post(
      PURCHASE_ENDPOINTS.updateDetailPrices,
      undefined,
      undefined,
      { params: transformedParams.data },
      { unwrapData: false }
    );

    Logger.info(
      "Purchase detail prices updated successfully",
      undefined,
      MODULE_NAME
    );
  },

};