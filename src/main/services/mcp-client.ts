import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { McpTransportType, ToolDefinition, ToolResult } from '../../shared/types/agent'

export interface McpClientConnectConfig {
  transportType: McpTransportType
  stdio?: { command: string; args?: string[]; env?: Record<string, string> }
  sse?: { url: string; headers?: Record<string, string> }
}

export interface McpClientResult<T> {
  success: boolean
  data?: T
  error?: string
}

const CONNECTION_TIMEOUT_MS = 10_000

export class McpClientWrapper {
  private client: Client | null = null
  private transport: Transport | null = null
  private connected = false

  async connect(config: McpClientConnectConfig): Promise<McpClientResult<void>> {
    try {
      if (this.connected) {
        return { success: false, error: 'Already connected' }
      }

      if (config.transportType === 'stdio' && config.stdio) {
        this.transport = new StdioClientTransport({
          command: config.stdio.command,
          args: config.stdio.args,
          env: config.stdio.env,
        })
      } else if (config.transportType === 'sse' && config.sse) {
        this.transport = new SSEClientTransport(new URL(config.sse.url), {
          requestInit: config.sse.headers ? { headers: config.sse.headers } : undefined,
        })
      } else {
        return { success: false, error: `Unsupported transport type: ${config.transportType}` }
      }

      this.client = new Client({ name: 'ai-desktop', version: '1.0.0' })

      await withTimeout(
        this.client.connect(this.transport),
        CONNECTION_TIMEOUT_MS,
        'MCP connection timed out',
      )

      this.connected = true
      return { success: true }
    } catch (err) {
      this.client = null
      this.transport = null
      this.connected = false
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  async disconnect(): Promise<McpClientResult<void>> {
    try {
      if (this.transport) {
        await this.transport.close()
      }
      this.client = null
      this.transport = null
      this.connected = false
      return { success: true }
    } catch (err) {
      this.client = null
      this.transport = null
      this.connected = false
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  async listTools(): Promise<McpClientResult<ToolDefinition[]>> {
    try {
      if (!this.client || !this.connected) {
        return { success: false, error: 'Not connected' }
      }

      const result = await this.client.listTools()
      const tools: ToolDefinition[] = (result.tools ?? []).map((tool) => ({
        name: tool.name,
        description: tool.description ?? '',
        inputSchema: (tool.inputSchema as Record<string, unknown>) ?? {},
        source: '', // Set by McpManager when aggregating tools from multiple servers
      }))

      return { success: true, data: tools }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<McpClientResult<ToolResult>> {
    try {
      if (!this.client || !this.connected) {
        return { success: false, error: 'Not connected' }
      }

      const result = await this.client.callTool({ name, arguments: args })
      const rawContent = ('content' in result ? result.content : undefined) as
        | Array<{ type: string; [key: string]: unknown }>
        | string
        | undefined

      const content = extractTextContent(rawContent)

      return {
        success: true,
        data: {
          output: content,
          isError: result.isError === true,
          source: name,
        },
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  isConnected(): boolean {
    return this.connected
  }
}

/**
 * Extract text from MCP content blocks, joining multiple text blocks with newlines.
 * Non-text content types are JSON-serialized as a fallback.
 */
function extractTextContent(
  content:
    | Array<
        | { type: 'text'; text: string }
        | { type: 'image'; data: string; mimeType: string }
        | { type: 'audio'; data: string; mimeType: string }
        | { type: 'resource'; resource: { uri: string; text?: string; blob?: string } }
        | { type: 'resource_link'; uri: string; name: string }
        | { type: string; [key: string]: unknown }
      >
    | string
    | undefined,
): string {
  if (typeof content === 'string') return content
  if (!content || !Array.isArray(content)) return ''

  return content
    .map((block) => {
      if ('type' in block && block.type === 'text' && 'text' in block) {
        return block.text as string
      }
      return JSON.stringify(block)
    })
    .join('\n')
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}
