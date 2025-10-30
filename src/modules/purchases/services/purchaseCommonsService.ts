import { apiConstructor } from '@/modules/products/services/api';
import { PURCHASE_ENDPOINTS } from './endpoints';
import type {
  PurchaseType,
  PurchaseModality,
  ResponsibleData,
} from '../types/purchaseCommons';
import type { ProviderOption } from '../types/ProviderOption';
import apiClient from '@/services/axios';
import { ProviderResponseSchema } from '../schemas/provider.schema';

export const purchaseCommonsService = {
  /**
   * Obtiene los tipos de compra disponibles
   */
  async getPurchaseTypes(): Promise<PurchaseType> {
    try {
      const response = await apiConstructor({
        url: PURCHASE_ENDPOINTS.types,
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Error fetching purchase types:', error);
      throw error;
    }
  },

  /**
   * Obtiene las modalidades de compra disponibles
   */
  async getPurchaseModalities(): Promise<PurchaseModality> {
    try {
      const response = await apiConstructor({
        url: PURCHASE_ENDPOINTS.modalities,
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Error fetching purchase modalities:', error);
      throw error;
    }
  },

  /**
   * Obtiene los responsables disponibles
   */
  async getResponsibles(): Promise<ResponsibleData[]> {
    try {
      const response = await apiConstructor({
        url: PURCHASE_ENDPOINTS.responsibles,
        method: 'GET',
      });
      // Si la respuesta es un array, devolverlo directamente
      // Si es un objeto con 'data', devolver response.data
      return Array.isArray(response) ? response : response.data || response;
    } catch (error) {
      console.error('Error fetching responsibles:', error);
      throw error;
    }
  },
};

export const fetchProviders = async (searchTerm: string = "TODO"): Promise<ProviderOption[]> => {
  const response = await apiClient.get(PURCHASE_ENDPOINTS.providers, {
    params: { proveedor: searchTerm }
  });

  const result = ProviderResponseSchema.safeParse(response.data);
  if (!result.success) {
    console.error("Zod error en fetchProviders:", result.error.format());
    throw new Error("Respuesta inválida del servidor.");
  }
  return result.data.data;
};