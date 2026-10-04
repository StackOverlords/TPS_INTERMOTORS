/**
 * Tests del guard de sesión compartida en ventanas secundarias.
 *
 * Se usa el SDK instalado de verdad: el guard parchea internos suyos
 * (`storageManager.clearAll`, `handleTokenExpiration`), y si una versión nueva
 * los renombra, estos tests tienen que fallar en vez de que el guard deje de
 * aplicarse sin que nadie se entere.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AuthSDK } from 'sdk-simple-auth';
import { createAuthSDK, onSecondaryWindowTokenExpired } from '../sdk-simple-auth';

type Internals = {
  storageManager: { clearAll: () => Promise<void> };
  handleTokenExpiration: () => Promise<void>;
  config: { tokenRefresh: { enabled: boolean } };
};

const internals = (sdk: AuthSDK) => sdk as unknown as Internals;

afterEach(() => {
  vi.restoreAllMocks();
  onSecondaryWindowTokenExpired(() => {});
});

describe('createAuthSDK', () => {
  it('la versión instalada del SDK tiene los internos que parchea el guard', () => {
    const sdk = internals(createAuthSDK(false));

    expect(typeof sdk.storageManager?.clearAll).toBe('function');
    expect(typeof sdk.handleTokenExpiration).toBe('function');
  });

  it('principal: renueva tokens y deja el SDK sin tocar', () => {
    const sdk = internals(createAuthSDK(false));

    expect(sdk.config.tokenRefresh.enabled).toBe(true);
    expect(Object.hasOwn(sdk, 'handleTokenExpiration')).toBe(false);
    expect(Object.hasOwn(sdk.storageManager, 'clearAll')).toBe(false);
  });

  it('secundaria: no renueva (lo hace solo la principal)', () => {
    expect(internals(createAuthSDK(true)).config.tokenRefresh.enabled).toBe(false);
  });

  it('secundaria: no puede borrar la sesión compartida', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sdk = internals(createAuthSDK(true));
    const original = Object.getPrototypeOf(sdk.storageManager).clearAll as () => Promise<void>;
    const originalSpy = vi.spyOn(Object.getPrototypeOf(sdk.storageManager), 'clearAll');

    await sdk.storageManager.clearAll();

    expect(sdk.storageManager.clearAll).not.toBe(original);
    expect(originalSpy).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledOnce();
  });

  it('secundaria: si vence el token pide sesión en vez de cerrar la de toda la app', async () => {
    const onExpired = vi.fn();
    onSecondaryWindowTokenExpired(onExpired);
    const auth = createAuthSDK(true);
    const logout = vi.spyOn(auth, 'logout').mockResolvedValue(undefined);

    await internals(auth).handleTokenExpiration();

    expect(onExpired).toHaveBeenCalledOnce();
    expect(logout).not.toHaveBeenCalled();
  });
});
