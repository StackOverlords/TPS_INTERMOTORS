/**
 * Tests de `loadExternalPlugins`: las descargas de los remotes arrancan todas
 * juntas, pero registrar y activar sigue el orden de la lista (un plugin puede
 * depender de otro ya registrado).
 */

import type { Plugin } from '@tps/plugin-sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@module-federation/runtime', () => ({
  registerRemotes: vi.fn(),
  loadRemote: vi.fn(),
}));

import { loadRemote } from '@module-federation/runtime';
import { loadExternalPlugins } from '../loadExternalPlugins';
import type { PluginManagerClass } from '../plugin-manager';
import type { ExternalPluginRef, PluginSource } from '../sources/PluginSource';

const loadRemoteMock = vi.mocked(loadRemote);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const pluginModule = (id: string) => ({
  default: {
    manifest: { id, name: id, version: '1.0.0', sdkVersion: '^0.1.0' },
    activate: () => {},
  } as unknown as Plugin,
});

function sourceWith(...names: string[]): PluginSource {
  const refs = names.map(
    (name): ExternalPluginRef =>
      ({ id: name, name, entry: `plugin://${name}/remoteEntry.js`, enabled: true }) as ExternalPluginRef,
  );
  return { list: async () => refs } as unknown as PluginSource;
}

/** Manager mínimo que anota el orden de activación. */
function fakeManager(order: string[]): PluginManagerClass {
  const registered = new Set<string>();
  const active = new Set<string>();
  return {
    isRegistered: (id: string) => registered.has(id),
    register: (plugin: Plugin) => registered.add(plugin.manifest.id),
    isActive: (id: string) => active.has(id),
    activate: async (id: string) => {
      order.push(id);
      active.add(id);
      return { ok: true };
    },
  } as unknown as PluginManagerClass;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  vi.clearAllMocks();
});

describe('loadExternalPlugins', () => {
  it('pide todos los remotes antes de esperar al primero', async () => {
    const a = deferred<ReturnType<typeof pluginModule>>();
    const b = deferred<ReturnType<typeof pluginModule>>();
    loadRemoteMock.mockImplementation(((id: string) =>
      id.startsWith('par-a') ? a.promise : b.promise) as typeof loadRemote);

    const order: string[] = [];
    const running = loadExternalPlugins(sourceWith('par-a', 'par-b'), fakeManager(order));
    await flush();

    // Las dos descargas arrancaron aunque ninguna terminó.
    expect(loadRemoteMock).toHaveBeenCalledTimes(2);
    expect(order).toEqual([]);

    // La segunda termina primero: igual se activa después de la primera.
    b.resolve(pluginModule('par-b'));
    await flush();
    expect(order).toEqual([]);
    a.resolve(pluginModule('par-a'));

    const results = await running;
    expect(order).toEqual(['par-a', 'par-b']);
    expect(results.map((r) => r.status)).toEqual(['loaded', 'loaded']);
  });

  it('una descarga que falla no frena a las demás ni queda sin manejar', async () => {
    loadRemoteMock.mockImplementation(((id: string) =>
      id.startsWith('err-a')
        ? Promise.reject(new Error('remoteEntry 404'))
        : Promise.resolve(pluginModule('err-b'))) as typeof loadRemote);

    const order: string[] = [];
    const results = await loadExternalPlugins(sourceWith('err-a', 'err-b'), fakeManager(order));

    expect(results[0]).toMatchObject({ status: 'failed', error: 'remoteEntry 404' });
    expect(results[1]).toMatchObject({ status: 'loaded' });
    expect(order).toEqual(['err-b']);
  });
});
