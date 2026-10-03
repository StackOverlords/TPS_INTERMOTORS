/**
 * Tests del arranque de plugins externos.
 *
 * Escritorio carga apenas arranca (la lista sale del disco, sin token). Web
 * espera a que haya sesión: antes, si la app arrancaba en el login, la lista
 * daba 401 y los plugins no aparecían hasta recargar la página.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type AuthListener = (state: { user: unknown }) => void;

const auth = vi.hoisted(() => ({
  user: null as unknown,
  listeners: [] as AuthListener[],
  readyResolve: (() => {}) as () => void,
  ready: Promise.resolve(),
}));
const target = vi.hoisted(() => ({ value: 'web' as 'web' | 'desktop' }));
const loadExternalPlugins = vi.hoisted(() => vi.fn());

vi.mock('@/services/sdk-simple-auth', () => ({
  default: {
    get ready() {
      return auth.ready;
    },
    getState: () => ({ user: auth.user }),
    onAuthStateChanged: (listener: AuthListener) => {
      auth.listeners.push(listener);
      return () => {};
    },
  },
}));
vi.mock('../core/capabilities', () => ({ getCurrentTarget: () => target.value }));
vi.mock('../loadExternalPlugins', () => ({ loadExternalPlugins }));
vi.mock('../sources', () => ({ getPluginSource: () => ({}) }));
vi.mock('../plugin-manager', () => ({ PluginManager: {} }));
vi.mock('../bootstrapLoadResults', () => ({ setBootstrapLoadResults: vi.fn() }));

const flush = async () => {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
};

const emit = (user: unknown) => {
  auth.user = user;
  auth.listeners.forEach((listener) => listener({ user }));
};

async function start() {
  // Módulo nuevo en cada test: guarda estado de carga a nivel de módulo.
  vi.resetModules();
  const { startExternalPlugins } = await import('../bootstrapExternalPlugins');
  startExternalPlugins();
  await flush();
}

beforeEach(() => {
  auth.user = null;
  auth.listeners = [];
  auth.ready = new Promise<void>((resolve) => {
    auth.readyResolve = resolve;
  });
  loadExternalPlugins.mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('startExternalPlugins', () => {
  it('escritorio: carga al arrancar, sin esperar sesión', async () => {
    target.value = 'desktop';
    await start();

    expect(loadExternalPlugins).toHaveBeenCalledTimes(1);
  });

  it('web con sesión guardada: carga cuando el SDK la restaura', async () => {
    target.value = 'web';
    auth.user = { id: 1 };
    await start();
    expect(loadExternalPlugins).not.toHaveBeenCalled();

    auth.readyResolve();
    await flush();
    expect(loadExternalPlugins).toHaveBeenCalledTimes(1);
  });

  it('web sin sesión: no pide la lista hasta el login, y la pide al iniciar sesión', async () => {
    target.value = 'web';
    await start();
    auth.readyResolve();
    await flush();
    expect(loadExternalPlugins).not.toHaveBeenCalled();

    emit({ id: 1 });
    await flush();
    expect(loadExternalPlugins).toHaveBeenCalledTimes(1);

    // Renovar el token (sigue habiendo usuario) no vuelve a cargar.
    emit({ id: 1 });
    await flush();
    expect(loadExternalPlugins).toHaveBeenCalledTimes(1);

    // Cerrar sesión y entrar de nuevo, sí.
    emit(null);
    emit({ id: 2 });
    await flush();
    expect(loadExternalPlugins).toHaveBeenCalledTimes(2);
  });
});
