import { CAPABILITY, type PluginManifest } from '@tps/plugin-sdk';
import { describe, expect, it } from 'vitest';

import {
  checkPluginCompatibility,
  getCapabilitiesForTarget,
} from '../capabilities';

/**
 * Estos tests protegen la decisión de si un plugin corre o no en cada target.
 *
 * Equivocarse acá tiene dos formas, las dos malas: dejar activar un plugin que
 * va a reventar al primer uso, o excluir uno que funcionaría perfecto.
 */

function manifest(overrides: Partial<PluginManifest> = {}): PluginManifest {
  return {
    id: 'com.rhleone.test',
    name: 'testPlugin',
    version: '1.0.0',
    sdkVersion: '^0.1.0',
    requires: [],
    ...overrides,
  };
}

describe('capacidades por target', () => {
  it('escritorio ofrece todo lo que ofrece web, y más', () => {
    const web = getCapabilitiesForTarget('web');
    const desktop = getCapabilitiesForTarget('desktop');

    // La relación tiene que ser de superconjunto: si web puede algo y
    // escritorio no, hay un error de configuración.
    for (const capability of web) {
      expect(desktop).toContain(capability);
    }
    expect(desktop.length).toBeGreaterThan(web.length);
  });

  it('web NO ofrece las capacidades nativas', () => {
    const web = getCapabilitiesForTarget('web');

    expect(web).not.toContain(CAPABILITY.PRINTING_RAW);
    expect(web).not.toContain(CAPABILITY.HTTP_EXTERNAL);
    expect(web).not.toContain(CAPABILITY.FILESYSTEM);
  });

  it('imprimir SÍ está en los dos', () => {
    // El flujo normal de impresión existe en ambos: visor del navegador o
    // visor del sistema. Lo que no existe en web es el puerto crudo.
    expect(getCapabilitiesForTarget('web')).toContain(CAPABILITY.PRINTING);
    expect(getCapabilitiesForTarget('desktop')).toContain(CAPABILITY.PRINTING);
  });
});

describe('compatibilidad deducida desde requires', () => {
  it('un plugin de UI corre en los dos targets', () => {
    const m = manifest({
      requires: [CAPABILITY.VIEWS, CAPABILITY.NAVIGATION, CAPABILITY.STORAGE],
    });

    expect(checkPluginCompatibility(m, 'web').compatible).toBe(true);
    expect(checkPluginCompatibility(m, 'desktop').compatible).toBe(true);
  });

  it('un plugin que pide impresora cruda queda fuera de web', () => {
    // El caso de facturación: ticket por impresora térmica, cajón de dinero.
    const m = manifest({
      requires: [CAPABILITY.VIEWS, CAPABILITY.PRINTING_RAW],
    });

    const web = checkPluginCompatibility(m, 'web');
    expect(web.compatible).toBe(false);
    expect(web.missing).toEqual([CAPABILITY.PRINTING_RAW]);
    expect(web.reason).toMatch(/versión web/);

    expect(checkPluginCompatibility(m, 'desktop').compatible).toBe(true);
  });

  it('un plugin que llama a APIs de terceros queda fuera de web', () => {
    // En web lo frena CORS: el servicio ajeno tendría que autorizar el origen.
    const m = manifest({ requires: [CAPABILITY.HTTP_EXTERNAL] });

    expect(checkPluginCompatibility(m, 'web').compatible).toBe(false);
    expect(checkPluginCompatibility(m, 'desktop').compatible).toBe(true);
  });

  it('reporta TODAS las capacidades faltantes, no solo la primera', () => {
    const m = manifest({
      requires: [CAPABILITY.PRINTING_RAW, CAPABILITY.FILESYSTEM],
    });

    // Que el mensaje las liste todas evita el ida y vuelta de arreglar una,
    // reinstalar, y descubrir que falta otra.
    expect(checkPluginCompatibility(m, 'web').missing).toEqual([
      CAPABILITY.PRINTING_RAW,
      CAPABILITY.FILESYSTEM,
    ]);
  });
});

describe('capacidades opcionales', () => {
  it('una opcional ausente NO impide la activación', () => {
    const m = manifest({
      requires: [CAPABILITY.VIEWS],
      optional: [CAPABILITY.PRINTING_RAW],
    });

    const web = checkPluginCompatibility(m, 'web');

    expect(web.compatible).toBe(true);
    expect(web.degraded).toEqual([CAPABILITY.PRINTING_RAW]);
  });

  it('sin opcionales ausentes, degraded viene vacío', () => {
    const m = manifest({
      requires: [CAPABILITY.VIEWS],
      optional: [CAPABILITY.PRINTING],
    });

    expect(checkPluginCompatibility(m, 'web').degraded).toEqual([]);
  });
});

describe('targets explícitos en el manifiesto', () => {
  it('un plugin marcado solo-escritorio queda fuera de web aunque las capacidades alcancen', () => {
    // Restricción de producto, no técnica: el plugin funcionaría, pero no se
    // ofrece en web.
    const m = manifest({ requires: [CAPABILITY.VIEWS], targets: ['desktop'] });

    const web = checkPluginCompatibility(m, 'web');

    expect(web.compatible).toBe(false);
    expect(web.missing).toEqual([]); // no falta nada técnico
    expect(web.reason).toMatch(/solo para: desktop/);
  });

  it('`targets` gana sobre la deducción por capacidades', () => {
    const m = manifest({ requires: [], targets: ['web'] });

    expect(checkPluginCompatibility(m, 'desktop').compatible).toBe(false);
    expect(checkPluginCompatibility(m, 'web').compatible).toBe(true);
  });

  it('sin `targets`, se deduce de las capacidades', () => {
    // Es el caso normal: el autor no declara nada y el kernel decide solo.
    const m = manifest({ requires: [CAPABILITY.VIEWS] });

    expect(m.targets).toBeUndefined();
    expect(checkPluginCompatibility(m, 'web').compatible).toBe(true);
    expect(checkPluginCompatibility(m, 'desktop').compatible).toBe(true);
  });
});
