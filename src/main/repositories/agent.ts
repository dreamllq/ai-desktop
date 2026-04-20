import type Database from 'better-sqlite3'
import type {
  AgentConfig,
  AgentManifest,
  AgentType,
  RemoteAgentConfig,
  LocalAgentConfig,
} from '@shared/types'
import { BaseRepository } from './base'

export interface AgentCreateParams {
  name: string
  description?: string
  type: AgentType
  config: RemoteAgentConfig | LocalAgentConfig
  manifest?: AgentManifest
  enabled?: boolean
}

export interface AgentUpdateParams {
  name?: string
  description?: string
  config?: RemoteAgentConfig | LocalAgentConfig
  manifest?: AgentManifest
  enabled?: boolean
}

export class AgentRepository extends BaseRepository {
  constructor(db: Database.Database) {
    super(db)
  }

  private rowToAgentConfig(row: Record<string, unknown>): AgentConfig {
    return {
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string) || '',
      type: row.type as AgentType,
      config: JSON.parse(row.config as string),
      manifest: row.manifest ? JSON.parse(row.manifest as string) : undefined,
      enabled: Boolean(row.enabled),
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    }
  }

  list(): AgentConfig[] {
    const rows = this.db.prepare('SELECT * FROM agents ORDER BY created_at DESC').all() as Record<
      string,
      unknown
    >[]
    return rows.map((row) => this.rowToAgentConfig(row))
  }

  get(id: string): AgentConfig | null {
    const row = this.db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined
    if (!row) return null
    return this.rowToAgentConfig(row)
  }

  create(params: AgentCreateParams): string {
    const id = this.generateId()
    const now = Date.now()
    this.db
      .prepare(
        `INSERT INTO agents (id, name, description, type, config, manifest, enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        params.name,
        params.description || '',
        params.type,
        JSON.stringify(params.config),
        params.manifest ? JSON.stringify(params.manifest) : null,
        params.enabled !== false ? 1 : 0,
        now,
        now,
      )
    return id
  }

  update(id: string, params: AgentUpdateParams): boolean {
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
    if (params.config !== undefined) {
      setClauses.push('config = ?')
      values.push(JSON.stringify(params.config))
    }
    if (params.manifest !== undefined) {
      setClauses.push('manifest = ?')
      values.push(JSON.stringify(params.manifest))
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
      .prepare(`UPDATE agents SET ${setClauses.join(', ')} WHERE id = ?`)
      .run(...values)
    return result.changes > 0
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM agents WHERE id = ?').run(id)
    return result.changes > 0
  }
}
