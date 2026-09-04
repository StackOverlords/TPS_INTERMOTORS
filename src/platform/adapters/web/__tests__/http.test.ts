import { afterEach, describe, expect, it, vi } from 'vitest';

import { webHttp } from '../http';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('webHttp.fetchBlob', () => {
  it('devuelve el Blob del recurso', async () => {
    const blob = new Blob(['contenido']);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, blob: async () => blob })),
    );

    await expect(webHttp.fetchBlob('https://x/y.pdf')).resolves.toBe(blob);
  });

  it('no manda credenciales a orígenes ajenos', async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      blob: async () => new Blob(),
    }));
    vi.stubGlobal('fetch', fetchSpy);

    await webHttp.fetchBlob('https://otro-dominio/x.png');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://otro-dominio/x.png',
      expect.objectContaining({ method: 'GET', credentials: 'omit' }),
    );
  });

  it('lanza con el código cuando la respuesta no es 2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, blob: async () => new Blob() })),
    );

    await expect(webHttp.fetchBlob('https://x/y')).rejects.toThrow('HTTP 404');
  });

  it('menciona CORS cuando el fetch falla en red', async () => {
    // A diferencia del target escritorio (que sale por Rust y lo bypasea), en
    // web un fallo de red casi siempre es CORS. El mensaje evita que alguien
    // pierda una hora depurando la red cuando lo que falta es una cabecera.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    await expect(webHttp.fetchBlob('https://otro/x.png')).rejects.toThrow(
      /CORS/,
    );
  });
});
