import { beforeEach, describe, expect, it, vi } from 'vitest';

import { webKeyValueStore } from '../keyValueStore';

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('webKeyValueStore', () => {
  it('guarda y recupera valores conservando su tipo', async () => {
    const store = await webKeyValueStore.open('tema.json');

    await store.set('numero', 42);
    await store.set('objeto', { a: 1, b: [2, 3] });
    await store.set('booleano', false);

    expect(await store.get('numero')).toBe(42);
    expect(await store.get('objeto')).toEqual({ a: 1, b: [2, 3] });
    // `false` debe volver como false, no como null: es un valor, no una ausencia.
    expect(await store.get('booleano')).toBe(false);
  });

  it('devuelve null para claves que no existen', async () => {
    const store = await webKeyValueStore.open('vacio.json');
    expect(await store.get('nada')).toBeNull();
  });

  it('aísla stores distintos con el mismo nombre de clave', async () => {
    const a = await webKeyValueStore.open('store-a.json');
    const b = await webKeyValueStore.open('store-b.json');

    await a.set('clave', 'de A');
    await b.set('clave', 'de B');

    expect(await a.get('clave')).toBe('de A');
    expect(await b.get('clave')).toBe('de B');
  });

  it('devuelve la MISMA instancia al abrir dos veces el mismo store', async () => {
    const primera = await webKeyValueStore.open('mismo.json');
    const segunda = await webKeyValueStore.open('mismo.json');

    // Dos instancias sobre el mismo espacio de claves duplicarían estado.
    expect(primera).toBe(segunda);
  });

  it('delete informa si la clave existía', async () => {
    const store = await webKeyValueStore.open('borrado.json');
    await store.set('presente', 1);

    expect(await store.delete('presente')).toBe(true);
    expect(await store.delete('presente')).toBe(false);
    expect(await store.get('presente')).toBeNull();
  });

  it('clear borra solo las claves de su propio store', async () => {
    const a = await webKeyValueStore.open('clear-a.json');
    const b = await webKeyValueStore.open('clear-b.json');

    await a.set('x', 1);
    await b.set('y', 2);
    await a.clear();

    expect(await a.get('x')).toBeNull();
    expect(await b.get('y')).toBe(2);
  });

  it('entries lista las claves del store sin el prefijo interno', async () => {
    const store = await webKeyValueStore.open('entradas.json');
    await store.set('uno', 1);
    await store.set('dos', 2);

    const entries = await store.entries<number>();

    expect(Object.fromEntries(entries)).toEqual({ uno: 1, dos: 2 });
  });

  it('aplica defaults solo a claves ausentes, sin pisar lo guardado', async () => {
    const inicial = await webKeyValueStore.open('defaults.json', {
      defaults: { tema: 'light' },
    });
    await inicial.set('tema', 'dark');

    // Espeja el comportamiento del plugin de Tauri: los defaults nunca
    // sobrescriben lo que el usuario ya eligió.
    expect(await inicial.get('tema')).toBe('dark');
  });

  it('descarta un valor corrupto en vez de propagar el error de parseo', async () => {
    const store = await webKeyValueStore.open('corrupto.json');
    await store.set('bueno', 1);

    // Simula un valor escrito por una versión anterior o corrompido a mano.
    window.localStorage.setItem('tps:corrupto.json:roto', '{ no es json');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await store.get('roto')).toBeNull();
    expect(await store.get('bueno')).toBe(1);
  });

  it('save() no falla: en web la escritura ya fue inmediata', async () => {
    const store = await webKeyValueStore.open('save.json');
    await expect(store.save()).resolves.toBeUndefined();
  });
});
