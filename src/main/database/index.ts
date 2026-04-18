import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

export class DatabaseService {
  private db: Database.Database
  private static instance: DatabaseService | null = null

  private constructor(dbPath: string) {
    this.db = new Database(dbPath)
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      const dbPath = join(app.getPath('userData'), 'app.db')
      DatabaseService.instance = new DatabaseService(dbPath)
    }
    return DatabaseService.instance
  }

  initialize(): void {
    // Enable WAL mode for better concurrent performance
    this.db.pragma('journal_mode = WAL')

    const version = (this.db.pragma('user_version') as { user_version: number }[])[0].user_version

    if (version === 0) {
      this.db.exec(
        'CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
      )
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS llm_providers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          enabled INTEGER DEFAULT 1,
          base_url TEXT,
          api_path TEXT DEFAULT '/v1/chat/completions',
          encrypted_key TEXT,
          models TEXT DEFAULT '[]',
          default_model TEXT,
          default_params TEXT DEFAULT '{}',
          proxy TEXT,
          timeout INTEGER DEFAULT 30000,
          custom_headers TEXT DEFAULT '[]',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `)
      this.db.pragma('user_version = 1')
    }
  }

  getSetting(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as
      | { value: string }
      | undefined
    return row ? row.value : null
  }

  setSetting(key: string, value: string): void {
    this.db
      .prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)')
      .run(key, value)
  }

  close(): void {
    this.db.close()
  }
}
