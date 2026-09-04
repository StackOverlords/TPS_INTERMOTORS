import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { webAppUpdater } from '../appUpdater';
import { webClipboard } from '../clipboard';
import { webLogger } from '../logger';
import { webWindowChrome } from '../windowChrome';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/**
 * Estos tests protegen la regla #2 de la capa: cuando una capacidad no existe
 * en el target, el puerto lo declara con un booleano y la operación degrada sin
 * romper. La UI consulta ese booleano para esconder el control.
 *
 * Si alguien "arregla" un no-op haciéndolo lanzar, estos tests fallan — que es
 * exactamente lo que se quiere.
 */

describe('webAppUpdater', () => {
  it('declara que no puede autoactualizarse', () => {
    expect(webAppUpdater.supportsSelfUpdate()).toBe(false);
  });

  it('nunca reporta una actualización disponible', async () => {
    // En web la versión desplegada la sirve el backend: "actualizar" es recargar.
    await expect(webAppUpdater.checkForUpdate()).resolves.toBeNull();
  });

  it('expone la versión inyectada en build', async () => {
    // `vitest.config.ts` define __APP_VERSION__ como '0.0.0-test'.
    await expect(webAppUpdater.getCurrentVersion()).resolves.toBe('0.0.0-test');
  });

  it('downloadAndInstall lanza con un mensaje que explica por qué', async () => {
    await expect(
      webAppUpdater.downloadAndInstall(() => {}),
    ).rejects.toThrow(/recargar la página/i);
  });

  it('relaunch recarga la página', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });

    await webAppUpdater.relaunch();

    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('webWindowChrome', () => {
  it('declara que el marco lo dibuja el navegador', () => {
    // La UI usa esto para esconder minimizar/maximizar/arrastrar.
    expect(webWindowChrome.hasCustomChrome()).toBe(false);
  });

  it('minimize y startDragging son no-op silenciosos', async () => {
    await expect(webWindowChrome.minimize()).resolves.toBeUndefined();
    await expect(webWindowChrome.startDragging()).resolves.toBeUndefined();
  });

  it('isMaximized refleja el estado de pantalla completa', async () => {
    expect(await webWindowChrome.isMaximized()).toBe(false);
  });

  it('setZoom aplica CSS zoom sobre el body', async () => {
    await webWindowChrome.setZoom(1.25);

    // Se eligió `zoom` sobre `transform: scale` porque no rompe el layout ni
    // la detección de posiciones de los popovers de Radix.
    expect(document.body.style.zoom).toBe('1.25');
  });

  it('onMaximizeChange se registra y se limpia', async () => {
    const handler = vi.fn();
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');

    const unlisten = await webWindowChrome.onMaximizeChange(handler);
    expect(add).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));

    unlisten();
    expect(remove).toHaveBeenCalledWith(
      'fullscreenchange',
      expect.any(Function),
    );
  });
});

describe('webClipboard', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { clipboard: {} });
  });

  it('declara que no puede leer imágenes si falta la Async Clipboard API', () => {
    // Firefox no expone `clipboard.read` en todos los contextos.
    expect(webClipboard.canReadImage()).toBe(false);
  });

  it('devuelve null en vez de lanzar cuando no puede leer', async () => {
    await expect(webClipboard.readImage()).resolves.toBeNull();
  });

  it('devuelve la imagen del portapapeles como data URL', async () => {
    const item = {
      types: ['text/plain', 'image/png'],
      getType: vi.fn(async () => new Blob(['bytes'], { type: 'image/png' })),
    };
    vi.stubGlobal('navigator', {
      clipboard: { read: vi.fn(async () => [item]) },
    });

    const result = await webClipboard.readImage();

    // El contrato del puerto es data URL en AMBOS targets: el adaptador Tauri
    // normaliza el base64 crudo que devuelve Rust.
    expect(result).toMatch(/^data:/);
    expect(item.getType).toHaveBeenCalledWith('image/png');
  });

  it('ignora los items del portapapeles que no son imagen', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        read: vi.fn(async () => [
          { types: ['text/plain'], getType: vi.fn() },
        ]),
      },
    });

    await expect(webClipboard.readImage()).resolves.toBeNull();
  });

  it('devuelve null si el usuario deniega el permiso', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('navigator', {
      clipboard: {
        read: vi.fn(async () => {
          throw new Error('NotAllowedError');
        }),
      },
    });

    await expect(webClipboard.readImage()).resolves.toBeNull();
  });
});

describe('webLogger', () => {
  it('escribe a la consola con el nivel correspondiente', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    webLogger.write('error', 'algo falló');
    webLogger.write('warn', 'cuidado');
    webLogger.write('info', 'listo');

    expect(error).toHaveBeenCalledWith('[ERROR] algo falló');
    expect(warn).toHaveBeenCalledWith('[WARN] cuidado');
    expect(info).toHaveBeenCalledWith('[INFO] listo');
  });

  it('mapea trace a console.debug (console.trace imprime el stack entero)', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});

    webLogger.write('trace', 'detalle');

    expect(debug).toHaveBeenCalledWith('[TRACE] detalle');
  });
});
