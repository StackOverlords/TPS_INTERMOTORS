import { afterEach, describe, expect, it } from 'vitest';

import { getPlatformTarget, isTauri } from '../env';

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  delete (window as unknown as Record<string, unknown>).__TAURI__;
});

describe('detección del target', () => {
  it('sin globals de Tauri, el target es web', () => {
    expect(isTauri()).toBe(false);
    expect(getPlatformTarget()).toBe('web');
  });

  it('detecta Tauri por __TAURI_INTERNALS__', () => {
    // Es el global real del runtime v2, independiente de withGlobalTauri.
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};

    expect(isTauri()).toBe(true);
    expect(getPlatformTarget()).toBe('tauri');
  });

  it('detecta Tauri por __TAURI__ (withGlobalTauri: true)', () => {
    // Red de seguridad si el flag de tauri.conf.json cambiara.
    (window as unknown as Record<string, unknown>).__TAURI__ = {};

    expect(isTauri()).toBe(true);
  });
});
