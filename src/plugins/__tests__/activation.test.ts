/**
 * Tests de activación del PluginManager.
 *
 * Nacen de un bug concreto: el manager tenía su PROPIA lista de capabilities
 * —`HOST_CAPABILITIES`, heredada de la Fase 2, plana y ciega al target— además
 * de la de `core/capabilities.ts`. Cuando se agregó `printing` solo se tocó la
 * segunda, así que un plugin que la pedía se registraba bien y después el
 * manager se negaba a activarlo.
 *
 * Lo caro no fue el ítem que faltaba, fue tener dos listas: cualquier
 * capability nueva había que acordarse de agregarla en los dos lados, y no
 * había nada que avisara. Por eso el test de abajo no chequea `printing` en
 * particular: chequea que el manager acepte TODO lo que el target declara.
 */

import { CAPABILITY, definePlugin, type PluginAPI } from '@tps/plugin-sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

// El manager cablea servicios del host que no hacen a la activación.
vi.mock('@/services/sdk-simple-auth', () => ({
  default: { getState: () => ({}), getCurrentUser: () => null },
}));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }) }));

import { getCapabilitiesForTarget, getCurrentTarget } from '../core/capabilities';
import { PluginManager } from '../plugin-manager';

/**
 * Un plugin mínimo con id ÚNICO POR LLAMADA.
 *
 * `PluginManager` es un singleton y no se resetea entre tests: si dos tests
 * usan el mismo id, el segundo se encuentra el plugin ya activo y `activate()`
 * devuelve `{ ok: true }` por el guard de idempotencia, sin llegar a probar
 * nada. El id lleva un sufijo aleatorio justamente para evitar eso.
 */
function plugin(requires: readonly string[], activate?: (api: PluginAPI) => void) {
  const contador = Math.random().toString(36).slice(2, 10);
  const id = `com.rhleone.test-${contador}`;

  return definePlugin({
    manifest: {
      id,
      name: `test`,
      version: '1.0.0',
      sdkVersion: '^0.1.0',
      requires: requires as never,
    },
    activate: activate ?? (() => {}),
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('activación y capabilities', () => {
  it('acepta CUALQUIER capability que el target declare', async () => {
    // Este es el test que faltaba. No nombra capabilities: las toma de la
    // fuente de verdad, así que agregar una nueva sin cablearla en el manager
    // rompe acá y no en producción.
    const delTarget = getCapabilitiesForTarget(getCurrentTarget());
    const p = plugin(delTarget);

    PluginManager.register(p);
    const resultado = await PluginManager.activate(p.manifest.id);

    expect(resultado).toEqual({ ok: true });
  });

  it('rechaza una capability que el target NO ofrece, y dice cuál', async () => {
    // En web no hay puerto de impresora. El plugin no debe activarse, y el
    // motivo tiene que viajar: antes el caller no podía distinguirlo de un
    // activate() que reventó.
    const p = plugin([CAPABILITY.VIEWS, CAPABILITY.PRINTING_RAW]);

    PluginManager.register(p);
    const resultado = await PluginManager.activate(p.manifest.id);

    expect(resultado).toEqual({
      ok: false,
      reason: 'missing-capabilities',
      missing: [CAPABILITY.PRINTING_RAW],
    });
  });

  it('distingue un activate() que lanza de una capability faltante', async () => {
    const p = plugin([CAPABILITY.VIEWS], () => {
      throw new Error('explotó adentro');
    });

    PluginManager.register(p);
    const resultado = await PluginManager.activate(p.manifest.id);

    expect(resultado).toMatchObject({ ok: false, reason: 'activate-threw' });
    expect(PluginManager.isActive(p.manifest.id)).toBe(false);
  });

  it('informa cuando el plugin ni siquiera está registrado', async () => {
    const resultado = await PluginManager.activate('com.rhleone.inexistente');

    expect(resultado).toEqual({ ok: false, reason: 'not-registered' });
  });

  it('hasCapability coincide con lo que el target declara', async () => {
    // Si `hasCapability` y el gate de activación miraran listas distintas, un
    // plugin podría activarse y después ver `false` en la capability que pidió.
    let vistas: Record<string, boolean> = {};

    const delTarget = getCapabilitiesForTarget(getCurrentTarget());
    const p = plugin(delTarget, (api) => {
      vistas = Object.fromEntries(
        delTarget.map((c) => [c, api.hasCapability(c)]),
      );
    });

    PluginManager.register(p);
    await PluginManager.activate(p.manifest.id);

    for (const capability of delTarget) {
      expect(vistas[capability]).toBe(true);
    }
  });
});
