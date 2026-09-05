/**
 * Tests de `getPluginSource()` — la resolución de fuente por target.
 *
 * A diferencia de `src/platform`, acá la elección es en RUNTIME, y eso tiene
 * una consecuencia que conviene tener clavada con un test: el barril importa
 * las DOS fuentes de forma estática, así que el bundle web se lleva
 * `TauriPluginSource` y con él `@tauri-apps/plugin-dialog` y
 * `@tauri-apps/api/core`.
 *
 * Peso muerto es aceptable. Que EXPLOTEN al importarse no lo es: el barril
 * entra por un `import()` dinámico desde `main.tsx`, así que un throw en el
 * cuerpo de cualquiera de esos módulos rechazaría la promesa y NINGÚN plugin
 * cargaría en web — sin error visible en pantalla, solo un sidebar sin plugins.
 *
 * Estos tests corren en happy-dom, o sea sin `__TAURI_INTERNALS__`: exactamente
 * el escenario del navegador.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/utils/environment', async () => ({
  environment: { apiUrl: '/api/v1' },
  isTauriEnvironment: vi.fn(() => false),
}));

import { isTauriEnvironment } from '@/utils/environment';

const esTauri = vi.mocked(isTauriEnvironment);

beforeEach(() => {
  // El barril cachea la instancia en un módulo, así que hay que resetear el
  // registro para que cada test resuelva de nuevo.
  vi.resetModules();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('getPluginSource', () => {
  it('importar el barril fuera de Tauri no lanza', async () => {
    // Si esto falla, el `import("./plugins/sources")` de main.tsx se rechaza y
    // en web no carga ningún plugin, en silencio.
    await expect(import('../index')).resolves.toBeDefined();
  });

  it('en el navegador devuelve la fuente HTTP', async () => {
    esTauri.mockReturnValue(false);

    const { getPluginSource, HttpPluginSource } = await import('../index');

    expect(getPluginSource()).toBeInstanceOf(HttpPluginSource);
  });

  it('en escritorio devuelve la fuente de Tauri', async () => {
    esTauri.mockReturnValue(true);

    const { getPluginSource, TauriPluginSource } = await import('../index');

    expect(getPluginSource()).toBeInstanceOf(TauriPluginSource);
  });

  it('devuelve siempre la misma instancia', async () => {
    const { getPluginSource } = await import('../index');

    expect(getPluginSource()).toBe(getPluginSource());
  });

  it('las dos fuentes cumplen el contrato completo', async () => {
    const { HttpPluginSource, TauriPluginSource } = await import('../index');

    // Un método faltante en una de las dos solo se notaría al hacer click en
    // producción, y únicamente en ese target.
    for (const Fuente of [HttpPluginSource, TauriPluginSource]) {
      const fuente = new Fuente();

      for (const metodo of [
        'list',
        'pickBundle',
        'install',
        'uninstall',
        'setEnabled',
      ] as const) {
        expect(typeof fuente[metodo]).toBe('function');
      }
    }
  });
});
