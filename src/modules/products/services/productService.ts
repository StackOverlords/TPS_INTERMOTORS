import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import { ProductDetailSchema } from "../schemas/ProductDetail.schema";
import { ProductProviderOrderListSchema } from "../schemas/productProviderOrdersSchema";
import { ProductListResponseSchema } from "../schemas/productResponse.schema";
import { ProductStockListSchema } from "../schemas/productStock.schema";
import { ProductSalesSchema } from "../schemas/productTwoYaersSales.schema";
import type { ProductCreate } from "../types/ProductCreate.types";
import type { ProductDetail } from "../types/productDetail";
import type { ProvOrdersParams, SalesParams, StockParams } from "../types/productDetailParams";
import type { ProductFilters } from "../types/productFilters";
import type { ProductListResponse } from "../types/productListResponse ";
import type { ProductProviderOrder } from "../types/ProductProviderOrder";
import type { ProductSalesStats } from "../types/ProductSalesStats";
import type { ProductStock } from "../types/productStock";
import type { ProductUpdate } from "../types/ProductUpdate.types";
import { PRODUCT_ENDPOINTS } from "./endpoints";

const MODULE_NAME = "PRODUCTS_SERVICE";

export const productsService = {
	/**
	 * Obtener todos los productos con filtros opcionales
	 * @param filters - Filtros opcionales para la consulta
	 */
	async getAll(filters: Partial<ProductFilters>): Promise<ProductListResponse> {
		Logger.info("Fetching products", { filters }, MODULE_NAME);
		const response = await ApiService.get(
			PRODUCT_ENDPOINTS.all,
			ProductListResponseSchema,
			{ params: filters }
		);
		Logger.info("Products fetched successfully", { count: response.data.length }, MODULE_NAME);
		return response as ProductListResponse;
	},

	/**
	 * Obtener detalle de un producto por ID
	 * @param id - ID del producto
	 */
	async getById(id: number): Promise<ProductDetail> {
		Logger.info("Fetching product detail", { id }, MODULE_NAME);
		const response = await ApiService.get(
			PRODUCT_ENDPOINTS.byId(id),
			ProductDetailSchema,
			undefined,
			{ unwrapData: true }
		);
		Logger.info("Product detail fetched successfully", { id }, MODULE_NAME);
		return response as ProductDetail;
	},

	/**
	 * Obtener stock de un producto con filtros opcionales
	 * @param params - Parámetros para la consulta de stock
	 */
	async getStock(params: StockParams): Promise<ProductStock[]> {
		Logger.info("Fetching product stock", { params }, MODULE_NAME);
		const response = await ApiService.get(
			PRODUCT_ENDPOINTS.stockDetails,
			ProductStockListSchema,
			{ params },
			{ unwrapData: true }
		);
		Logger.info("Product stock fetched successfully", { length: response.length }, MODULE_NAME);
		return response as ProductStock[];
	},

	/**
	 * Obtener órdenes de productos con filtros opcionales
	 * @param params - Parámetros para la consulta de órdenes de productos
	 */
	async getProviderOrders(params: ProvOrdersParams): Promise<ProductProviderOrder[]> {
		Logger.info("Fetching provider orders", { params }, MODULE_NAME);
		const response = await ApiService.get(
			PRODUCT_ENDPOINTS.providerOrders,
			ProductProviderOrderListSchema,
			{ params },
			{ unwrapData: true }
		);
		Logger.info("Provider orders fetched successfully", { length: response.length }, MODULE_NAME);
		return response as ProductProviderOrder[];
	},

	/**
	 * Obtener estadísticas de ventas de un producto, basado en dos años
	 * @param params - Parámetros para la consulta de estadísticas
	 */
	async getSalesStats(params: SalesParams): Promise<ProductSalesStats> {
		Logger.info("Fetching product sales stats", { params }, MODULE_NAME);
		const response = await ApiService.get(
			PRODUCT_ENDPOINTS.twoYearsSales,
			ProductSalesSchema,
			{ params }
		);
		Logger.info("Product sales stats fetched successfully", {}, MODULE_NAME);
		return response as ProductSalesStats;
	},

	/**
	 * Eliminar un producto por ID
	 * @param id - ID del producto
	 */
	async delete(id: number): Promise<void> {
		Logger.info("Deleting product", { id }, MODULE_NAME);
		await ApiService.delete(PRODUCT_ENDPOINTS.delete(id));
		Logger.info("Product deleted successfully", { id }, MODULE_NAME);
	},

	/**	
	 * Modificar producto
	 * @param id - ID del producto
	 * @param data - Datos para actualizar el producto
	 */
	async update(id: number, data: ProductUpdate): Promise<ProductDetail> {
		Logger.info('Updating product', { id, data }, MODULE_NAME);

		const response = await ApiService.put(
			PRODUCT_ENDPOINTS.update(id),
			data,
			ProductDetailSchema,
			undefined,
			{ unwrapData: true }
		);

		Logger.info('Product updated successfully', {
			id
		}, MODULE_NAME);
		return response as ProductDetail;
	},

	/**
		 * Crear un nuevo producto
		 * @param data - Datos del producto a crear
		 */
	async create(data: ProductCreate): Promise<ProductDetail> {
		Logger.info('Creating product', { data }, MODULE_NAME);
    if(data.id_subcategoria === 0) {
      delete data.id_subcategoria;
    }
		const response = await ApiService.post(
			PRODUCT_ENDPOINTS.create,
			data,
			ProductDetailSchema,
			undefined,
			{ unwrapData: true }
		);

		Logger.info(
			"Product created successfully",
			undefined,
			// response.data.id && { id: response.data.id },
			MODULE_NAME
		);
		return response as ProductDetail;
	},
};