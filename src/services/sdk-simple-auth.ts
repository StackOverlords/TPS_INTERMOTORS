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
      bufferTime: 1800 // in seconds (30 minutes)
    },
    sessionValidation: {
      enabled: true,
      validateOnStartup: !isSecondary,
      autoLogoutOnInvalid: true,
      maxInactivityTime: 1800 // 30 minutes
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

const authSDK = createAuthSDK(false);

export default authSDK;