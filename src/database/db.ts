import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;


export const getDB = async (): Promise<Database> => {
  if (!db) {
    db = await Database.load('sqlite:app.db');
    await initializeTables();
  }
  return db;
};

const initializeTables = async () => {
  if (!db) return;

  // Tabla de keybindings personalizados
  await db.execute(`
    CREATE TABLE IF NOT EXISTS keybindings (
      id TEXT PRIMARY KEY,
      keys TEXT NOT NULL,
      default_keys TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      source TEXT CHECK(source IN ('user', 'default')) DEFAULT 'user',
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Tabla de preferencias de usuario
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      type TEXT CHECK(type IN ('string', 'json', 'number', 'boolean')) DEFAULT 'string',
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Tabla de cola offline (para sincronización)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS offline_queue (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      retry_count INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('pending', 'processing', 'failed')) DEFAULT 'pending'
    )
  `);

  // Índices para mejor performance
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_keybindings_enabled
    ON keybindings(enabled) WHERE enabled = 1
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_offline_queue_status
    ON offline_queue(status, created_at)
  `);

  console.log('✅ Database initialized successfully');
};

export const closeDB = async () => {
  if (db) {
    await db.close();
    db = null;
  }
};

export const executeQuery = async <T = any>(
  query: string,
  params?: any[]
): Promise<T[]> => {
  const database = await getDB();
  return (await database.select<T>(query, params)) as T[];
};

/**
 * Ejecuta un comando SQL (INSERT, UPDATE, DELETE)
 */
export const executeCommand = async (
  query: string,
  params?: any[]
): Promise<void> => {
  const database = await getDB();
  await database.execute(query, params);
};

export default getDB;
