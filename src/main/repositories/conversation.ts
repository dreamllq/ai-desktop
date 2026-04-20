import type Database from 'better-sqlite3'
import type { Conversation } from '@shared/types'
import { BaseRepository } from './base'

export class ConversationRepository extends BaseRepository {
  constructor(db: Database.Database) {
    super(db)
  }

  private rowToConversation(row: Record<string, unknown>): Conversation {
    return {
      id: row.id as string,
      title: row.title as string,
      agentId: (row.agent_id as string) || undefined,
      modelId: (row.model_id as string) || undefined,
      skillIds: row.skill_ids ? JSON.parse(row.skill_ids as string) : undefined,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    }
  }

  create(title?: string): Conversation {
    const id = this.generateId()
    const now = Date.now()
    this.db
      .prepare('INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)')
      .run(id, title || '新的对话', now, now)
    return { id, title: title || '新的对话', createdAt: now, updatedAt: now }
  }

  get(id: string): Conversation | null {
    const row = this.db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined
    if (!row) return null
    return this.rowToConversation(row)
  }

  list(): Conversation[] {
    const rows = this.db
      .prepare('SELECT * FROM conversations ORDER BY updated_at DESC')
      .all() as Record<string, unknown>[]
    return rows.map((row) => this.rowToConversation(row))
  }

  update(id: string, title: string): boolean {
    const now = Date.now()
    const result = this.db
      .prepare('UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?')
      .run(title, now, id)
    return result.changes > 0
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM conversations WHERE id = ?').run(id)
    return result.changes > 0
  }

  bindAgent(id: string, agentId: string): boolean {
    const now = Date.now()
    const result = this.db
      .prepare('UPDATE conversations SET agent_id = ?, updated_at = ? WHERE id = ?')
      .run(agentId, now, id)
    return result.changes > 0
  }

  bindModel(id: string, modelId: string): boolean {
    const now = Date.now()
    const result = this.db
      .prepare('UPDATE conversations SET model_id = ?, updated_at = ? WHERE id = ?')
      .run(modelId, now, id)
    return result.changes > 0
  }

  bindSkills(id: string, skillIds: string[]): boolean {
    const now = Date.now()
    const result = this.db
      .prepare('UPDATE conversations SET skill_ids = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify(skillIds), now, id)
    return result.changes > 0
  }

  getConfig(id: string): { agentId?: string; modelId?: string; skillIds?: string[] } | null {
    const row = this.db
      .prepare('SELECT agent_id, model_id, skill_ids FROM conversations WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined
    if (!row) return null
    return {
      agentId: (row.agent_id as string) || undefined,
      modelId: (row.model_id as string) || undefined,
      skillIds: row.skill_ids ? JSON.parse(row.skill_ids as string) : undefined,
    }
  }
}
