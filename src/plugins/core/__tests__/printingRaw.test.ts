/**
 * Tests de la detección de `printing.raw` en web.
 *
 * Nacen de una contradicción que mostró la sonda de facturación en una misma
 * pantalla:
 *
 *   ✓ printing.raw                    WebSerial=true WebUSB=true
 *   — hasCapability("printing.raw")   false
 *
 * El host declaraba `false` sobre algo que el navegador demostrablemente tenía.
 * La tabla asumía que la impresora por puerto era exclusiva de escritorio, y es
 * falso: Chromium expone WebSerial y WebUSB.
 *
 * La capability pasó a resolverse preguntándole al navegador. Como eso se
 * calcula al importar el módulo, cada test tiene que preparar el `navigator`
 * ANTES del import — de ahí el `resetModules` y el import dinámico.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CAPABILITY } from '@tps/plugin-sdk';

vi.mock('@/utils/environment', () => ({
  isTauriEnvironment: () => false,
}));

/** Reemplaza `navigator` por uno que declare (o no) las APIs de hardware. */
function navegadorCon(apis: string[]) {
  vi.stubGlobal(
    'navigator',
    Object.fromEntries(apis.map((api) => [api, {}])),
  );
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('printing.raw en web', () => {
  it('se ofrece cuando el navegador expone WebSerial', async () => {
    navegadorCon(['serial']);

    const { getCapabilitiesForTarget } = await import('../capabilities');

    expect(getCapabilitiesForTarget('web')).toContain(CAPABILITY.PRINTING_RAW);
  });

  it('se ofrece cuando expone WebUSB', async () => {
    navegadorCon(['usb']);

    const { getCapabilitiesForTarget } = await import('../capabilities');

    expect(getCapabilitiesForTarget('web')).toContain(CAPABILITY.PRINTING_RAW);
  });

  it('NO se ofrece en un navegador sin puertos', async () => {
    // Firefox y Safari. Declararla igual haría que un plugin se activara ahí
    // para reventar al primer intento de imprimir.
    navegadorCon(['userAgent']);

    const { getCapabilitiesForTarget } = await import('../capabilities');

    expect(getCapabilitiesForTarget('web')).not.toContain(
      CAPABILITY.PRINTING_RAW,
    );
  });

  it('escritorio la ofrece sin depender del navegador', async () => {
    navegadorCon(['userAgent']);

    const { getCapabilitiesForTarget } = await import('../capabilities');

    // En escritorio la resuelve el host por IPC: el navegador no participa.
    expect(getCapabilitiesForTarget('desktop')).toContain(
      CAPABILITY.PRINTING_RAW,
    );
  });

  it('la detección no altera el resto de la tabla', async () => {
    navegadorCon(['serial']);

    const { getCapabilitiesForTarget } = await import('../capabilities');
    const web = getCapabilitiesForTarget('web');

    // Lo que no depende del navegador tiene que seguir igual: CORS y el acceso
    // al disco no se arreglan preguntando.
    expect(web).not.toContain(CAPABILITY.HTTP_EXTERNAL);
    expect(web).not.toContain(CAPABILITY.FILESYSTEM);
    expect(web).toContain(CAPABILITY.HTTP);
    expect(web).toContain(CAPABILITY.PRINTING);
  });
});
