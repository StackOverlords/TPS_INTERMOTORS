import { getDB } from './db';
import { saveKeybinding, getAllKeybindings } from './schemas/keybindings.schema';
import { savePreference, getPreference } from './schemas/preferences.schema';

/**
 * Prueba la conexión a la base de datos y operaciones básicas
 */
export const testDatabaseConnection = async () => {
  console.log('🔍 Testing SQLite connection...');

  try {
    // 1. Probar conexión
    const db = await getDB();
    console.log('✅ Database connection successful');

    // 2. Probar inserción de keybinding
    await saveKeybinding('test_action', 'ctrl+shift+t', 'ctrl+shift+t');
    console.log('✅ Keybinding saved successfully');

    // 3. Probar lectura de keybindings
    const keybindings = await getAllKeybindings();
    console.log('✅ Keybindings retrieved:', keybindings.length);

    // 4. Probar preferencias
    await savePreference('theme', 'dark');
    await savePreference('fontSize', 14);
    await savePreference('autoSave', true);
    console.log('✅ Preferences saved successfully');

    // 5. Probar lectura de preferencias
    const theme = await getPreference('theme');
    const fontSize = await getPreference('fontSize');
    const autoSave = await getPreference('autoSave');
    console.log('✅ Preferences retrieved:', { theme, fontSize, autoSave });

    console.log('🎉 All database tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
};
