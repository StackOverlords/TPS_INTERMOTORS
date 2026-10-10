import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { PublishedRelease } from '../api/releaseNotes';
import { loadWhatsNew, markWhatsNewSeen } from '../hooks/useWhatsNew';

function memoryStore(initial: Record<string, unknown> = {}) {
  const data = new Map<string, unknown>(Object.entries(initial));
  const store = {
    data,
    async get<T>(key: string): Promise<T | null> {
      return data.has(key) ? (data.get(key) as T) : null;
    },
    async set<T>(key: string, value: T): Promise<void> {
      data.set(key, value);
    },
  };
  vi.spyOn(store, 'get');
  vi.spyOn(store, 'set');
  return store;
}

const desktop = (version: string) => ({
  supportsSelfUpdate: () => true,
  getCurrentVersion: async () => version,
});

const NOTES: PublishedRelease = { notes: '### Novedades\n\n- **Lista de compras.** …', date: '2026-10-10T19:20:11Z' };

describe('loadWhatsNew', () => {
  let fetchNotes: Mock<(version: string) => Promise<PublishedRelease>>;

  beforeEach(() => {
    fetchNotes = vi.fn(async () => NOTES);
  });

  it('muestra las notas la primera vez que se abre una versión nueva', async () => {
    const store = memoryStore({ lastSeenVersion: '1.12.0' });
    const result = await loadWhatsNew({ updater: desktop('1.13.0'), store, fetchNotes });

    expect(fetchNotes).toHaveBeenCalledWith('1.13.0');
    expect(result).toEqual({ version: '1.13.0', previousVersion: '1.12.0', ...NOTES });
    // Se marca como vista recién cuando el usuario cierra el diálogo.
    expect(store.set).not.toHaveBeenCalled();
  });

  it('también la primera vez con esta función, sin versión anterior registrada', async () => {
    const result = await loadWhatsNew({ updater: desktop('1.13.0'), store: memoryStore(), fetchNotes });
    expect(result?.previousVersion).toBeNull();
  });

  it('no vuelve a mostrarlas una vez vistas, ni consulta GitHub', async () => {
    const store = memoryStore();
    await markWhatsNewSeen(store, '1.13.0');

    expect(await loadWhatsNew({ updater: desktop('1.13.0'), store, fetchNotes })).toBeNull();
    expect(fetchNotes).not.toHaveBeenCalled();
  });

  it('sin red no marca la versión: reintenta en el próximo arranque', async () => {
    const store = memoryStore({ lastSeenVersion: '1.12.0' });
    fetchNotes.mockRejectedValueOnce(new Error('Network Error'));

    expect(await loadWhatsNew({ updater: desktop('1.13.0'), store, fetchNotes })).toBeNull();
    expect(store.set).not.toHaveBeenCalled();
    expect(await loadWhatsNew({ updater: desktop('1.13.0'), store, fetchNotes })).not.toBeNull();
  });

  it('si el release no tiene notas, lo marca como visto y no muestra nada', async () => {
    const store = memoryStore({ lastSeenVersion: '1.12.0' });
    fetchNotes.mockResolvedValueOnce({ notes: null, date: null });

    expect(await loadWhatsNew({ updater: desktop('1.13.0'), store, fetchNotes })).toBeNull();
    expect(store.data.get('lastSeenVersion')).toBe('1.13.0');
  });

  it('en web no hace nada', async () => {
    const store = memoryStore();
    const web = { supportsSelfUpdate: () => false, getCurrentVersion: async () => '1.13.0' };

    expect(await loadWhatsNew({ updater: web, store, fetchNotes })).toBeNull();
    expect(fetchNotes).not.toHaveBeenCalled();
    expect(store.get).not.toHaveBeenCalled();
  });
});
