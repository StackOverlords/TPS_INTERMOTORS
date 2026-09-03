import { getPreferencesRepository } from '@/platform';
import type { PreferenceRecord } from '@/platform/ports/preferencesRepository';

/**
  * Forma de una preferencia persistida. Vive en el puerto porque ya no es un
  * detalle del esquema SQLite: el target web guarda la misma estructura.
  */
export type PreferenceRow = PreferenceRecord;

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

  await getPreferencesRepository().set(key, serializedValue, type);
};

export const getPreference = async <T = any>(
  key: string,
  defaultValue?: T
): Promise<T | null> => {
  const pref = await getPreferencesRepository().get(key);

  if (!pref) {
    return defaultValue !== undefined ? defaultValue : null;
  }

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
  const results = await getPreferencesRepository().getAll();

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
  await getPreferencesRepository().remove(key);
};

export const resetAllPreferences = async (): Promise<void> => {
  await getPreferencesRepository().clear();
};
