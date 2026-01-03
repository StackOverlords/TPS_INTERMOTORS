import authSDK from "@/services/sdk-simple-auth";
import type { Login } from "../types/login.types";
import logger from "@/utils/logger";

// Crear logger con prefijo de módulo
const authLogger = logger.withModule('AUTH_SERVICE');

export const authService = {
    /**
     * Iniciar sesión con credenciales
     * @param credentials - Credenciales de login (username y password)
     */
    async login(credentials: Login): Promise<unknown> {
        try {
            // Log de inicio de sesión
            authLogger.info('Login attempt started', {
                user: credentials.usuario,
                apiUrl: import.meta.env.VITE_API_URL,
                environment: import.meta.env.VITE_APP_ENV,
            });

            const response = await authSDK.login(credentials);

            authLogger.info('Login successful', {
                user: response.name,
            });

            return response;
        } catch (error: unknown) {
            // ⚠️ IMPORTANTE: authSDK NO usa nuestro apiClient con interceptors
            // Por lo tanto, DEBEMOS loguear el error completo aquí
            let errorDetails = {
                message: error instanceof Error ? error.message : String(error),
                name: error instanceof Error ? error.name : 'UnknownError',
                stack: error instanceof Error ? error.stack : undefined,
                user: credentials.usuario,
                apiUrl: import.meta.env.VITE_API_URL,
                environment: import.meta.env.VITE_APP_ENV,
            };

            authLogger.error('Login failed with details', errorDetails);
            
            const errorMessage = errorDetails.message;
            
            // Verificar si es un error de credenciales (4xx)
            if (/4\d{2}/.test(errorMessage)) {
                authLogger.error('Login failed with details', errorDetails.message = "Invalid credentials provided.");
                throw new Error("Error al iniciar sesión. Verifica tus credenciales.");
            }

            // Otro tipo de error (red, servidor, etc.)
            throw new Error("Ocurrió un error inesperado al intentar iniciar sesión. Inténtalo de nuevo.");
        }
    },
};