/**
 * Tests de `api.http` — el acceso del plugin al backend propio.
 *
 * La sonda de facturación mostró el agujero: un plugin no tenía forma de
 * hablar con el backend. `fetch` crudo devolvía 401 porque no lleva el token, y
 * el cliente del host no se puede importar desde un plugin externo (no es un
 * módulo compartido de Module Federation y el alias `@/` no existe en su
 * build). Para un plugin de facturación eso es TODO su trabajo bloqueado.
 *
 * Lo que estos tests fijan es la parte que se puede romper en silencio: que la
 * llamada pase por el cliente del host —y por lo tanto herede el token— y no
 * por un cliente propio que se desincronice en el primer cambio de sesión.
 */

import { CAPABILITY, definePlugin, type PluginAPI } from '@tps/plugin-sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/sdk-simple-auth', () => ({
  default: { getState: () => ({}), getCurrentUser: () => null },
}));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(),
  }),
}));
vi.mock('@/services/axios', () => ({
  default: {
    get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(),
  },
}));

import apiClient from '@/services/axios';

import { PluginManager } from '../plugin-manager';

const cliente = vi.mocked(apiClient);

/**
 * Activa un plugin y devuelve el `api` que recibió.
 *
 * El id lleva sufijo aleatorio: `PluginManager` es un singleton que no se
 * resetea entre tests, y reusar un id hace que el guard de idempotencia corte
 * la activación sin probar nada.
 */
async function apiDeUnPluginActivo(): Promise<PluginAPI> {
  let capturada!: PluginAPI;

  const p = definePlugin({
    manifest: {
      id: `com.rhleone.http-${Math.random().toString(36).slice(2, 10)}`,
      name: 'httpTest',
      version: '1.0.0',
      sdkVersion: '^0.1.0',
      requires: [CAPABILITY.HTTP],
    },
    activate: (api) => {
      capturada = api;
    },
  });

  PluginManager.register(p);
  await PluginManager.activate(p.manifest.id);

  return capturada;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('api.http', () => {
  it('http es parte del contrato que recibe el plugin', async () => {
    const api = await apiDeUnPluginActivo();

    for (const metodo of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      expect(typeof api.http[metodo]).toBe('function');
    }
  });

  it('pasa por el cliente del host, que es lo que lleva el token', async () => {
    // Si esto dejara de valer, el plugin estaría hablando con un cliente sin
    // sesión: 401 en producción y verde en los tests.
    cliente.get.mockResolvedValue({ data: [{ id: 1 }] });

    const api = await apiDeUnPluginActivo();
    await api.http.get('/facturas');

    expect(cliente.get).toHaveBeenCalledTimes(1);
    expect(cliente.get.mock.calls[0][0]).toBe('/facturas');
  });

  it('devuelve el cuerpo ya deserializado, no la respuesta cruda', async () => {
    cliente.get.mockResolvedValue({ data: [{ id: 1 }], status: 200 });

    const api = await apiDeUnPluginActivo();

    await expect(api.http.get('/facturas')).resolves.toEqual([{ id: 1 }]);
  });

  it('manda el body en los métodos que lo llevan', async () => {
    cliente.post.mockResolvedValue({ data: { id: 9 } });

    const api = await apiDeUnPluginActivo();
    await api.http.post('/facturas', { total: 100 });

    expect(cliente.post.mock.calls[0][1]).toEqual({ total: 100 });
  });

  it('reenvía params y signal al cliente', async () => {
    cliente.get.mockResolvedValue({ data: null });

    const api = await apiDeUnPluginActivo();
    const controlador = new AbortController();

    await api.http.get('/facturas', {
      params: { sucursal: 3 },
      signal: controlador.signal,
    });

    expect(cliente.get.mock.calls[0][1]).toMatchObject({
      params: { sucursal: 3 },
      signal: controlador.signal,
    });
  });

  it('ignora un Authorization puesto por el plugin', async () => {
    // Dejarlo pasar significaría que un plugin puede hablar con el backend como
    // otra sesión. El interceptor del host la pone después, así que el efecto
    // real depende del orden: mejor descartarla acá, explícitamente.
    cliente.get.mockResolvedValue({ data: null });

    const api = await apiDeUnPluginActivo();
    await api.http.get('/facturas', {
      headers: { Authorization: 'Bearer robado', 'X-Propio': 'ok' },
    });

    const { headers } = cliente.get.mock.calls[0][1] as {
      headers: Record<string, string>;
    };

    expect(headers).not.toHaveProperty('Authorization');
    expect(headers['X-Propio']).toBe('ok');
  });

  it('lo ignora sin importar cómo lo escriban', async () => {
    cliente.get.mockResolvedValue({ data: null });

    const api = await apiDeUnPluginActivo();
    await api.http.get('/x', { headers: { authorization: 'Bearer robado' } });

    const { headers } = cliente.get.mock.calls[0][1] as {
      headers: Record<string, string>;
    };

    expect(Object.keys(headers)).toHaveLength(0);
  });

  it.each([
    'https://impuestos.example.com/facturas',
    'HTTP://impuestos.example.com/facturas',
    '//impuestos.example.com/facturas',
    '  https://impuestos.example.com/facturas',
  ])('rechaza la URL absoluta %s: el token del usuario no sale del backend propio', async (url) => {
    // Con una URL absoluta axios ignora baseURL y el interceptor del host le
    // pone el token igual: la sesión del usuario terminaría en un tercero.
    const api = await apiDeUnPluginActivo();

    await expect(api.http.get(url)).rejects.toThrow('http.external');
    await expect(api.http.post(url, {})).rejects.toThrow('relativas a la API');
    expect(cliente.get).not.toHaveBeenCalled();
    expect(cliente.post).not.toHaveBeenCalled();
  });

  it('pide a axios no aceptar URLs absolutas (segunda defensa)', async () => {
    cliente.get.mockResolvedValue({ data: null });

    const api = await apiDeUnPluginActivo();
    await api.http.get('/facturas');

    expect(cliente.get.mock.calls[0][1]).toMatchObject({ allowAbsoluteUrls: false });
  });

  it('deja propagar el error para que el plugin decida', async () => {
    cliente.post.mockRejectedValue(new Error('HTTP 422'));

    const api = await apiDeUnPluginActivo();

    await expect(api.http.post('/facturas', {})).rejects.toThrow('HTTP 422');
  });
});
