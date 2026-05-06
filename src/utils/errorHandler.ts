import { AxiosError } from "axios";

interface ErrorResult {
    userMessage: string;
    shouldRetry: boolean;
    category: "validation" | "network" | "server" | "authentication" | "unknown";
}

/**
 * Extrae un mensaje legible del body de respuesta del backend.
 * Prueba formatos en orden de prioridad y devuelve undefined si ninguno aplica,
 * dejando que el fallback por status code tome el control.
 *
 * Formatos soportados (en orden de prioridad):
 *   1. { error: { validation_errors: [{field, message}] } }  → formato ApiError propio con campos
 *   2. { error: { message: "..." } }                         → formato ApiError propio sin campos
 *   3. { errors: { campo: ["msg"] } }                        → Laravel estándar 422
 *   4. { message: "..." }                                    → mensaje simple
 *   5. string plano (no HTML)                                → respuesta directa
 */
function parseResponseMessage(data: unknown): string | undefined {
    if (typeof data === "string") {
        const trimmed = data.trim();
        if (trimmed && !trimmed.startsWith("<") && trimmed.length <= 300) {
            return trimmed;
        }
        return undefined;
    }

    if (!data || typeof data !== "object") return undefined;

    const d = data as Record<string, unknown>;

    // Formato propio: { error: { validation_errors: [{field, message}], message } }
    if (d.error && typeof d.error === "object") {
        const nested = d.error as Record<string, unknown>;

        if (Array.isArray(nested.validation_errors) && nested.validation_errors.length > 0) {
            const messages = (nested.validation_errors as Array<Record<string, unknown>>)
                .map((e) => (typeof e.message === "string" ? e.message.trim() : ""))
                .filter(Boolean)
                .slice(0, 3);
            if (messages.length > 0) {
                return messages.join(" • ");
            }
        }

        if (typeof nested.message === "string" && nested.message.trim()) {
            return nested.message.trim();
        }
    }

    // Laravel estándar: { errors: { campo: ["msg1", "msg2"] } }
    if (d.errors && typeof d.errors === "object" && !Array.isArray(d.errors)) {
        const fieldErrors = Object.values(d.errors as Record<string, unknown>)
            .flatMap((v) => (Array.isArray(v) ? v : [v]))
            .filter((m): m is string => typeof m === "string" && m.trim().length > 0)
            .slice(0, 3);
        if (fieldErrors.length > 0) {
            return fieldErrors.join(" • ");
        }
    }

    // Mensaje simple: { message: "..." }
    if (typeof d.message === "string" && d.message.trim()) {
        return d.message.trim();
    }

    return undefined;
}

export class ErrorHandler {
    static handle(error: unknown): ErrorResult {
        if (error instanceof AxiosError) {
            return this.handleAxiosError(error);
        }

        if (error instanceof Error) {
            return {
                userMessage: "Algo salió mal. Si el problema persiste, contacta soporte.",
                shouldRetry: false,
                category: "unknown",
            };
        }

        return {
            userMessage: "Ocurrió un error inesperado. Inténtalo de nuevo.",
            shouldRetry: false,
            category: "unknown",
        };
    }

    private static handleAxiosError(error: AxiosError): ErrorResult {
        if (!error.response) {
            return {
                userMessage: "Problema de conexión. Verifica tu internet e inténtalo de nuevo.",
                shouldRetry: true,
                category: "network",
            };
        }

        const status = error.response.status;
        const serverMessage = parseResponseMessage(error.response.data);

        return this.handleByStatus(status, serverMessage);
    }

    private static handleByStatus(status: number, serverMessage?: string): ErrorResult {
        switch (status) {
            case 400:
                return {
                    userMessage: serverMessage || "Datos incorrectos. Revisa la información.",
                    shouldRetry: false,
                    category: "validation",
                };

            case 401:
                return {
                    userMessage: serverMessage || "Sesión expirada. Inicia sesión nuevamente.",
                    shouldRetry: false,
                    category: "authentication",
                };

            case 403:
                return {
                    userMessage: serverMessage || "No tienes permisos para esta acción.",
                    shouldRetry: false,
                    category: "authentication",
                };

            case 404:
                return {
                    userMessage: serverMessage || "Información no encontrada.",
                    shouldRetry: false,
                    category: "validation",
                };

            case 422:
                return {
                    userMessage: serverMessage || "Algunos datos no son válidos, por favor revisa e intenta de nuevo.",
                    shouldRetry: false,
                    category: "validation",
                };

            case 429:
                return {
                    userMessage: serverMessage || "Demasiadas solicitudes. Espera un momento.",
                    shouldRetry: true,
                    category: "network",
                };

            case 500:
            case 502:
            case 503:
            case 504:
                return {
                    userMessage: serverMessage || "Problemas técnicos temporales. Inténtalo en unos minutos.",
                    shouldRetry: true,
                    category: "server",
                };

            default:
                return {
                    userMessage: serverMessage || "Error inesperado. Contacta soporte si persiste.",
                    shouldRetry: false,
                    category: "unknown",
                };
        }
    }
}
