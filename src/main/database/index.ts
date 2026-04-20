import Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { app } from 'electron'
import { join } from 'path'
import { decryptApiKey, encryptApiKey, maskApiKey } from '../encryption'
import type {
  Conversation,
  LlmProvider,
  LlmProviderCreate,
  LlmProviderListItem,
  LlmProviderUpdate,
  Message,
} from '@shared/types'

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

    if (version <= 1) {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL DEFAULT '新的对话',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `)
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          conversation_id TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        )
      `)
      this.db.exec(
        'CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)',
      )
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)')
      this.db.pragma('user_version = 2')
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

  // ── Private helpers ──

  private normalizeBaseUrl(url: string | undefined): string {
    if (!url) return ''
    return url.replace(/\/+$/, '')
  }

  private rowToListItem(row: Record<string, unknown>): LlmProviderListItem {
    const decryptedKey = row.encrypted_key ? decryptApiKey(row.encrypted_key as string) : ''
    return {
      id: row.id as string,
      name: row.name as string,
      enabled: Boolean(row.enabled),
      baseUrl: row.base_url as string,
      apiPath: row.api_path as string,
      maskedApiKey: decryptedKey ? maskApiKey(decryptedKey) : '',
      models: JSON.parse((row.models as string) || '[]'),
      defaultModel: (row.default_model as string) || '',
      defaultParams: JSON.parse((row.default_params as string) || '{}'),
      proxy: (row.proxy as string) || '',
      timeout: (row.timeout as number) || 30000,
      customHeaders: JSON.parse((row.custom_headers as string) || '[]'),
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    }
  }

  private rowToProvider(row: Record<string, unknown>): LlmProvider {
    return {
      id: row.id as string,
      name: row.name as string,
      enabled: Boolean(row.enabled),
      baseUrl: row.base_url as string,
      apiPath: row.api_path as string,
      encryptedKey: row.encrypted_key ? decryptApiKey(row.encrypted_key as string) : '',
      models: JSON.parse((row.models as string) || '[]'),
      defaultModel: (row.default_model as string) || '',
      defaultParams: JSON.parse((row.default_params as string) || '{}'),
      proxy: (row.proxy as string) || '',
      timeout: (row.timeout as number) || 30000,
      customHeaders: JSON.parse((row.custom_headers as string) || '[]'),
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    }
  }

  private rowToConversation(row: Record<string, unknown>): Conversation {
    return {
      id: row.id as string,
      title: row.title as string,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    }
  }

  private rowToMessage(row: Record<string, unknown>): Message {
    return {
      id: row.id as string,
      conversationId: row.conversation_id as string,
      role: row.role as 'user' | 'assistant' | 'system',
      content: row.content as string,
      createdAt: row.created_at as number,
    }
  }

  // ── LLM Provider CRUD ──

  listProviders(): LlmProviderListItem[] {
    const rows = this.db
      .prepare(
        `SELECT id, name, enabled, base_url, api_path, encrypted_key, models, default_model,
                default_params, proxy, timeout, custom_headers, created_at, updated_at
         FROM llm_providers ORDER BY created_at DESC`,
      )
      .all() as Record<string, unknown>[]
    return rows.map((row) => this.rowToListItem(row))
  }

  getProviderById(id: string): LlmProvider | null {
    const row = this.db.prepare('SELECT * FROM llm_providers WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined
    if (!row) return null
    return this.rowToProvider(row)
  }

  getProviderPublic(id: string): LlmProviderListItem | null {
    const row = this.db
      .prepare(
        `SELECT id, name, enabled, base_url, api_path, encrypted_key, models, default_model,
                default_params, proxy, timeout, custom_headers, created_at, updated_at
         FROM llm_providers WHERE id = ?`,
      )
      .get(id) as Record<string, unknown> | undefined
    if (!row) return null
    return this.rowToListItem(row)
  }

  createProvider(provider: LlmProviderCreate): string {
    if (!provider.name || !provider.name.trim()) {
      throw new Error('Provider name is required')
    }
    if (provider.baseUrl) {
      try {
        new URL(provider.baseUrl)
      } catch {
        throw new Error('Invalid baseUrl format')
      }
    }

    const id = randomUUID()
    const now = Date.now()
    const baseUrl = this.normalizeBaseUrl(provider.baseUrl)

    this.db
      .prepare(
        `INSERT INTO llm_providers
         (id, name, enabled, base_url, api_path, encrypted_key, models, default_model,
          default_params, proxy, timeout, custom_headers, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        provider.name,
        provider.enabled !== false ? 1 : 0,
        baseUrl,
        provider.apiPath || '/v1/chat/completions',
        provider.apiKey ? encryptApiKey(provider.apiKey) : '',
        JSON.stringify(provider.models || []),
        provider.defaultModel || '',
        JSON.stringify(provider.defaultParams || {}),
        provider.proxy || '',
        provider.timeout || 30000,
        JSON.stringify(provider.customHeaders || []),
        now,
        now,
      )

    return id
  }

  updateProvider(id: string, updates: LlmProviderUpdate): boolean {
    if (updates.name !== undefined && (!updates.name || !updates.name.trim())) {
      throw new Error('Provider name cannot be empty')
    }

    const setClauses: string[] = []
    const values: unknown[] = []

    if (updates.name !== undefined) {
      setClauses.push('name = ?')
      values.push(updates.name)
    }
    if (updates.apiKey !== undefined) {
      setClauses.push('encrypted_key = ?')
      values.push(updates.apiKey ? encryptApiKey(updates.apiKey) : '')
    }
    if (updates.enabled !== undefined) {
      setClauses.push('enabled = ?')
      values.push(updates.enabled ? 1 : 0)
    }
    if (updates.baseUrl !== undefined) {
      setClauses.push('base_url = ?')
      values.push(this.normalizeBaseUrl(updates.baseUrl))
    }
    if (updates.apiPath !== undefined) {
      setClauses.push('api_path = ?')
      values.push(updates.apiPath)
    }
    if (updates.models !== undefined) {
      setClauses.push('models = ?')
      values.push(JSON.stringify(updates.models))
    }
    if (updates.defaultModel !== undefined) {
      setClauses.push('default_model = ?')
      values.push(updates.defaultModel)
    }
    if (updates.defaultParams !== undefined) {
      setClauses.push('default_params = ?')
      values.push(JSON.stringify(updates.defaultParams))
    }
    if (updates.proxy !== undefined) {
      setClauses.push('proxy = ?')
      values.push(updates.proxy)
    }
    if (updates.timeout !== undefined) {
      setClauses.push('timeout = ?')
      values.push(updates.timeout)
    }
    if (updates.customHeaders !== undefined) {
      setClauses.push('custom_headers = ?')
      values.push(JSON.stringify(updates.customHeaders))
    }

    if (setClauses.length === 0) return false

    setClauses.push('updated_at = ?')
    values.push(Date.now())

    values.push(id)

    const result = this.db
      .prepare(`UPDATE llm_providers SET ${setClauses.join(', ')} WHERE id = ?`)
      .run(...values)

    return result.changes > 0
  }

  deleteProvider(id: string): boolean {
    const result = this.db.prepare('DELETE FROM llm_providers WHERE id = ?').run(id)
    return result.changes > 0
  }

  // ── Conversation CRUD ──

  createConversation(title?: string): Conversation {
    const id = randomUUID()
    const now = Date.now()
    this.db
      .prepare('INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)')
      .run(id, title || '新的对话', now, now)
    return { id, title: title || '新的对话', createdAt: now, updatedAt: now }
  }

  getConversation(id: string): Conversation | null {
    const row = this.db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined
    if (!row) return null
    return this.rowToConversation(row)
  }

  listConversations(): Conversation[] {
    const rows = this.db
      .prepare('SELECT * FROM conversations ORDER BY updated_at DESC')
      .all() as Record<string, unknown>[]
    return rows.map((row) => this.rowToConversation(row))
  }

  updateConversation(id: string, title: string): boolean {
    const now = Date.now()
    const result = this.db
      .prepare('UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?')
      .run(title, now, id)
    return result.changes > 0
  }

  deleteConversation(id: string): boolean {
    const result = this.db.prepare('DELETE FROM conversations WHERE id = ?').run(id)
    return result.changes > 0
  }

  // ── Message CRUD ──

  createMessage(conversationId: string, role: string, content: string): Message {
    const id = randomUUID()
    const now = Date.now()
    this.db
      .prepare(
        'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(id, conversationId, role, content, now)
    this.db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversationId)
    return {
      id,
      conversationId,
      role: role as 'user' | 'assistant' | 'system',
      content,
      createdAt: now,
    }
  }

  listMessages(conversationId: string): Message[] {
    const rows = this.db
      .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(conversationId) as Record<string, unknown>[]
    return rows.map((row) => this.rowToMessage(row))
  }

  getActiveConversationId(): string | null {
    return this.getSetting('active_conversation_id')
  }

  setActiveConversationId(id: string | null): void {
    if (id) {
      this.setSetting('active_conversation_id', id)
    } else {
      this.db.prepare('DELETE FROM app_settings WHERE key = ?').run('active_conversation_id')
    }
  }

  close(): void {
    this.db.close()
  }
}
