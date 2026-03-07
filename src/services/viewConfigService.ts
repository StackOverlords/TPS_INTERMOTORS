import type { ViewConfiguration } from "@/view-configs/viewConfigTypes";
import apiClient from "./axios";

export interface OrganizationConfigResponse {
  viewId: string;
  organizationId: string;
  config: Partial<ViewConfiguration>;
  updatedAt: string;
  updatedBy: string;
}

class ViewConfigService {
  private baseUrl = "/view-configs";

  /**
   * Obtener configuración de organización para una vista
   */
  async getOrganizationConfig(
    viewId: string,
  ): Promise<Partial<ViewConfiguration> | null> {
    try {
      // const response = await apiClient.get<OrganizationConfigResponse>(
      //   `${this.baseUrl}/${viewId}`
      // );
      // return response.data.config;
      return null; // Temporalmente retornar null para evitar problemas de CORS mientras se resuelve el backend
    } catch (error: any) {
      // Si es 404, significa que no hay configuración de organización
      if (error.response?.status === 404) {
        return null;
      }
      // Si es error de red/CORS (ERR_NETWORK), retornar null sin loguear
      // Esto permite que la app funcione solo con config local cuando el backend tiene problemas de CORS
      if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
        console.warn(
          `[ViewConfigService] CORS/Network error for ${viewId}, usando solo config local`,
        );
        return null;
      }
      console.error("Error fetching organization config:", error);
      throw error;
    }
  }

  /**
   * Actualizar configuración de organización para una vista
   */
  async updateOrganizationConfig(
    viewId: string,
    config: Partial<ViewConfiguration>,
  ): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/${viewId}`, { config });
    } catch (error) {
      console.error("Error updating organization config:", error);
      throw error;
    }
  }

  /**
   * Eliminar configuración de organización para una vista
   */
  async deleteOrganizationConfig(viewId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${viewId}`);
    } catch (error) {
      console.error("Error deleting organization config:", error);
      throw error;
    }
  }

  /**
   * Obtener todas las configuraciones de organización
   */
  async getAllOrganizationConfigs(): Promise<
    Record<string, Partial<ViewConfiguration>>
  > {
    try {
      const response = await apiClient.get<OrganizationConfigResponse[]>(
        `${this.baseUrl}`,
      );

      const configs: Record<string, Partial<ViewConfiguration>> = {};
      response.data.forEach((item) => {
        configs[item.viewId] = item.config;
      });

      return configs;
    } catch (error) {
      console.error("Error fetching all organization configs:", error);
      return {};
    }
  }

  /**
   * Actualizar solo features de organización
   */
  async updateOrganizationFeatures(
    viewId: string,
    features: Partial<ViewConfiguration["features"]>,
  ): Promise<void> {
    try {
      const currentConfig = await this.getOrganizationConfig(viewId);

      await this.updateOrganizationConfig(viewId, {
        ...currentConfig,
        features: {
          ...currentConfig?.features,
          ...features,
        },
      });
    } catch (error) {
      console.error("Error updating organization features:", error);
      throw error;
    }
  }

  /**
   * Actualizar solo behaviors de organización
   */
  async updateOrganizationBehaviors(
    viewId: string,
    behaviors: Partial<ViewConfiguration["behaviors"]>,
  ): Promise<void> {
    try {
      const currentConfig = await this.getOrganizationConfig(viewId);

      await this.updateOrganizationConfig(viewId, {
        ...currentConfig,
        behaviors: {
          ...currentConfig?.behaviors,
          ...behaviors,
        },
      });
    } catch (error) {
      console.error("Error updating organization behaviors:", error);
      throw error;
    }
  }

  /**
   *  Actualizar solo table.behaviors de organización
   */
  async updateOrganizationTableBehaviors(
    viewId: string,
    tableBehaviors: Partial<ViewConfiguration["table"]>,
  ): Promise<void> {
    try {
      const currentConfig = await this.getOrganizationConfig(viewId);

      await this.updateOrganizationConfig(viewId, {
        ...currentConfig,
        table: {
          ...currentConfig?.table,
          behaviors: {
            ...currentConfig?.table?.behaviors,
            ...tableBehaviors,
          },
        },
      });
    } catch (error) {
      console.error("Error updating organization table behaviors:", error);
      throw error;
    }
  }
}

export const viewConfigService = new ViewConfigService();
export default viewConfigService;
