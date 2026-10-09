/**
 * Configuración del SDK según la ventana.
 *
 * Las ventanas secundarias comparten la sesión (IndexedDB) con la principal.
 * Con `instanceRole: 'secondary'` el SDK no renueva tokens ni borra esa sesión
 * por su cuenta (antes lo hacía y cerraba la sesión de toda la app), y si su
 * token vence se la pide a la principal.
 */

import { describe, expect, it } from 'vitest';
import type { AuthSDK } from 'sdk-simple-auth';
import { createAuthSDK } from '../sdk-simple-auth';

type Config = {
  instanceRole: 'primary' | 'secondary';
  tokenRefresh: { enabled: boolean };
  tabSync: { enabled: boolean; channelName: string };
};

const configOf = (sdk: AuthSDK) => (sdk as unknown as { config: Config }).config;

describe('createAuthSDK', () => {
  it('principal: renueva tokens y es dueña de la sesión compartida', () => {
    const config = configOf(createAuthSDK(false));

    expect(config.instanceRole).toBe('primary');
    expect(config.tokenRefresh.enabled).toBe(true);
  });

  it('secundaria: no renueva ni borra la sesión, la pide a la principal', () => {
    const config = configOf(createAuthSDK(true));

    expect(config.instanceRole).toBe('secondary');
    expect(config.tokenRefresh.enabled).toBe(false);
    // El pedido de sesión viaja por tabSync: tiene que estar activo.
    expect(config.tabSync).toMatchObject({ enabled: true, channelName: 'tps-auth-sync' });
  });
});
