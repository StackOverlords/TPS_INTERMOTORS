import { Logger } from "@/lib/logger";
import authSDK from "@/services/sdk-simple-auth";
import type { Login } from "../types/login.types";

const MODULE_NAME = 'AUTH_SERVICE';

export const authService = {
    /**
     * Iniciar sesión con credenciales
     * @param credentials - Credenciales de login (username y password)
     */
    async login(credentials: Login): Promise<unknown> {
        try {
            // Log de configuración del entorno
            const apiUrl = import.meta.env.VITE_API_URL;
            const appEnv = import.meta.env.VITE_APP_ENV;

            Logger.info('Login attempt started', {
                user: credentials.usuario,
                apiUrl,
                environment: appEnv,
                isDev: import.meta.env.DEV,
                isProd: import.meta.env.PROD,
            }, MODULE_NAME);

            const response = await authSDK.login(credentials)

            Logger.info('Login successful', {
                user: response.name,
            }, MODULE_NAME);

            return response;
        } catch (error: unknown) {
            // Log detallado del error
            const errorDetails = {
                message: error instanceof Error ? error.message : String(error),
                name: error instanceof Error ? error.name : 'UnknownError',
                stack: error instanceof Error ? error.stack : undefined,
                raw: JSON.stringify(error),
                apiUrl: import.meta.env.VITE_API_URL,
                environment: import.meta.env.VITE_APP_ENV,
            };

            Logger.error('Login failed with details', JSON.stringify(errorDetails, null, 2), MODULE_NAME);

            const errorMessage = errorDetails.message;

            // Verificamos si es un error de credenciales (ej. 4xx)
            if (/4\d{2}/.test(errorMessage)) {
                throw new Error("Error al iniciar sesión. Verifica tus credenciales.");
            }

            // // En desarrollo, mostrar alert con detalles
            // if (import.meta.env.DEV) {
            //     alert(JSON.stringify(errorDetails, null, 2));
            // }

            // Otro tipo de error (red, servidor, etc.)
            throw new Error("Ocurrió un error inesperado al intentar iniciar sesión. Inténtalo de nuevo.");
        }
    },
};