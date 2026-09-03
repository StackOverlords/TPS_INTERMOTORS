/**
 * Adaptador Tauri del puerto `PreferencesRepositoryPort`.
 *
 * Mismas sentencias que ya usaba la app sobre `user_preferences` en
 * `sqlite:app.db`. Sin migración de datos.
 */

import { executeCommand, executeQuery } from '@/database/db';
import type {
  PreferenceRecord,
  PreferencesRepositoryPort,
  PreferenceType,
} from '@/platform/ports/preferencesRepository';

export const tauriPreferencesRepository: PreferencesRepositoryPort = {
  async get(key: string) {
    const rows = await executeQuery<PreferenceRecord>(
      'SELECT * FROM user_preferences WHERE key = ?',
      [key],
    );
    return rows[0] ?? null;
  },

  async getAll() {
    return executeQuery<PreferenceRecord>('SELECT * FROM user_preferences');
  },

  async set(key: string, value: string, type: PreferenceType) {
    await executeCommand(
      `INSERT OR REPLACE INTO user_preferences (key, value, type, updated_at)
       VALUES (?, ?, ?, strftime('%s', 'now'))`,
      [key, value, type],
    );
  },

  async remove(key: string) {
    await executeCommand('DELETE FROM user_preferences WHERE key = ?', [key]);
  },

  async clear() {
    await executeCommand('DELETE FROM user_preferences');
  },
};
