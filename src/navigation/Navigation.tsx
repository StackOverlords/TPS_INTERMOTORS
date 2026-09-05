import SplashScreen from "@/components/common/SplashScreen";
import { useCloseSecondaryWindowsOnExit } from "@/hooks/useCloseSecondaryWindowsOnExit";
import BranchSelection from "@/modules/auth/screens/BranchScreen";
import NotFound from "@/modules/shared/screens/NotFound";
import { useRegistryRoutes } from "@/plugins";
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
import type { UserRole } from "@/hooks/useUserRole";

const Navigation = () => {
  // Auto-cerrar ventanas secundarias cuando se cierra la app
  useCloseSecondaryWindowsOnExit();

  // Rutas aportadas por plugins — actualizadas reactivamente cuando un plugin
  // llama a api.registerRoutes(). useSyncExternalStore garantiza consistencia
  // en Concurrent Mode y evita tearing.
  const registryRoutes = useRegistryRoutes();
  // console.log(authSDK.getState().user?.sucursales)
  const closeAllTabs = useTabStore((state) => state.closeAllTabs);

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

  // Adaptador RouteConfig (SDK) → RouteType (TPS).
  // Mapeo de campos:
  //   SDK `component` → RouteType `element`  (ComponentType)
  //   SDK `path`      → RouteType `path`     (string)
  //   SDK `label`     → RouteType `name`     (string visible en sidebar/tabs)
  //   SDK `icon`      → RouteType `icon`     (ComponentType, compatible)
  //   SDK `roles`     → RouteType `role`     (string[] cast a UserRole[] — el guard de roles
  //                                           de RouteRenderer filtra por hasRouteAccess,
  //                                           que compara strings; el cast es seguro)
  // Las rutas de plugins son siempre `type: "protected"` — un plugin no puede registrar
  // rutas públicas (login, etc.) a través del SDK.
  const pluginRoutes: RouteType[] = registryRoutes.map((rc) => ({
    path: rc.path,
    element: rc.component,
    name: rc.label,
    type: "protected" as const,
    icon: rc.icon,
    role: rc.roles as UserRole[] | undefined,
  }));

  const allRoutes = [...publicRoutes, ...mapProtectedRoutes, ...pluginRoutes];
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
