import { beforeEach, describe, expect, it } from 'vitest';

import { webKeybindingsRepository } from '../keybindingsRepository';
import { webPreferencesRepository } from '../preferencesRepository';

beforeEach(async () => {
  window.localStorage.clear();
  await webKeybindingsRepository.clear();
  await webPreferencesRepository.clear();
});

describe('webKeybindingsRepository', () => {
  it('guarda un atajo y lo devuelve por id', async () => {
    await webKeybindingsRepository.upsert('tabs.next', 'ctrl+tab', 'ctrl+tab');

    const row = await webKeybindingsRepository.getById('tabs.next');

    expect(row).toMatchObject({
      id: 'tabs.next',
      keys: 'ctrl+tab',
      default_keys: 'ctrl+tab',
      source: 'user',
      // Espeja el DEFAULT de la tabla SQLite: nace habilitado.
      enabled: 1,
    });
  });

  it('upsert reemplaza las teclas sin duplicar la fila', async () => {
    await webKeybindingsRepository.upsert('tabs.next', 'ctrl+tab', 'ctrl+tab');
    await webKeybindingsRepository.upsert('tabs.next', 'alt+n', 'ctrl+tab');

    const todos = await webKeybindingsRepository.getAll();

    expect(todos).toHaveLength(1);
    expect(todos[0].keys).toBe('alt+n');
    // El default original no se pierde al personalizar.
    expect(todos[0].default_keys).toBe('ctrl+tab');
  });

  it('upsert preserva el estado enabled de un atajo ya existente', async () => {
    await webKeybindingsRepository.upsert('tabs.close', 'ctrl+w', 'ctrl+w');
    await webKeybindingsRepository.setEnabled('tabs.close', false);

    await webKeybindingsRepository.upsert('tabs.close', 'alt+w', 'ctrl+w');

    expect((await webKeybindingsRepository.getById('tabs.close'))?.enabled).toBe(
      0,
    );
  });

  it('getEnabled filtra los deshabilitados y ordena por id', async () => {
    await webKeybindingsRepository.upsert('zeta', 'z', 'z');
    await webKeybindingsRepository.upsert('alfa', 'a', 'a');
    await webKeybindingsRepository.upsert('beta', 'b', 'b');
    await webKeybindingsRepository.setEnabled('beta', false);

    const ids = (await webKeybindingsRepository.getEnabled()).map((k) => k.id);

    // Equivale a: SELECT * FROM keybindings WHERE enabled = 1 ORDER BY id
    expect(ids).toEqual(['alfa', 'zeta']);
  });

  it('getById devuelve null para un id desconocido', async () => {
    expect(await webKeybindingsRepository.getById('no.existe')).toBeNull();
  });

  it('remove borra solo el atajo indicado', async () => {
    await webKeybindingsRepository.upsert('uno', 'a', 'a');
    await webKeybindingsRepository.upsert('dos', 'b', 'b');

    await webKeybindingsRepository.remove('uno');

    expect((await webKeybindingsRepository.getAll()).map((k) => k.id)).toEqual([
      'dos',
    ]);
  });

  it('setEnabled sobre un id inexistente no crea la fila', async () => {
    await webKeybindingsRepository.setEnabled('fantasma', true);
    expect(await webKeybindingsRepository.getAll()).toEqual([]);
  });

  it('clear borra todas las personalizaciones', async () => {
    await webKeybindingsRepository.upsert('uno', 'a', 'a');
    await webKeybindingsRepository.upsert('dos', 'b', 'b');

    await webKeybindingsRepository.clear();

    expect(await webKeybindingsRepository.getAll()).toEqual([]);
  });

  it('los atajos sobreviven entre "sesiones" (persisten en localStorage)', async () => {
    await webKeybindingsRepository.upsert('persistente', 'ctrl+p', 'ctrl+p');

    // Lo guardado tiene que estar en localStorage, no solo en memoria.
    const crudo = window.localStorage.getItem('tps:keybindings.json:keybindings');

    expect(crudo).toBeTruthy();
    expect(JSON.parse(crudo!)).toHaveProperty('persistente');
  });
});

describe('webPreferencesRepository', () => {
  it('guarda el valor junto con su tipo para poder reconstruirlo', async () => {
    await webPreferencesRepository.set('mostrarCostos', 'true', 'boolean');

    expect(await webPreferencesRepository.get('mostrarCostos')).toMatchObject({
      key: 'mostrarCostos',
      value: 'true',
      type: 'boolean',
    });
  });

  it('set reemplaza el valor anterior de la misma clave', async () => {
    await webPreferencesRepository.set('sucursal', '1', 'number');
    await webPreferencesRepository.set('sucursal', '2', 'number');

    const todas = await webPreferencesRepository.getAll();

    expect(todas).toHaveLength(1);
    expect(todas[0].value).toBe('2');
  });

  it('get devuelve null para una clave desconocida', async () => {
    expect(await webPreferencesRepository.get('nada')).toBeNull();
  });

  it('remove borra solo la preferencia indicada', async () => {
    await webPreferencesRepository.set('a', '1', 'string');
    await webPreferencesRepository.set('b', '2', 'string');

    await webPreferencesRepository.remove('a');

    expect((await webPreferencesRepository.getAll()).map((p) => p.key)).toEqual([
      'b',
    ]);
  });

  it('registra updated_at en segundos, como la columna de SQLite', async () => {
    await webPreferencesRepository.set('x', '1', 'string');
    const pref = await webPreferencesRepository.get('x');

    const ahoraEnSegundos = Math.floor(Date.now() / 1000);
    expect(pref!.updated_at).toBeLessThanOrEqual(ahoraEnSegundos);
    expect(pref!.updated_at).toBeGreaterThan(ahoraEnSegundos - 10);
  });
});
