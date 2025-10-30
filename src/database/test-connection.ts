import { getDB } from './db';
import { getAllKeybindings, saveKeybinding } from './schemas/keybindings.schema';
import { getPreference, savePreference } from './schemas/preferences.schema';

export const testDatabaseConnection = async () => {
  try {
    await getDB();
    await saveKeybinding('test_action', 'ctrl+shift+t', 'ctrl+shift+t');
    await getAllKeybindings();
    await savePreference('theme', 'dark');
    await savePreference('fontSize', 14);
    await savePreference('autoSave', true);
    // 5. Probar lectura de preferencias
    await getPreference('theme');
    await getPreference('fontSize');
    await getPreference('autoSave');
    // console.log('🎉 All database tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
};
