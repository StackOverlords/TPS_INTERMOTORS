/**
 * Tests del relevo de sesión: una ventana secundaria que arranca sin sesión
 * (token vencido) se la pide a la principal, que es la única que renueva.
 *
 * El WindowManager es un bus en memoria; cada test juega el papel de la otra
 * ventana.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Handler = (payload: unknown) => void;

const bus = vi.hoisted(() => ({
  windowId: null as string | null,
  topics: new Map<string, Set<Handler>>(),
  windowEvents: new Map<string, Set<Handler>>(),
}));

const auth = vi.hoisted(() => ({
  user: null as unknown,
  tokens: null as unknown,
  accessToken: 'access-1' as string | null,
  getValidAccessToken: vi.fn(),
  applyRemoteSession: vi.fn(),
  expiredHandler: null as (() => void) | null,
}));

const on = (map: Map<string, Set<Handler>>, key: string, handler: Handler) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key)!.add(handler);
  return () => map.get(key)!.delete(handler);
};
const emit = (map: Map<string, Set<Handler>>, key: string, payload: unknown) => {
  map.get(key)?.forEach((handler) => handler(payload));
};
const listeners = (map: Map<string, Set<Handler>>, key: string) => map.get(key)?.size ?? 0;

vi.mock('@/platform', () => ({
  getWindowManager: () => ({
    getCurrentWindowId: () => bus.windowId,
    isSecondaryWindow: () => bus.windowId !== null,
    subscribe: async (topic: string, handler: Handler) => on(bus.topics, topic, handler),
    broadcast: async (topic: string, payload: unknown) => emit(bus.topics, topic, payload),
    listenToWindowEvent: async (id: string, event: string, handler: Handler) =>
      on(bus.windowEvents, `${id}:${event}`, handler),
    emitToWindow: async (id: string, event: string, data: unknown) =>
      emit(bus.windowEvents, `${id}:${event}`, data),
  }),
}));

vi.mock('../sdk-simple-auth', () => ({
  default: {
    ready: Promise.resolve(),
    getState: () => ({ user: auth.user, tokens: auth.tokens }),
    getValidAccessToken: auth.getValidAccessToken,
    applyRemoteSession: auth.applyRemoteSession,
  },
  onSecondaryWindowTokenExpired: (handler: () => void) => {
    auth.expiredHandler = handler;
  },
}));

const USER = { id: 7, name: 'Caja 1' };
const TOKENS = { accessToken: 'access-1', refreshToken: 'refresh-1' };

const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

/** Módulo nuevo por test: decide al importarse si es ventana secundaria. */
async function loadAs(windowId: string | null) {
  bus.windowId = windowId;
  vi.resetModules();
  return import('../secondaryWindowSession');
}

beforeEach(() => {
  bus.topics.clear();
  bus.windowEvents.clear();
  auth.user = null;
  auth.tokens = null;
  auth.expiredHandler = null;
  auth.getValidAccessToken.mockImplementation(async () => auth.accessToken);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('ventana principal', () => {
  it('responde a la ventana que pidió, con una sesión vigente', async () => {
    const { serveSessionToSecondaryWindows } = await loadAs(null);
    serveSessionToSecondaryWindows();
    await flush();
    auth.user = USER;
    auth.tokens = TOKENS;

    const received = vi.fn();
    on(bus.windowEvents, 'w1:auth:session', received);
    on(bus.windowEvents, 'w2:auth:session', received);
    emit(bus.topics, 'auth:session-request', { windowId: 'w1' });
    await flush();

    // Pasa por getValidAccessToken: renueva antes de responder si hace falta.
    expect(auth.getValidAccessToken).toHaveBeenCalledOnce();
    expect(received).toHaveBeenCalledOnce();
    expect(received).toHaveBeenCalledWith({ user: USER, tokens: TOKENS });
  });

  it('sin sesión vigente no responde nada', async () => {
    const { serveSessionToSecondaryWindows } = await loadAs(null);
    serveSessionToSecondaryWindows();
    await flush();
    auth.user = USER;
    auth.tokens = TOKENS;
    auth.getValidAccessToken.mockRejectedValueOnce(new Error('refresh 401'));

    const received = vi.fn();
    on(bus.windowEvents, 'w1:auth:session', received);
    emit(bus.topics, 'auth:session-request', { windowId: 'w1' });
    emit(bus.topics, 'auth:session-request', {});
    await flush();

    expect(received).not.toHaveBeenCalled();
  });
});

describe('ventana secundaria', () => {
  it('si ya tiene sesión no pide nada', async () => {
    const { ensureSecondaryWindowSession } = await loadAs('w1');
    auth.user = USER;
    const requested = vi.fn();
    on(bus.topics, 'auth:session-request', requested);

    await expect(ensureSecondaryWindowSession()).resolves.toBe(true);
    expect(requested).not.toHaveBeenCalled();
  });

  it('sin sesión la pide a la principal y la aplica', async () => {
    const { ensureSecondaryWindowSession } = await loadAs('w1');
    // La principal: responde a la ventana que pidió.
    on(bus.topics, 'auth:session-request', (payload) => {
      const { windowId } = payload as { windowId: string };
      emit(bus.windowEvents, `${windowId}:auth:session`, { user: USER, tokens: TOKENS });
    });

    await expect(ensureSecondaryWindowSession()).resolves.toBe(true);
    expect(auth.applyRemoteSession).toHaveBeenCalledWith(USER, TOKENS);
    expect(listeners(bus.windowEvents, 'w1:auth:session')).toBe(0);
  });

  it('si la principal no responde, sigue sin sesión al vencer el tiempo', async () => {
    vi.useFakeTimers();
    const { ensureSecondaryWindowSession } = await loadAs('w1');

    const result = ensureSecondaryWindowSession(4000);
    await vi.advanceTimersByTimeAsync(4000);

    await expect(result).resolves.toBe(false);
    expect(auth.applyRemoteSession).not.toHaveBeenCalled();
    expect(listeners(bus.windowEvents, 'w1:auth:session')).toBe(0);
  });

  it('si vence el token con la ventana abierta, pide una sesión nueva', async () => {
    await loadAs('w1');
    const requested = vi.fn();
    on(bus.topics, 'auth:session-request', requested);

    expect(auth.expiredHandler).toBeTypeOf('function');
    auth.expiredHandler!();
    await flush();

    expect(requested).toHaveBeenCalledWith({ windowId: 'w1' });
  });

  it('la principal no registra el handler de vencimiento', async () => {
    await loadAs(null);
    expect(auth.expiredHandler).toBeNull();
  });
});
