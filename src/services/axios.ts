import authSDK from "@/services/sdk-simple-auth";
import { cleanFilters } from "@/utils/cleanFilters";
import { environment } from "@/utils/environment";
import axios from "axios";

const apiClient = axios.create({
  baseURL: environment.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 segundos
})
apiClient.interceptors.request.use(
  async (config) => {
    const token = await authSDK.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method?.toLowerCase() === "get" && config.params) {
      config.params = cleanFilters(config.params as Record<string, unknown>);
    }

    return config;
  },
  (error) => {
    console.log(error)
    return Promise.reject(error);
  }
);
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si hay respuesta del servidor
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        await authSDK.clearLocalSession();
      }
    }
    else if (error.request) {
      const isNetworkError = error.message === "Network Error" ||
        error.code === "ECONNABORTED" ||
        error.code === "ERR_NETWORK"; 
      if (isNetworkError) {
        // await authSDK.logout();
        // window.location.href = '/';
      }
    }
    // Error en la configuración de la petición (antes de enviarla)
    else {
      console.error("Error en la configuración de la solicitud:", error.message);
    }

    return Promise.reject(error);
  }
);
export default apiClient;