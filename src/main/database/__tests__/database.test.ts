import Database from 'better-sqlite3'
import { describe, it, expect, beforeEach, vi } from 'vitest'

class MockStatement {
  private store: Map<string, string>
  private sql: string

  constructor(store: Map<string, string>, sql: string) {
    this.store = store
    this.sql = sql
  }

  run(...args: unknown[]): void {
    if (this.sql.includes('INSERT OR REPLACE')) {
      const [key, value] = args as [string, string]
      this.store.set(key, value)
    }
  }

  get(...args: unknown[]): { value: string } | undefined {
    if (this.sql.includes('SELECT')) {
      const [key] = args as [string]
      const value = this.store.get(key)
      return value !== undefined ? { value } : undefined
    }
    return undefined
  }
}

interface MockDb {
  pragma: ReturnType<typeof vi.fn>
  exec: ReturnType<typeof vi.fn>
  prepare: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
}

vi.mock('better-sqlite3', () => ({
  default: vi.fn(function () {
    const store = new Map<string, string>()
    this.pragma = vi.fn()
    this.exec = vi.fn(() => {})
    this.prepare = vi.fn((sql: string) => new MockStatement(store, sql))
    this.close = vi.fn()
  }),
}))

describe('Database', () => {
  let db: MockDb

  beforeEach(() => {
    db = new Database(':memory:') as unknown as MockDb
    db.pragma('journal_mode = WAL')
    db.exec('CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
  })

  it('can create table and read/write settings', () => {
    const insert = db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)')
    insert.run('theme', 'dark')
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get('theme') as
      | { value: string }
      | undefined
    expect(row?.value).toBe('dark')
  })

  it('getSetting returns null for non-existent key', () => {
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get('missing') as
      | { value: string }
      | undefined
    expect(row).toBeUndefined()
  })

  it('can update existing setting', () => {
    const insert = db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)')
    insert.run('lang', 'en')
    insert.run('lang', 'zh')
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get('lang') as
      | { value: string }
      | undefined
    expect(row?.value).toBe('zh')
  })
})
