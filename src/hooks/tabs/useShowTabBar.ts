import { useLocation } from "react-router";
import { useMemo, useState, useEffect } from "react";
import authSDK from "@/services/sdk-simple-auth";
import { environment } from "@/utils/environment";
import type { AuthState } from "sdk-simple-auth";
import { publicRoutes } from "@/navigation/Public.Route";

/**
 * Hook que determina si el TabBar debe mostrarse o no
 * basado en el estado de autenticación y la ruta actual
 */
export const useShowTabBar = () => {
  const location = useLocation();
  
  // Estado reactivo de autenticación
  const [authState, setAuthState] = useState<{
    user: AuthState["user"];
    selectedBranch: string | null;
    isInitialized: boolean;
  }>({
    user: authSDK.getState().user,
    selectedBranch: localStorage.getItem(environment.branch_selected_key),
    isInitialized: false,
  });

  // Suscribirse a cambios de autenticación
  useEffect(() => {
    const unsubscribe = authSDK.onAuthStateChanged((state) => {
      setAuthState({
        user: state.user,
        selectedBranch: localStorage.getItem(environment.branch_selected_key),
        isInitialized: true,
      });
    });

    return () => unsubscribe();
  }, []);

  // Calcular si debe mostrarse el TabBar
  const shouldShowTabBar = useMemo(() => {
    // ⏳ No mostrar mientras se inicializa
    if (!authState.isInitialized) {
      return false;
    }

    const publicPathRoutes = publicRoutes.map(route=>route.path);
    const allPublicRoutes = [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/not-found",
      ...publicPathRoutes,
    ];

    if (allPublicRoutes.includes(location.pathname)) {
      return false;
    }

    if (!authState.user) {
      return false;
    }

    if (!authState.selectedBranch && location.pathname === "/branch") {
      return false;
    }

    // Mostrar en todas las rutas protegidas (dashboard, productos, etc.)
    return true;
  }, [authState, location.pathname]);

  return {
    shouldShowTabBar,
    isAuthenticated: !!authState.user,
    hasSelectedBranch: !!authState.selectedBranch,
    isInitialized: authState.isInitialized,
  };
};