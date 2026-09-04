import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { webWindowManager } from '../windowManager';
import { PLATFORM_CLOSE_ALL_SECONDARY } from '@/platform/ports/windowManager';

/**
 * Doble de una ventana abierta por `window.open`.
 */
function makeWindowStub() {
  return {
    closed: false,
    focus: vi.fn(),
    close: vi.fn(function (this: { closed: boolean }) {
      this.closed = true;
    }),
    document: { title: '' },
  };
}

const baseConfig = {
  windowId: 'product-selector-test',
  route: '/window.html',
  title: 'Seleccionar Productos',
};

let openSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  openSpy = vi.fn(() => makeWindowStub());
  vi.stubGlobal('open', openSpy);
  window.open = openSpy as unknown as typeof window.open;
});

afterEach(async () => {
  // Deja el registro interno del adaptador limpio entre tests.
  await webWindowManager.closeAllSecondary();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('webWindowManager.create — regla del gesto del usuario', () => {
  /**
   * ESTE es el test que importa.
   *
   * `window.open()` solo se permite dentro del gesto del usuario. Si alguien
   * mete un `await` antes de la llamada, el navegador bloquea el popup EN
   * SILENCIO (devuelve null, no lanza) y el selector deja de abrirse sin dar
   * ninguna pista en consola.
   *
   * El test lo verifica sin depender de que el revisor se acuerde de la regla:
   * invoca `create()` y comprueba que `window.open` YA se llamó antes de
   * ceder el control al event loop.
   */
  it('llama a window.open de forma SÍNCRONA, antes del primer await', () => {
    const pending = webWindowManager.create(baseConfig);

    // Sin `await` de por medio: si el adaptador cediera antes de abrir,
    // acá el spy todavía estaría sin llamar.
    expect(openSpy).toHaveBeenCalledTimes(1);

    return pending;
  });

  it('lanza un error accionable si el navegador bloquea el popup', async () => {
    openSpy.mockReturnValueOnce(null);

    await expect(webWindowManager.create(baseConfig)).rejects.toThrow(
      /bloqueó la ventana/i,
    );
  });
});

describe('webWindowManager.create — URL y features', () => {
  it('pasa windowId, título y query params extra en la URL', async () => {
    await webWindowManager.create({
      ...baseConfig,
      queryParams: { component: 'product-selector', mode: 'create' },
    });

    const url = new URL(openSpy.mock.calls[0][0] as string, 'http://localhost');

    expect(url.pathname).toBe('/window.html');
    expect(url.searchParams.get('windowId')).toBe('product-selector-test');
    expect(url.searchParams.get('windowTitle')).toBe('Seleccionar Productos');
    expect(url.searchParams.get('component')).toBe('product-selector');
    expect(url.searchParams.get('mode')).toBe('create');
  });

  it('agrega un cache-buster para forzar contexto fresco al reabrir', async () => {
    await webWindowManager.create(baseConfig);
    const first = new URL(openSpy.mock.calls[0][0] as string, 'http://localhost');

    vi.setSystemTime(new Date(Date.now() + 1000));
    await webWindowManager.create(baseConfig);
    const second = new URL(openSpy.mock.calls[1][0] as string, 'http://localhost');

    // Sin `_ts` distinto, `window.open` con el mismo `name` reutiliza la ventana
    // y puede no recargarla: heredaríamos la cache de React Query de la sesión
    // anterior, que es justo lo que el adaptador Tauri evita destruyendo.
    expect(first.searchParams.get('_ts')).not.toBe(
      second.searchParams.get('_ts'),
    );
  });

  it('usa el windowId como nombre de ventana para poder reenfocarla', async () => {
    await webWindowManager.create(baseConfig);
    expect(openSpy.mock.calls[0][1]).toBe('product-selector-test');
  });

  it('NUNCA incluye noopener en las features', async () => {
    await webWindowManager.create(baseConfig);

    // `noopener` hace que `window.open` devuelva null y perderíamos la
    // referencia con la que cerramos y enfocamos la ventana.
    expect(openSpy.mock.calls[0][2]).not.toMatch(/noopener/);
  });

  it('traduce tamaño y redimensionado a la cadena de features', async () => {
    await webWindowManager.create({
      ...baseConfig,
      width: 900,
      height: 500,
      resizable: false,
    });

    const features = openSpy.mock.calls[0][2] as string;
    expect(features).toContain('width=900');
    expect(features).toContain('height=500');
    expect(features).toContain('resizable=no');
  });
});

describe('webWindowManager — ciclo de vida', () => {
  it('reporta la ventana como abierta y luego la cierra', async () => {
    const handle = await webWindowManager.create(baseConfig);

    expect(await webWindowManager.isOpen(baseConfig.windowId)).toBe(true);
    expect(await webWindowManager.getOpenWindowIds()).toContain(
      baseConfig.windowId,
    );

    await handle.close();

    expect(await webWindowManager.isOpen(baseConfig.windowId)).toBe(false);
  });

  it('close() devuelve false si la ventana no existe', async () => {
    expect(await webWindowManager.close('no-existe')).toBe(false);
  });

  it('deja de listar una ventana que el usuario cerró por su cuenta', async () => {
    const stub = makeWindowStub();
    openSpy.mockReturnValueOnce(stub);

    await webWindowManager.create(baseConfig);
    stub.closed = true; // el usuario apretó la X

    expect(await webWindowManager.isOpen(baseConfig.windowId)).toBe(false);
    expect(await webWindowManager.getOpenWindowIds()).toEqual([]);
  });
});

describe('webWindowManager — eventos', () => {
  it('entrega los eventos dirigidos a una ventana', async () => {
    const handler = vi.fn();
    const unlisten = await webWindowManager.listenToWindowEvent(
      'win-1',
      'product-selected',
      handler,
    );

    await webWindowManager.emitToWindow('win-1', 'product-selected', {
      id: 42,
    });

    expect(handler).toHaveBeenCalledWith({ id: 42 });

    unlisten();
    await webWindowManager.emitToWindow('win-1', 'product-selected', { id: 7 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('no cruza eventos entre ventanas distintas', async () => {
    const handler = vi.fn();
    await webWindowManager.listenToWindowEvent('win-1', 'seleccion', handler);

    await webWindowManager.emitToWindow('win-2', 'seleccion', { id: 1 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('entrega el broadcast global en el mismo contexto que lo emite', async () => {
    // BroadcastChannel NO entrega al emisor, pero `emit` de Tauri sí. El
    // adaptador despacha localmente además de publicar para igualar semántica.
    const handler = vi.fn();
    await webWindowManager.subscribe('main:heartbeat', handler);

    await webWindowManager.broadcast('main:heartbeat');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('closeAllSecondary avisa por el canal global además de cerrar', async () => {
    const handler = vi.fn();
    await webWindowManager.subscribe(PLATFORM_CLOSE_ALL_SECONDARY, handler);

    await webWindowManager.create(baseConfig);
    await webWindowManager.closeAllSecondary();

    // Tras un reload del main se pierden las referencias a los popups, pero
    // siguen vivos escuchando: el broadcast es la única vía que los alcanza.
    expect(handler).toHaveBeenCalled();
    expect(await webWindowManager.getOpenWindowIds()).toEqual([]);
  });
});

describe('webWindowManager — contexto de la ventana actual', () => {
  it('detecta la ventana principal cuando no hay windowId en la URL', () => {
    expect(webWindowManager.getCurrentWindowId()).toBeNull();
    expect(webWindowManager.isSecondaryWindow()).toBe(false);
  });
});
