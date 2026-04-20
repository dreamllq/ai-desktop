import type Database from 'better-sqlite3'
import type { McpServerConfig, McpTransportType } from '@shared/types'
import { BaseRepository } from './base'

export interface McpServerCreateParams {
  name: string
  transportType: McpTransportType
  config: { command: string; args: string[] } | { url: string }
  enabled?: boolean
}

export interface McpServerUpdateParams {
  name?: string
  config?: { command: string; args: string[] } | { url: string }
  enabled?: boolean
}

export class McpServerRepository extends BaseRepository {
  constructor(db: Database.Database) {
    super(db)
  }

  private rowToMcpServerConfig(row: Record<string, unknown>): McpServerConfig {
    return {
      id: row.id as string,
      name: row.name as string,
      transportType: row.transport_type as McpTransportType,
      config: JSON.parse(row.config as string),
      enabled: Boolean(row.enabled),
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    }
  }

  list(): McpServerConfig[] {
    const rows = this.db
      .prepare('SELECT * FROM mcp_servers ORDER BY created_at DESC')
      .all() as Record<string, unknown>[]
    return rows.map((row) => this.rowToMcpServerConfig(row))
  }

  get(id: string): McpServerConfig | null {
    const row = this.db.prepare('SELECT * FROM mcp_servers WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined
    if (!row) return null
    return this.rowToMcpServerConfig(row)
  }

  create(params: McpServerCreateParams): string {
    const id = this.generateId()
    const now = Date.now()
    this.db
      .prepare(
        `INSERT INTO mcp_servers (id, name, transport_type, config, enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        params.name,
        params.transportType,
        JSON.stringify(params.config),
        params.enabled !== false ? 1 : 0,
        now,
        now,
      )
    return id
  }

  update(id: string, params: McpServerUpdateParams): boolean {
    const setClauses: string[] = []
    const values: unknown[] = []

    if (params.name !== undefined) {
      setClauses.push('name = ?')
      values.push(params.name)
    }
    if (params.config !== undefined) {
      setClauses.push('config = ?')
      values.push(JSON.stringify(params.config))
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
      .prepare(`UPDATE mcp_servers SET ${setClauses.join(', ')} WHERE id = ?`)
      .run(...values)
    return result.changes > 0
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM mcp_servers WHERE id = ?').run(id)
    return result.changes > 0
  }
}
