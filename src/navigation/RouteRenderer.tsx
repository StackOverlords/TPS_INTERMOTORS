import Layout from "@/modules/dashboard/screens/layout";
import type React from "react";
import { Navigate, useLocation } from "react-router";
import type RouteType from "./RouteType";

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

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isLoading && route.type === "protected" && isAuthenticated) {
    localStorage.setItem("lastPath", location.pathname);
  }

  if (!Component) {
    return <div>Componente no encontrado para la ruta: {route.path}</div>;
  }

  if (route.type === "protected" && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
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