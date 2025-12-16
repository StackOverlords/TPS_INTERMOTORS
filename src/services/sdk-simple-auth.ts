// import { environment } from "@/utils/environment";
import { environment } from "@/utils/environment";
import { AuthSDK } from "sdk-simple-auth";
// import apiClient from "./axios";

const authSDK = new AuthSDK({
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
  },
  tokenRefresh: {
    enabled: true,
    bufferTime: 1800 // in seconds (30 minutes)
  },
  sessionValidation: {
    enabled: true,
    validateOnStartup: true,
    autoLogoutOnInvalid: true,
    maxInactivityTime: 1800 // 30 minutes
  },
  // interceptors:{
  //   enabled: true,
  //   axiosInstance: apiClient,
  //   autoInjectToken: true
  // }
})

export default authSDK;