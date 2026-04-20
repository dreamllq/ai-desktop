import type Database from 'better-sqlite3'
import { BaseRepository } from './base'

export interface ToolDefinitionCreateParams {
  name: string
  description?: string
  inputSchema: Record<string, unknown>
  sourceMcpServerId?: string
}

interface ToolDefinitionRow {
  id: string
  name: string
  description: string | null
  inputSchema: Record<string, unknown>
  sourceMcpServerId: string | null
}

export class ToolDefinitionRepository extends BaseRepository {
  constructor(db: Database.Database) {
    super(db)
  }

  private rowToToolDefinition(row: Record<string, unknown>): ToolDefinitionRow {
    return {
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string) || null,
      inputSchema: JSON.parse(row.input_schema as string),
      sourceMcpServerId: (row.source_mcp_server_id as string) || null,
    }
  }

  list(): ToolDefinitionRow[] {
    const rows = this.db.prepare('SELECT * FROM tool_definitions ORDER BY name').all() as Record<
      string,
      unknown
    >[]
    return rows.map((row) => this.rowToToolDefinition(row))
  }

  getByServer(serverId: string): ToolDefinitionRow[] {
    const rows = this.db
      .prepare('SELECT * FROM tool_definitions WHERE source_mcp_server_id = ? ORDER BY name')
      .all(serverId) as Record<string, unknown>[]
    return rows.map((row) => this.rowToToolDefinition(row))
  }

  get(id: string): ToolDefinitionRow | null {
    const row = this.db.prepare('SELECT * FROM tool_definitions WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined
    if (!row) return null
    return this.rowToToolDefinition(row)
  }

  create(params: ToolDefinitionCreateParams): string {
    const id = this.generateId()
    this.db
      .prepare(
        `INSERT INTO tool_definitions (id, name, description, input_schema, source_mcp_server_id)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        params.name,
        params.description || null,
        JSON.stringify(params.inputSchema),
        params.sourceMcpServerId || null,
      )
    return id
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM tool_definitions WHERE id = ?').run(id)
    return result.changes > 0
  }

  deleteByServer(serverId: string): number {
    const result = this.db
      .prepare('DELETE FROM tool_definitions WHERE source_mcp_server_id = ?')
      .run(serverId)
    return result.changes
  }
}
