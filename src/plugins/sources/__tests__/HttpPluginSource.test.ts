/**
 * Tests de `HttpPluginSource` — el camino de instalación en WEB.
 *
 * Estos tests existen porque este camino estaba ROTO y fallaba EN SILENCIO.
 * El bug tenía tres capas encadenadas, y ninguna gritaba:
 *
 *  1. El contrato pedía `install(source: string)` —un path del disco— porque
 *     nació con forma de escritorio. El navegador no tiene paths.
 *  2. Se mandaba ese string como JSON. El backend valida `file` como archivo
 *     subido, así que respondía 422 siempre.
 *  3. Y aunque se mandara un FormData: `apiClient` trae
 *     `Content-Type: application/json` por defecto, y con ese header axios 1.x
 *     serializa el FormData a JSON (`transformRequest` → `formDataToJSON`). El
 *     archivo se pierde sin que nada lance.
 *
 * El punto 3 es el peligroso: el código se ve bien, el request sale, y el
 * archivo simplemente no está. Por eso se testea el header, no solo el body.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/utils/environment', () => ({
  environment: { apiUrl: '/api/v1' },
}));

import apiClient from '@/services/axios';

import { HttpPluginSource } from '../HttpPluginSource';
import type { PluginBundle } from '../PluginSource';

const post = vi.mocked(apiClient.post);

const RESPUESTA = {
  data: {
    id: 'com.rhleone.facturacion',
    name: 'facturacionPlugin',
    version: '1.0.0',
    entry: 'com.rhleone.facturacion/remoteEntry.js',
    enabled: true,
  },
};

function bundleDeArchivo(nombre = 'facturacion.zip'): PluginBundle {
  return {
    kind: 'file',
    file: new File(['PK'], nombre, { type: 'application/zip' }),
    label: nombre,
  };
}

let source: HttpPluginSource;

beforeEach(() => {
  source = new HttpPluginSource();
  post.mockResolvedValue(RESPUESTA);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('HttpPluginSource.install', () => {
  it('manda el zip como FormData, no como JSON', async () => {
    await source.install(bundleDeArchivo());

    const [, body] = post.mock.calls[0];

    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBeInstanceOf(File);
  });

  it('usa el campo "file", que es el que valida el backend', async () => {
    await source.install(bundleDeArchivo('mi-plugin.zip'));

    const archivo = (post.mock.calls[0][1] as FormData).get('file') as File;

    expect(archivo.name).toBe('mi-plugin.zip');
  });

  it('pisa el Content-Type de JSON para que axios no serialice el FormData', async () => {
    await source.install(bundleDeArchivo());

    // Si este header quedara en `application/json`, axios convertiría el
    // FormData a JSON y el archivo desaparecería sin lanzar ningún error.
    const config = post.mock.calls[0][2] as { headers: Record<string, string> };

    expect(config.headers['Content-Type']).not.toMatch(/application\/json/);
  });

  it('rechaza un bundle de tipo path: el servidor no puede abrir rutas del cliente', async () => {
    const dePath: PluginBundle = {
      kind: 'path',
      path: '/home/usuario/plugins/facturacion',
      label: 'facturacion',
    };

    await expect(source.install(dePath)).rejects.toThrow(/zip/i);
    expect(post).not.toHaveBeenCalled();
  });

  it('devuelve el entry como URL absoluta bajo plugin-assets', async () => {
    const ref = await source.install(bundleDeArchivo());

    expect(ref.entry).toBe(
      '/api/v1/plugin-assets/com.rhleone.facturacion/remoteEntry.js',
    );
  });
});

describe('HttpPluginSource.pickBundle', () => {
  it('abre el selector DENTRO del gesto del usuario, sin await previo', () => {
    // La regla es la misma que la de `window.open()`: si el `click()` cae fuera
    // de la tarea del gesto, el navegador lo descarta sin lanzar. Testear que
    // ocurre de forma síncrona es lo único que detecta una regresión así.
    const click = vi.spyOn(HTMLInputElement.prototype, 'click');

    void source.pickBundle();

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('pide un zip', () => {
    let input: HTMLInputElement | null = null;
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      function (this: HTMLInputElement) {
        input = this;
      },
    );

    void source.pickBundle();

    expect(input!.type).toBe('file');
    expect(input!.accept).toContain('.zip');
  });

  it('resuelve con el archivo elegido', async () => {
    let input!: HTMLInputElement;
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      function (this: HTMLInputElement) {
        input = this;
      },
    );

    const pendiente = source.pickBundle();

    const archivo = new File(['PK'], 'plugin.zip');
    const dt = new DataTransfer();
    dt.items.add(archivo);
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));

    await expect(pendiente).resolves.toMatchObject({
      kind: 'file',
      label: 'plugin.zip',
    });
  });

  it('resuelve null si el usuario cancela, para no dejar colgado al que espera', async () => {
    let input!: HTMLInputElement;
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      function (this: HTMLInputElement) {
        input = this;
      },
    );

    const pendiente = source.pickBundle();
    input.dispatchEvent(new Event('cancel'));

    await expect(pendiente).resolves.toBeNull();
  });

  it('se queda con el archivo aunque llegue un "cancel" con selección', async () => {
    // El caso real que rompía la instalación: con el portal de archivos de GTK
    // el evento `cancel` llega TAMBIÉN habiendo selección. Al resolver null sin
    // mirar, el usuario elegía el zip y no pasaba absolutamente nada: ni error,
    // ni request, ni pista.
    let input!: HTMLInputElement;
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      function (this: HTMLInputElement) {
        input = this;
      },
    );

    const pendiente = source.pickBundle();

    const dt = new DataTransfer();
    dt.items.add(new File(['PK'], 'facturacion-1.0.0.zip'));
    input.files = dt.files;

    // Solo `cancel`, sin `change`: lo que hace el portal.
    input.dispatchEvent(new Event('cancel'));

    await expect(pendiente).resolves.toMatchObject({
      kind: 'file',
      label: 'facturacion-1.0.0.zip',
    });
  });

  it('el input está en el documento cuando se abre el selector', async () => {
    // Un input desprendido abre el diálogo igual, pero no todos los entornos
    // despachan `change` sobre un elemento fuera del árbol.
    let estabaEnElDocumento = false;
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      function (this: HTMLInputElement) {
        estabaEnElDocumento = document.body.contains(this);
      },
    );

    void source.pickBundle();

    expect(estabaEnElDocumento).toBe(true);
  });

  it('saca el input del documento al terminar', async () => {
    let input!: HTMLInputElement;
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
      function (this: HTMLInputElement) {
        input = this;
      },
    );

    const pendiente = source.pickBundle();
    input.dispatchEvent(new Event('cancel'));
    await pendiente;

    expect(document.body.contains(input)).toBe(false);
  });
});
