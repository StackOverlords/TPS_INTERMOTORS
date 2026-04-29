// import { environment } from "@/utils/environment";
import { environment } from "@/utils/environment";
import { AuthSDK } from "sdk-simple-auth";
// import apiClient from "./axios";

export interface AuthTokenRelayPayload {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export function createAuthSDK(isSecondary: boolean): AuthSDK {
  return new AuthSDK({
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
      enabled: true,
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
}

// Detect secondary window at module level so the singleton is correctly configured
// for BOTH the AuthSDKContext (window-entry.tsx) AND the axios interceptor (axios.ts),
// which imports this module directly and cannot use React context.
const isSecondaryWindow =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("windowId") !== null;

const authSDK = createAuthSDK(isSecondaryWindow);

export default authSDK;
