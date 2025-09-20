import authSDK from "@/services/sdk-simple-auth";
import { cleanFilters } from "@/utils/cleanFilters";
import { environment } from "@/utils/environment";
import axios from "axios";

const apiClient = axios.create({
    baseURL: environment.apiUrl,
    headers: {
        "Content-Type": "application/json",
    },

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
export default apiClient;