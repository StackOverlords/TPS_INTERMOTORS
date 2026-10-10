import { getAppUpdater, getKeyValueStore } from '@/platform';
import type { AppUpdaterPort } from '@/platform/ports/appUpdater';
import type { KeyValueStore } from '@/platform/ports/keyValueStore';
import { environment } from '@/utils/environment';
import { useCallback, useEffect, useState } from 'react';
import { fetchReleaseNotes, type PublishedRelease } from '../api/releaseNotes';

const STORE_NAME = 'app-updates';
const LAST_SEEN_KEY = 'lastSeenVersion';

export interface WhatsNew {
  version: string;
  /** Versión anterior que vio el usuario; `null` si no hay registro (primera vez con esta función). */
  previousVersion: string | null;
  notes: string;
  date: string | null;
}

interface WhatsNewDeps {
  updater: Pick<AppUpdaterPort, 'supportsSelfUpdate' | 'getCurrentVersion'>;
  store: Pick<KeyValueStore, 'get' | 'set'>;
  fetchNotes: (version: string) => Promise<PublishedRelease>;
}

/**
 * Notas a mostrar al abrir una versión por primera vez, o `null`.
 *
 * - Solo donde la app se autoactualiza (escritorio).
 * - Sin red o sin release publicado, devuelve `null` sin marcar la versión
 *   como vista: se reintenta en el próximo arranque.
 * - Si el release no tiene notas, la marca como vista y no muestra nada.
 */
export async function loadWhatsNew({ updater, store, fetchNotes }: WhatsNewDeps): Promise<WhatsNew | null> {
  if (!updater.supportsSelfUpdate()) return null;

  const version = await updater.getCurrentVersion();
  const previousVersion = await store.get<string>(LAST_SEEN_KEY);
  if (previousVersion === version) return null;

  let release: PublishedRelease;
  try {
    release = await fetchNotes(version);
  } catch {
    return null;
  }

  if (!release.notes) {
    await store.set(LAST_SEEN_KEY, version);
    return null;
  }

  return { version, previousVersion, notes: release.notes, date: release.date };
}

export function markWhatsNewSeen(store: Pick<KeyValueStore, 'set'>, version: string) {
  return store.set(LAST_SEEN_KEY, version);
}

const openStore = () => getKeyValueStore().open(STORE_NAME);

/** Novedades de la versión instalada, una sola vez por versión. */
export function useWhatsNew() {
  const [whatsNew, setWhatsNew] = useState<WhatsNew | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const store = await openStore();
      const result = await loadWhatsNew({
        updater: getAppUpdater(),
        store,
        fetchNotes: (version) => fetchReleaseNotes(version, environment.variant),
      });
      if (!cancelled) setWhatsNew(result);
    })().catch((error) => {
      console.error('No se pudieron cargar las novedades de la versión:', error);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = useCallback(() => {
    if (!whatsNew) return;
    setWhatsNew(null);
    openStore()
      .then((store) => markWhatsNewSeen(store, whatsNew.version))
      .catch((error) => console.error('No se pudo guardar la versión vista:', error));
  }, [whatsNew]);

  return { whatsNew, dismiss };
}
