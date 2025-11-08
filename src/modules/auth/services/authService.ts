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
            Logger.info('Attempting login', { user: credentials.usuario }, MODULE_NAME);

            const response = await authSDK.login(credentials)

            Logger.info('Login successful', {
                user: response.name,
            }, MODULE_NAME);

            return response;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            Logger.error('Login failed', errorMessage, MODULE_NAME);

            // Verificamos si es un error de credenciales (ej. 4xx)
            if (/4\d{2}/.test(errorMessage)) {
                throw new Error("Error al iniciar sesión. Verifica tus credenciales.");
            }
            alert(JSON.stringify(error))
            // Otro tipo de error (red, servidor, etc.)
            throw new Error("Ocurrió un error inesperado al intentar iniciar sesión. Inténtalo de nuevo.");
        }
    },
};