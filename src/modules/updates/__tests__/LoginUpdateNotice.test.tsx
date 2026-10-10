import { act, createElement, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginUpdateNotice } from '../components/LoginUpdateNotice';

// React necesita saber que corre en un entorno de tests para que act() funcione.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Props = ComponentProps<typeof LoginUpdateNotice>;

describe('LoginUpdateNotice', () => {
  let container: HTMLDivElement;
  let root: Root;
  let props: Props;

  const render = (overrides: Partial<Props> = {}) =>
    act(() => {
      root.render(createElement(LoginUpdateNotice, { ...props, ...overrides }));
    });
  const text = () => container.textContent ?? '';
  const button = (label: string) =>
    [...container.querySelectorAll('button')].find((b) => b.textContent === label);

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    props = {
      version: '1.13.0-t1',
      currentVersion: '1.11.0',
      isDownloading: false,
      isInstalling: false,
      progress: 0,
      error: null,
      onUpdate: vi.fn(),
      onShowNotes: vi.fn(),
    };
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('anuncia la versión sin la variante y ofrece ver novedades o actualizar', async () => {
    await render();

    expect(text()).toContain('Versión 1.13.0 disponible');
    expect(text()).toContain('Tienes la 1.11.0');
    expect(text()).toContain('Configuración > Actualizaciones');

    await act(() => button('Ver novedades')!.click());
    expect(props.onShowNotes).toHaveBeenCalledOnce();
    await act(() => button('Actualizar ahora')!.click());
    expect(props.onUpdate).toHaveBeenCalledOnce();
  });

  it('mientras descarga muestra el avance y no ofrece botones', async () => {
    await render({ isDownloading: true, progress: 44.6 });

    expect(text()).toContain('Descargando…');
    expect(text()).toContain('45 %');
    expect(text()).toContain('se reiniciará sola');
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('si falla, muestra el motivo y permite reintentar', async () => {
    await render({ error: 'No se pudo actualizar: error sending request' });

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      'No se pudo actualizar: error sending request',
    );
    await act(() => button('Reintentar')!.click());
    expect(props.onUpdate).toHaveBeenCalledOnce();
  });
});
