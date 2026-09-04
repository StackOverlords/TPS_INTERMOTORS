/**
 * Adaptador web del puerto `KeybindingsRepositoryPort`.
 *
 * Se apoya en el puerto de clave/valor: un único documento con todos los
 * atajos, indexado por id. El volumen es de decenas de entradas, así que
 * reescribir el documento entero en cada mutación es más simple y más barato
 * que mantener una clave por atajo.
 */

import { getKeyValueStore } from '@/platform';
import type { KeyValueStore } from '@/platform/ports/keyValueStore';
import type {
  KeybindingRecord,
  KeybindingsRepositoryPort,
} from '@/platform/ports/keybindingsRepository';

const STORE_NAME = 'keybindings.json';
const RECORDS_KEY = 'keybindings';

type RecordMap = Record<string, KeybindingRecord>;

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

const byId = (a: KeybindingRecord, b: KeybindingRecord) =>
  a.id.localeCompare(b.id);

function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export const webKeybindingsRepository: KeybindingsRepositoryPort = {
  async getEnabled() {
    const records = await readAll();
    return Object.values(records)
      .filter((record) => record.enabled === 1)
      .sort(byId);
  },

  async getAll() {
    const records = await readAll();
    return Object.values(records).sort(byId);
  },

  async getById(id: string) {
    const records = await readAll();
    return records[id] ?? null;
  },

  async upsert(id: string, keys: string, defaultKeys: string) {
    const records = await readAll();
    records[id] = {
      id,
      keys,
      default_keys: defaultKeys,
      // Espeja el DEFAULT de la tabla SQLite: un atajo nuevo nace habilitado.
      enabled: records[id]?.enabled ?? 1,
      source: 'user',
      updated_at: nowInSeconds(),
    };
    await writeAll(records);
  },

  async setEnabled(id: string, enabled: boolean) {
    const records = await readAll();
    const existing = records[id];
    if (!existing) return;

    records[id] = {
      ...existing,
      enabled: enabled ? 1 : 0,
      updated_at: nowInSeconds(),
    };
    await writeAll(records);
  },

  async remove(id: string) {
    const records = await readAll();
    if (!(id in records)) return;

    delete records[id];
    await writeAll(records);
  },

  async clear() {
    await writeAll({});
  },
};
