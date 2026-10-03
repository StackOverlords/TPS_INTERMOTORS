import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TabRouterScope } from '../TabRouterScope';

// React necesita saber que corre en un entorno de tests para que act() funcione.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let renders = 0;
let seen: { pathname: string; id?: string; state: unknown } | undefined;
let go: ((path: string, state?: unknown) => void) | undefined;

/** Pantalla dentro de una pestaña: lee ubicación, params y navigate como las reales. */
function Screen() {
  renders += 1;
  const location = useLocation();
  const { id } = useParams();
  seen = { pathname: location.pathname, id, state: location.state };
  return null;
}

/** Fuera de las pestañas (como el sidebar): siempre ve la URL real. */
function Navigator() {
  const navigate = useNavigate();
  go = (path, state) => navigate(path, { state });
  return null;
}

let active = true;

const screenElement = createElement(Screen);

function Tab() {
  // El mismo elemento en cada render, como TabContent (memo) con sus children.
  return createElement(TabRouterScope, { active, children: screenElement });
}

function App() {
  return createElement(
    MemoryRouter,
    { initialEntries: ['/dashboard/sales/5'] },
    createElement(Navigator),
    createElement(
      Routes,
      null,
      createElement(Route, { path: '/dashboard/sales/:id', element: createElement(Tab) }),
      createElement(Route, { path: '/dashboard/sales', element: createElement(Tab) }),
      createElement(Route, { path: '/dashboard/settings', element: createElement(Tab) }),
    ),
  );
}

describe('TabRouterScope', () => {
  let container: HTMLDivElement;
  let root: Root;

  const render = () =>
    act(() => {
      root.render(createElement(App));
    });

  beforeEach(() => {
    renders = 0;
    seen = undefined;
    active = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('pasa la ubicación y los params reales mientras la pestaña está activa', async () => {
    await render();
    expect(seen).toMatchObject({ pathname: '/dashboard/sales/5', id: '5' });

    await act(async () => go!('/dashboard/sales/7'));
    expect(seen).toMatchObject({ pathname: '/dashboard/sales/7', id: '7' });
  });

  it('oculta, no se re-renderiza al navegar y conserva sus propios params y state', async () => {
    await render();
    expect(seen).toMatchObject({ id: '5' });

    // La pestaña pasa a segundo plano (otra pestaña se activa).
    active = false;
    await render();
    const rendersWhenHidden = renders;

    await act(async () => go!('/dashboard/sales/7'));
    await act(async () => go!('/dashboard/settings', { openModal: true }));

    expect(renders).toBe(rendersWhenHidden);
    expect(seen).toMatchObject({ pathname: '/dashboard/sales/5', id: '5', state: null });

    // Al volver a activarse vuelve a ver la URL real.
    active = true;
    await render();
    expect(seen).toMatchObject({ pathname: '/dashboard/settings', state: { openModal: true } });
  });
});

describe('TabRouterScope al reactivarse', () => {
  let container: HTMLDivElement;
  let root: Root;

  const render = () =>
    act(() => {
      root.render(createElement(App));
    });

  beforeEach(() => {
    renders = 0;
    active = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('no re-renderiza la pantalla si vuelve a la misma URL', async () => {
    await render();
    active = false;
    await render();
    await act(async () => go!('/dashboard/settings'));
    // Volver a la URL de la pestaña (objeto location nuevo, misma URL) y activarla.
    await act(async () => go!('/dashboard/sales/5'));
    const before = renders;
    active = true;
    await render();

    expect(renders).toBe(before);
    expect(seen).toMatchObject({ pathname: '/dashboard/sales/5', id: '5' });
  });

  it('sí re-renderiza si llega un state nuevo', async () => {
    await render();
    const before = renders;
    await act(async () => go!('/dashboard/sales/5', { openModal: true }));

    expect(renders).toBeGreaterThan(before);
    expect(seen).toMatchObject({ state: { openModal: true } });
  });
});
