import Layout from "@/modules/dashboard/screens/layout";
import type React from "react";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import type RouteType from "./RouteType";
import { useUserRole } from "@/hooks/useUserRole";
import { hasRouteAccess } from "@/utils/permissions";
import { showWarningToast } from "@/hooks/use-toast-enhanced";
import { useQueryClient } from "@tanstack/react-query";
import { useBranchStore } from "@/states/branchStore";
import { PERMISSIONS_QUERY_KEYS } from "@/lib/queryKeys";

interface RouteRendererProps {
  route: RouteType;
  isAuthenticated?: boolean;
  redirectTo?: string;
  isLoading: boolean;
}

const RouteRenderer: React.FC<RouteRendererProps> = ({
  route,
  isAuthenticated = true,
  redirectTo = "/",
  isLoading = false,
}) => {
  const Component = route.element;
  const location = useLocation();
  const { rol: userRole, isLoading: isLoadingRole } = useUserRole();
  const queryClient = useQueryClient();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  // Invalidate the permissions cache whenever the active branch changes.
  // This ensures useCurrentUserPermissions re-fetches with the new branch scope
  // and guards never show stale permissions from the previous branch.
  useEffect(() => {
    if (selectedBranchId) {
      queryClient.invalidateQueries({
        queryKey: PERMISSIONS_QUERY_KEYS.currentUser(),
      });
    }
  }, [selectedBranchId, queryClient]);

  if (isLoading || isLoadingRole) {
    return (
      <div className="flex-1 items-center justify-center font-medium">
        Cargando...
      </div>
    );
  }

  if (!isLoading && route.type === "protected" && isAuthenticated) {
    localStorage.setItem("lastPath", location.pathname);
  }

  if (!Component) {
    return (
      <div className="flex-1 items-center justify-center font-medium">
        Componente no encontrado para la ruta: {route.path}
      </div>
    );
  }

  if (route.type === "protected" && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Validar permisos por rol
  if (
    route.type === "protected" &&
    isAuthenticated &&
    !hasRouteAccess(route, userRole)
  ) {
    showWarningToast({
      title: "Acceso denegado",
      description: `No tienes permisos para acceder a "${route.name}"`,
    });
    return <Navigate to="/dashboard" replace />;
  }

  if (route.type === "public" && isAuthenticated) {
    const lastPath = localStorage.getItem("lastPath");
    const targetPath = lastPath && lastPath !== "/" ? lastPath : "/dashboard";
    return <Navigate to={targetPath} replace />;
  }

  if (route.type === "protected") {
    return <Layout />;
  }

  return <Component />;
};

export default RouteRenderer;
