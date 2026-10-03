import { useContext, useState, type ContextType, type ReactNode } from "react";
import { UNSAFE_LocationContext, UNSAFE_RouteContext } from "react-router";

type LocationValue = ContextType<typeof UNSAFE_LocationContext>;
type RouteValue = ContextType<typeof UNSAFE_RouteContext>;

/**
 * Misma ubicación y misma ruta, aunque sean objetos nuevos: React Router crea
 * una `location` nueva en cada navegación, también al volver a una pestaña con
 * la misma URL. El `state` se compara por identidad, así que navegar con un
 * state nuevo (p. ej. `openModal`) siempre llega a la pantalla.
 */
function sameRouterState(
  a: { location: LocationValue; route: RouteValue },
  b: { location: LocationValue; route: RouteValue },
): boolean {
  const la = a.location.location;
  const lb = b.location.location;
  if (
    la.pathname !== lb.pathname ||
    la.search !== lb.search ||
    la.hash !== lb.hash ||
    la.state !== lb.state ||
    a.route.outlet !== b.route.outlet ||
    a.route.matches.length !== b.route.matches.length
  ) {
    return false;
  }
  return a.route.matches.every((match, index) => {
    const other = b.route.matches[index];
    return match.pathname === other.pathname && match.route.id === other.route.id;
  });
}

interface TabRouterScopeProps {
  active: boolean;
  children: ReactNode;
}

/**
 * Contexto del router para una pestaña keep-alive.
 *
 * Todas las pestañas montadas cuelgan de la ruta que coincide con la URL
 * actual, así que sin esto cada pestaña oculta:
 *  - se re-renderiza en cada navegación (todo `useLocation`, `useNavigate`,
 *    `useParams` cambia con la URL), aunque no se vea;
 *  - lee los params y el `location.state` de la pestaña VISIBLE: un detalle
 *    oculto de la venta 5 ve el id de la venta 7 y vuelve a pedirla al
 *    backend, y un `state.openModal` abre el modal también en las pestañas
 *    ocultas que lo escuchan.
 *
 * Mientras la pestaña está activa pasan la ubicación y la ruta reales; oculta,
 * conserva las últimas que vio estando activa. Al volver a activarse con la
 * misma URL conserva también esos objetos. Como el valor del Provider no
 * cambia, React no re-renderiza nada debajo.
 */
export function TabRouterScope({ active, children }: TabRouterScopeProps) {
  const location = useContext(UNSAFE_LocationContext);
  const route = useContext(UNSAFE_RouteContext);
  const [frozen, setFrozen] = useState({ location, route });

  const live = { location, route };
  const unchanged =
    (frozen.location === location && frozen.route === route) || sameRouterState(frozen, live);

  // Guardar lo último visto estando activa (actualización durante el render,
  // el patrón de React para derivar estado de props/contexto).
  if (active && !unchanged) {
    setFrozen(live);
  }

  const value = active && !unchanged ? live : frozen;

  return (
    <UNSAFE_LocationContext.Provider value={value.location}>
      <UNSAFE_RouteContext.Provider value={value.route}>{children}</UNSAFE_RouteContext.Provider>
    </UNSAFE_LocationContext.Provider>
  );
}

export default TabRouterScope;
