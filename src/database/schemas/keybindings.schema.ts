import { executeCommand, executeQuery } from '../db';

export interface KeybindingRow {
  id: string;
  keys: string;
  default_keys: string;
  enabled: number; // SQLite usa INTEGER para boolean (0 o 1)
  source: 'user' | 'default';
  updated_at: number;
}

//Guarda o actualiza un keybinding personalizado
export const saveKeybinding = async (
  id: string,
  keys: string,
  defaultKeys: string = keys
): Promise<void> => {
  await executeCommand(
    `INSERT OR REPLACE INTO keybindings (id, keys, default_keys, source, updated_at)
     VALUES (?, ?, ?, 'user', strftime('%s', 'now'))`,
    [id, keys, defaultKeys]
  );
};


//Obtiene un keybinding por ID
export const getKeybinding = async (
  id: string
): Promise<KeybindingRow | null> => {
  const results = await executeQuery<KeybindingRow>(
    'SELECT * FROM keybindings WHERE id = ?',
    [id]
  );
  return results[0] || null;
};


//Obtiene todos los keybindings personalizados
export const getAllKeybindings = async (): Promise<KeybindingRow[]> => {
  console.log('Fetching all keybindings from DB');
  const response = await executeQuery<KeybindingRow>(
    'SELECT * FROM keybindings WHERE enabled = 1 ORDER BY id'
  );
  console.log('Keybindings fetched:', response);
  return await executeQuery<KeybindingRow>(
    'SELECT * FROM keybindings WHERE enabled = 1 ORDER BY id'
  );
};

//Elimina un keybinding personalizado (vuelve al default)
export const deleteKeybinding = async (id: string): Promise<void> => {
  await executeCommand('DELETE FROM keybindings WHERE id = ?', [id]);
};


//Habilita o deshabilita un keybinding
export const toggleKeybinding = async (
  id: string,
  enabled: boolean
): Promise<void> => {
  await executeCommand(
    'UPDATE keybindings SET enabled = ?, updated_at = strftime(\'%s\', \'now\') WHERE id = ?',
    [enabled ? 1 : 0, id]
  );
};


//Elimina todos los keybindings personalizados
export const resetAllKeybindings = async (): Promise<void> => {
  await executeCommand('DELETE FROM keybindings');
};

//Exporta todos los keybindings a JSON
export const exportKeybindings = async (): Promise<string> => {
  const keybindings = await getAllKeybindings();
  return JSON.stringify(keybindings, null, 2);
};


//Importa keybindings desde JSON
export const importKeybindings = async (jsonData: string): Promise<void> => {
  const keybindings = JSON.parse(jsonData) as KeybindingRow[];

  for (const kb of keybindings) {
    await saveKeybinding(kb.id, kb.keys, kb.default_keys);
  }
};
