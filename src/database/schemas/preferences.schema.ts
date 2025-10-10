import { executeCommand, executeQuery } from '../db';

export interface PreferenceRow {
  key: string;
  value: string;
  type: 'string' | 'json' | 'number' | 'boolean';
  updated_at: number;
}

export const savePreference = async <T = any>(
  key: string,
  value: T
): Promise<void> => {
  let type: PreferenceRow['type'] = 'string';
  let serializedValue: string;

  if (typeof value === 'boolean') {
    type = 'boolean';
    serializedValue = value.toString();
  } else if (typeof value === 'number') {
    type = 'number';
    serializedValue = value.toString();
  } else if (typeof value === 'object') {
    type = 'json';
    serializedValue = JSON.stringify(value);
  } else {
    type = 'string';
    serializedValue = String(value);
  }

  await executeCommand(
    `INSERT OR REPLACE INTO user_preferences (key, value, type, updated_at)
     VALUES (?, ?, ?, strftime('%s', 'now'))`,
    [key, serializedValue, type]
  );
};

export const getPreference = async <T = any>(
  key: string,
  defaultValue?: T
): Promise<T | null> => {
  const results = await executeQuery<PreferenceRow>(
    'SELECT * FROM user_preferences WHERE key = ?',
    [key]
  );

  if (!results[0]) {
    return defaultValue !== undefined ? defaultValue : null;
  }

  const pref = results[0];

  switch (pref.type) {
    case 'boolean':
      return (pref.value === 'true') as T;
    case 'number':
      return Number(pref.value) as T;
    case 'json':
      return JSON.parse(pref.value) as T;
    default:
      return pref.value as T;
  }
};


export const getAllPreferences = async (): Promise<Record<string, any>> => {
  const results = await executeQuery<PreferenceRow>(
    'SELECT * FROM user_preferences'
  );

  const preferences: Record<string, any> = {};

  for (const pref of results) {
    switch (pref.type) {
      case 'boolean':
        preferences[pref.key] = pref.value === 'true';
        break;
      case 'number':
        preferences[pref.key] = Number(pref.value);
        break;
      case 'json':
        preferences[pref.key] = JSON.parse(pref.value);
        break;
      default:
        preferences[pref.key] = pref.value;
    }
  }

  return preferences;
};

export const deletePreference = async (key: string): Promise<void> => {
  await executeCommand('DELETE FROM user_preferences WHERE key = ?', [key]);
};

export const resetAllPreferences = async (): Promise<void> => {
  await executeCommand('DELETE FROM user_preferences');
};
