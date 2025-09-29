// import { environment } from "@/utils/environment";
import { environment } from "@/utils/environment";
import { AuthSDK } from "sdk-simple-auth";

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
        bufferTime: 900
    }
})

export default authSDK;