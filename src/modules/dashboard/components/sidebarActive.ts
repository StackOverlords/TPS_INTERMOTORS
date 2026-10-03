import type RouteType from "@/navigation/RouteType";
import { matchPath } from "react-router";

/**
 * ¿`href` es la ruta actual? Coincidencia exacta (también para /dashboard),
 * para evitar conflictos entre rutas que comparten prefijo.
 */
export const isNavItemActive = (href: string, pathname: string | null) =>
  pathname !== null && Boolean(matchPath({ path: href, end: true }, pathname));

/**
 * ¿La ruta actual pertenece a este grupo del menú? El sidebar lo usa para
 * pasar la ubicación solo al grupo que la contiene: los demás reciben `null`
 * en cada navegación y, con `memo`, no se vuelven a renderizar.
 */
export const routeContainsPath = (route: RouteType, pathname: string) =>
  route.isHeader
    ? (route.subRoutes ?? []).some(
        (subRoute) =>
          subRoute.path &&
          matchPath({ path: subRoute.path, end: false }, pathname)
      )
    : isNavItemActive(route.path || "/", pathname);
