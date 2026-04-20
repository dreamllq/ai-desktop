import type Database from 'better-sqlite3'
import type { SkillConfig, SkillManifest, SkillSource } from '@shared/types'
import { BaseRepository } from './base'

export interface SkillCreateParams {
  name: string
  description?: string
  source: SkillSource
  filePath?: string
  manifest: SkillManifest
  content: string
  enabled?: boolean
}

export interface SkillUpdateParams {
  name?: string
  description?: string
  manifest?: SkillManifest
  content?: string
  enabled?: boolean
}

export class SkillRepository extends BaseRepository {
  constructor(db: Database.Database) {
    super(db)
  }

  private rowToSkillConfig(row: Record<string, unknown>): SkillConfig {
    return {
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string) || '',
      source: row.source as SkillSource,
      filePath: (row.file_path as string) || null,
      manifest: JSON.parse(row.manifest as string),
      content: row.content as string,
      enabled: Boolean(row.enabled),
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    }
  }

  list(): SkillConfig[] {
    const rows = this.db.prepare('SELECT * FROM skills ORDER BY created_at DESC').all() as Record<
      string,
      unknown
    >[]
    return rows.map((row) => this.rowToSkillConfig(row))
  }

  get(id: string): SkillConfig | null {
    const row = this.db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined
    if (!row) return null
    return this.rowToSkillConfig(row)
  }

  getBySource(source: SkillSource): SkillConfig[] {
    const rows = this.db
      .prepare('SELECT * FROM skills WHERE source = ? ORDER BY created_at DESC')
      .all(source) as Record<string, unknown>[]
    return rows.map((row) => this.rowToSkillConfig(row))
  }

  create(params: SkillCreateParams): string {
    const id = this.generateId()
    const now = Date.now()
    this.db
      .prepare(
        `INSERT INTO skills (id, name, description, source, file_path, manifest, content, enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        params.name,
        params.description || '',
        params.source,
        params.filePath || null,
        JSON.stringify(params.manifest),
        params.content,
        params.enabled !== false ? 1 : 0,
        now,
        now,
      )
    return id
  }

  update(id: string, params: SkillUpdateParams): boolean {
    const setClauses: string[] = []
    const values: unknown[] = []

    if (params.name !== undefined) {
      setClauses.push('name = ?')
      values.push(params.name)
    }
    if (params.description !== undefined) {
      setClauses.push('description = ?')
      values.push(params.description)
    }
    if (params.manifest !== undefined) {
      setClauses.push('manifest = ?')
      values.push(JSON.stringify(params.manifest))
    }
    if (params.content !== undefined) {
      setClauses.push('content = ?')
      values.push(params.content)
    }
    if (params.enabled !== undefined) {
      setClauses.push('enabled = ?')
      values.push(params.enabled ? 1 : 0)
    }

    if (setClauses.length === 0) return false

    setClauses.push('updated_at = ?')
    values.push(Date.now())
    values.push(id)

    const result = this.db
      .prepare(`UPDATE skills SET ${setClauses.join(', ')} WHERE id = ?`)
      .run(...values)
    return result.changes > 0
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM skills WHERE id = ?').run(id)
    return result.changes > 0
  }
}
