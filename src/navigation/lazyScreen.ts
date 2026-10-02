import {
  createElement,
  lazy,
  type ComponentType,
  type FunctionComponent,
} from "react";

/**
 * Pantalla cargada bajo demanda (code splitting por ruta).
 *
 * Se comporta como `React.lazy` y además expone `preload()`: el chunk se
 * descarga la primera vez que la pantalla se muestra o cuando alguien llama a
 * `preload()` (ver `preloadScreens`), lo que ocurra antes. La promesa se
 * comparte, así que precargar y montar nunca descargan dos veces.
 *
 * `React.lazy` recuerda un rechazo para siempre, así que si la descarga falla
 * se crea una instancia nueva: el botón "Reintentar" del ErrorBoundary de la
 * pestaña vuelve a pedir el chunk en lugar de repetir el error cacheado.
 */
export type LazyScreen<P = object> = FunctionComponent<P> & {
  preload: () => Promise<unknown>;
};

export function lazyScreen<P extends object = object>(
  load: () => Promise<{ default: ComponentType<P> }>,
): LazyScreen<P> {
  let pending: Promise<{ default: ComponentType<P> }> | undefined;
  const preload = () => {
    pending ??= load().catch((error: unknown) => {
      pending = undefined;
      current = createLazy();
      throw error;
    });
    return pending;
  };
  const createLazy = () => lazy(preload);
  let current = createLazy();

  const Screen = ((props: P) => createElement(current, props)) as LazyScreen<P>;
  Screen.preload = preload;
  return Screen;
}

export function isLazyScreen(component: unknown): component is LazyScreen {
  return (
    typeof component === "function" &&
    typeof (component as Partial<LazyScreen>).preload === "function"
  );
}

type IdleScheduler = (callback: () => void) => void;

const scheduleIdle: IdleScheduler = (callback) => {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 2000 });
  } else {
    setTimeout(callback, 50);
  }
};

/**
 * Precarga en segundo plano los chunks de las pantallas, de a uno por
 * momento ocioso, para que abrir cualquier pestaña después del arranque sea
 * instantáneo sin bloquear el primer render. Devuelve una función que cancela
 * lo que quede pendiente.
 */
export function preloadScreens(
  components: Iterable<unknown>,
  schedule: IdleScheduler = scheduleIdle,
): () => void {
  const queue = [...new Set(components)].filter(isLazyScreen);
  let cancelled = false;
  const next = () => {
    if (cancelled) return;
    const screen = queue.shift();
    if (!screen) return;
    // Un fallo de precarga no es un error de la app: la pantalla reintenta
    // al montarse.
    screen
      .preload()
      .catch(() => {})
      .finally(() => schedule(next));
  };
  schedule(next);
  return () => {
    cancelled = true;
  };
}
