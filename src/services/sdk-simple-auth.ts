// import { environment } from "@/utils/environment";
import { environment } from "@/utils/environment";
import { AuthSDK } from "sdk-simple-auth";
// import apiClient from "./axios";

export interface AuthTokenRelayPayload {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

let secondaryTokenExpiredHandler: (() => void) | null = null;

/**
 * Qué hacer cuando vence el token en una ventana secundaria (lo registra
 * `secondaryWindowSession`: pedirle una sesión vigente a la principal).
 */
export function onSecondaryWindowTokenExpired(handler: () => void): void {
  secondaryTokenExpiredHandler = handler;
}

/**
 * En una ventana secundaria el SDK no puede borrar el almacenamiento de la
 * sesión: es el MISMO IndexedDB que usa la ventana principal.
 *
 * Al arrancar, el SDK lee los tokens guardados y, si el access token venció
 * —pasa tras suspender la PC o con la app en segundo plano, aunque el refresh
 * token siga vigente—, ejecuta `clearAll()`. Desde una secundaria eso cerraba
 * la sesión de TODA la app: la principal quedaba sin tokens y al recargar
 * volvía al login, sin que nadie intentara renovar.
 *
 * Tampoco puede cerrar la sesión cuando su token vence: el SDK hace `logout()`,
 * que revoca el token en el backend y avisa a todas las ventanas por tabSync,
 * así que la principal también perdía la sesión. En su lugar se le pide una
 * vigente a la principal, que es la única que renueva.
 *
 * `storageManager` y `handleTokenExpiration` son internos del SDK: si una
 * versión futura los cambia, el guard deja de aplicarse (lo cubre un test).
 */
function protectSharedSession(sdk: AuthSDK): void {
  const internals = sdk as unknown as {
    storageManager?: { clearAll?: () => Promise<void> };
    handleTokenExpiration?: () => Promise<void>;
  };

  const storage = internals.storageManager;
  if (typeof storage?.clearAll === "function") {
    storage.clearAll = async () => {
      console.warn(
        "[auth] Ventana secundaria: se evitó borrar la sesión compartida con la ventana principal.",
      );
    };
  }

  if (typeof internals.handleTokenExpiration === "function") {
    internals.handleTokenExpiration = async () => {
      secondaryTokenExpiredHandler?.();
    };
  }
}

export function createAuthSDK(isSecondary: boolean): AuthSDK {
  const sdk = new AuthSDK({
    authServiceUrl: environment.apiUrl,
    endpoints: {
      login: "/login",
      logout: "/logout",
      refresh: "/refresh"
    },
    storage: {
      type: "indexedDB",
      dbName: "tps-intermotors",
      storeName: "auth",
      dbVersion: 1,
      tokenKey: "tps-intermotors_auth_token",
      userKey: "tps-intermotors_auth_user",
      refreshTokenKey: "tps-intermotors_auth_refresh_token",
      encryption: {
        enabled: true,
        secret: "tps-intermotors", // Use a secure, random secret in production
      }
    },
    tokenRefresh: {
      // Solo la ventana principal renueva. Si cada ventana programaba su propio
      // refresh, todas lo hacían a la vez con el mismo refresh token: el backend
      // acepta uno y rechaza el resto, y la ventana que perdía cerraba la sesión.
      // Las secundarias reciben los tokens nuevos por tabSync (TOKEN_REFRESHED).
      enabled: !isSecondary,
      // bufferTime omitted — SDK internal inconsistency: scheduler treats it as ms, shouldRefreshToken() as seconds.
      // Default fallbacks (900*1000 for scheduler, 900 for check) are internally consistent = 15 min both.
    },
    sessionValidation: {
      enabled: false,
      validateOnStartup: false,
      autoLogoutOnInvalid: true,
    },
    tabSync: {
      enabled: true,
      channelName: "tps-auth-sync"
    },
    // interceptors:{
    //   enabled: true,
    //   axiosInstance: apiClient,
    //   autoInjectToken: true
    // }
  });

  // Sincrónico, antes de que la inicialización del SDK llegue a `clearAll()`:
  // el constructor la arranca pero su primer paso es un `await`.
  if (isSecondary) protectSharedSession(sdk);

  return sdk;
}

// Detect secondary window at module level so the singleton is correctly configured
// for BOTH the AuthSDKContext (window-entry.tsx) AND the axios interceptor (axios.ts),
// which imports this module directly and cannot use React context.
const isSecondaryWindow =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("windowId") !== null;

const authSDK = createAuthSDK(isSecondaryWindow);

export default authSDK;
