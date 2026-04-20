import type Database from 'better-sqlite3'
import type { Message, ToolCall } from '@shared/types'
import { BaseRepository } from './base'

export interface CreateToolMessageParams {
  conversationId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: ToolCall[]
  toolCallId?: string
  model?: string
  tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number }
}

export class MessageRepository extends BaseRepository {
  constructor(db: Database.Database) {
    super(db)
  }

  private rowToMessage(row: Record<string, unknown>): Message {
    return {
      id: row.id as string,
      conversationId: row.conversation_id as string,
      role: row.role as 'user' | 'assistant' | 'system' | 'tool',
      content: row.content as string,
      toolCalls: row.tool_calls ? JSON.parse(row.tool_calls as string) : undefined,
      toolCallId: (row.tool_call_id as string) || undefined,
      model: (row.model as string) || undefined,
      tokenUsage: row.token_usage ? JSON.parse(row.token_usage as string) : undefined,
      createdAt: row.created_at as number,
    }
  }

  create(conversationId: string, role: string, content: string): Message {
    const id = this.generateId()
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
      role: role as 'user' | 'assistant' | 'system' | 'tool',
      content,
      createdAt: now,
    }
  }

  createToolMessage(params: CreateToolMessageParams): Message {
    const { conversationId, role, content, toolCalls, toolCallId, model, tokenUsage } = params
    const id = this.generateId()
    const now = Date.now()

    this.db
      .prepare(
        `INSERT INTO messages (id, conversation_id, role, content, tool_calls, tool_call_id, model, token_usage, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        conversationId,
        role,
        content,
        toolCalls ? JSON.stringify(toolCalls) : null,
        toolCallId ?? null,
        model ?? null,
        tokenUsage ? JSON.stringify(tokenUsage) : null,
        now,
      )

    this.db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversationId)

    return {
      id,
      conversationId,
      role,
      content,
      toolCalls,
      toolCallId,
      model,
      tokenUsage,
      createdAt: now,
    }
  }

  list(conversationId: string): Message[] {
    const rows = this.db
      .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(conversationId) as Record<string, unknown>[]
    return rows.map((row) => this.rowToMessage(row))
  }
}
