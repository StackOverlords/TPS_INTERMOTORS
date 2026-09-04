/**
 * Adaptador web del puerto `PreferencesRepositoryPort`.
 *
 * Un único documento en el puerto de clave/valor, indexado por `key`. Igual que
 * en atajos, el volumen es chico y reescribir el documento completo es más
 * simple que mantener una clave por preferencia.
 */

import { getKeyValueStore } from '@/platform';
import type { KeyValueStore } from '@/platform/ports/keyValueStore';
import type {
  PreferenceRecord,
  PreferencesRepositoryPort,
  PreferenceType,
} from '@/platform/ports/preferencesRepository';

const STORE_NAME = 'preferences.json';
const RECORDS_KEY = 'preferences';

type RecordMap = Record<string, PreferenceRecord>;

let storePromise: Promise<KeyValueStore> | null = null;

function getStore(): Promise<KeyValueStore> {
  storePromise ??= getKeyValueStore().open(STORE_NAME, {
    autoSave: true,
    defaults: {},
  });
  return storePromise;
}

async function readAll(): Promise<RecordMap> {
  const store = await getStore();
  return (await store.get<RecordMap>(RECORDS_KEY)) ?? {};
}

async function writeAll(records: RecordMap): Promise<void> {
  const store = await getStore();
  await store.set(RECORDS_KEY, records);
  await store.save();
}

export const webPreferencesRepository: PreferencesRepositoryPort = {
  async get(key: string) {
    const records = await readAll();
    return records[key] ?? null;
  },

  async getAll() {
    return Object.values(await readAll());
  },

  async set(key: string, value: string, type: PreferenceType) {
    const records = await readAll();
    records[key] = {
      key,
      value,
      type,
      updated_at: Math.floor(Date.now() / 1000),
    };
    await writeAll(records);
  },

  async remove(key: string) {
    const records = await readAll();
    if (!(key in records)) return;

    delete records[key];
    await writeAll(records);
  },

  async clear() {
    await writeAll({});
  },
};
