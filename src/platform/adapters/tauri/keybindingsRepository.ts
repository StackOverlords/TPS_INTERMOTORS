/**
 * Adaptador Tauri del puerto `KeybindingsRepositoryPort`.
 *
 * Respalda las mismas sentencias SQL que ya usaba la app sobre la tabla
 * `keybindings` de `sqlite:app.db`. No hay migración de datos: los usuarios que
 * ya tienen atajos guardados los siguen leyendo del mismo lugar.
 */

import { executeCommand, executeQuery } from '@/database/db';
import type {
  KeybindingRecord,
  KeybindingsRepositoryPort,
} from '@/platform/ports/keybindingsRepository';

export const tauriKeybindingsRepository: KeybindingsRepositoryPort = {
  async getEnabled() {
    return executeQuery<KeybindingRecord>(
      'SELECT * FROM keybindings WHERE enabled = 1 ORDER BY id',
    );
  },

  async getAll() {
    return executeQuery<KeybindingRecord>(
      'SELECT * FROM keybindings ORDER BY id',
    );
  },

  async getById(id: string) {
    const rows = await executeQuery<KeybindingRecord>(
      'SELECT * FROM keybindings WHERE id = ?',
      [id],
    );
    return rows[0] ?? null;
  },

  async upsert(id: string, keys: string, defaultKeys: string) {
    await executeCommand(
      `INSERT OR REPLACE INTO keybindings (id, keys, default_keys, source, updated_at)
       VALUES (?, ?, ?, 'user', strftime('%s', 'now'))`,
      [id, keys, defaultKeys],
    );
  },

  async setEnabled(id: string, enabled: boolean) {
    await executeCommand(
      "UPDATE keybindings SET enabled = ?, updated_at = strftime('%s', 'now') WHERE id = ?",
      [enabled ? 1 : 0, id],
    );
  },

  async remove(id: string) {
    await executeCommand('DELETE FROM keybindings WHERE id = ?', [id]);
  },

  async clear() {
    await executeCommand('DELETE FROM keybindings');
  },
};
