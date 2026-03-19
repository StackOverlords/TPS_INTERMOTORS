import SplashScreen from "@/components/common/SplashScreen";
import { useCloseSecondaryWindowsOnExit } from "@/hooks/useCloseSecondaryWindowsOnExit";
import BranchSelection from "@/modules/auth/screens/BranchScreen";
import NotFound from "@/modules/shared/screens/NotFound";
import authSDK from "@/services/sdk-simple-auth";
import { useTabStore } from "@/states/tabStore";
import { environment } from "@/utils/environment";
import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import type { AuthState, AuthUser } from "sdk-simple-auth";
import protectedRoutes from "./Protected.Route";
import { publicRoutes } from "./Public.Route";
import RouteRenderer from "./RouteRenderer";
import type RouteType from "./RouteType";

const Navigation = () => {
  // Auto-cerrar ventanas secundarias cuando se cierra la app
  useCloseSecondaryWindowsOnExit();
  // console.log(authSDK.getState().user?.sucursales)
  const closeAllTabs = useTabStore(state => state.closeAllTabs);

  // Estado de autenticación
  const [authState, setAuthState] = useState<{
    user: AuthUser | null;
    selectedBranch: string | null;
  }>({
    user: null,
    selectedBranch: localStorage.getItem(environment.branch_selected_key),
  });

  // Estado de carga e inicialización
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Garantía de inicialización: espera que IndexedDB resuelva antes de leer estado
    authSDK.ready.then(() => {
      const state = authSDK.getState();
      if (state.user) {
        setAuthState({
          user: state.user,
          selectedBranch: localStorage.getItem(environment.branch_selected_key),
        });
      } else {
        setAuthState({ user: null, selectedBranch: null });
      }
      setIsLoading(false);
      setIsInitialized(true);
    });

    // Cambios subsiguientes (login, logout, expiración)
    const unsubscribe = authSDK.onAuthStateChanged((possible: AuthState) => {
      if (!possible.user) {
        // Limpiar todas las tabs cuando el usuario cierra sesión o la sesión expira
        closeAllTabs();
        setAuthState({ user: null, selectedBranch: null });
      } else {
        setAuthState({
          user: possible.user,
          selectedBranch: localStorage.getItem(environment.branch_selected_key),
        });
      }
      setIsLoading(false);
      setIsInitialized(true);
    });
    return () => unsubscribe();
  }, [closeAllTabs]);

  const handleBranchSelect = (branchId: string) => {
    localStorage.setItem(environment.branch_selected_key, branchId);
    setAuthState((prev) => ({ ...prev, selectedBranch: branchId }));
  };

  if (!isInitialized || isLoading) {
    return <SplashScreen />;
  }

  if (authState.user && !authState.selectedBranch) {
    return (
      <BranchSelection user={authState.user} onSelect={handleBranchSelect} />
    );
  }

  const mapProtectedRoutes = protectedRoutes.flatMap((rt: RouteType) => {
    const routes: RouteType[] = [];
    if (rt.path) {
      routes.push(rt);
    }
    if (rt.subRoutes) {
      const subRoutes = rt.subRoutes.filter(
        (sbrt: RouteType) => sbrt.path && !sbrt.isHeader
      );
      routes.push(...subRoutes);
    }
    return routes;
  });

  const allRoutes = [...publicRoutes, ...mapProtectedRoutes];
  return (
    <Routes>
      {allRoutes.map((route, index) => (
        <Route
          key={`${route.type}-${index}`}
          path={route.path}
          handle={route}
          element={
            <RouteRenderer
              route={route}
              isAuthenticated={!!authState.user}
              redirectTo="/"
              isLoading={isLoading}
            />
          }
        />
      ))}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Navigation;