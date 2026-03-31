import { createContext, useContext } from "react";
import authSDK from "@/services/sdk-simple-auth";
import type { AuthSDK } from "sdk-simple-auth";

// Default value is the main window singleton.
// Components that use useAuthSDK() without a Provider still get the correct
// main-window SDK instance — zero breaking change for the 73+ existing consumers.
export const AuthSDKContext = createContext<AuthSDK>(authSDK);

export function useAuthSDK(): AuthSDK {
  return useContext(AuthSDKContext);
}
