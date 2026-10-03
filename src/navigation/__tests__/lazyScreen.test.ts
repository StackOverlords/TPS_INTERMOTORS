import { describe, expect, it, vi } from 'vitest';
import { isLazyScreen, lazyScreen, preloadScreens } from '../lazyScreen';

const Screen = () => null;

describe('lazyScreen', () => {
  it('descarga el chunk una sola vez aunque se precargue varias veces', async () => {
    const load = vi.fn(() => Promise.resolve({ default: Screen }));
    const screen = lazyScreen(load);

    await Promise.all([screen.preload(), screen.preload()]);
    await screen.preload();

    expect(load).toHaveBeenCalledTimes(1);
    expect(isLazyScreen(screen)).toBe(true);
  });

  it('vuelve a pedir el chunk después de un fallo', async () => {
    const load = vi
      .fn<() => Promise<{ default: typeof Screen }>>()
      .mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module'))
      .mockResolvedValueOnce({ default: Screen });
    const screen = lazyScreen(load);

    await expect(screen.preload()).rejects.toThrow('dynamically imported module');
    await expect(screen.preload()).resolves.toEqual({ default: Screen });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('no considera lazy a un componente normal', () => {
    expect(isLazyScreen(Screen)).toBe(false);
    expect(isLazyScreen(undefined)).toBe(false);
  });
});

describe('preloadScreens', () => {
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('precarga cada pantalla una vez, de a una, e ignora las que no son lazy', async () => {
    const loads = [vi.fn(), vi.fn()].map((fn) =>
      fn.mockImplementation(() => Promise.resolve({ default: Screen })),
    );
    const [a, b] = loads.map((load) => lazyScreen(load));
    const scheduled: Array<() => void> = [];

    preloadScreens([a, Screen, b, a, undefined], (callback) => scheduled.push(callback));

    // Nada se descarga hasta el primer momento ocioso.
    expect(loads[0]).not.toHaveBeenCalled();
    scheduled.shift()!();
    expect(loads[0]).toHaveBeenCalledTimes(1);
    expect(loads[1]).not.toHaveBeenCalled();

    await flush();
    scheduled.shift()!();
    expect(loads[1]).toHaveBeenCalledTimes(1);

    await flush();
    scheduled.shift()?.();
    expect(scheduled).toHaveLength(0);
    expect(loads[0]).toHaveBeenCalledTimes(1);
  });

  it('se puede cancelar', () => {
    const load = vi.fn(() => Promise.resolve({ default: Screen }));
    const scheduled: Array<() => void> = [];

    const cancel = preloadScreens([lazyScreen(load)], (callback) => scheduled.push(callback));
    cancel();
    scheduled.shift()!();

    expect(load).not.toHaveBeenCalled();
  });

  it('sigue con la cola si una precarga falla', async () => {
    const failing = lazyScreen<object>(() => Promise.reject(new Error('offline')));
    const load = vi.fn(() => Promise.resolve({ default: Screen }));
    const scheduled: Array<() => void> = [];

    preloadScreens([failing, lazyScreen(load)], (callback) => scheduled.push(callback));
    scheduled.shift()!();
    await flush();
    scheduled.shift()!();

    expect(load).toHaveBeenCalledTimes(1);
  });
});
