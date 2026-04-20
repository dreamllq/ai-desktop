import { McpClientWrapper } from './mcp-client'
import { fileSystemTools, executeFileSystemTool } from '../mcp-servers/filesystem'
import { commandTools, executeCommandTool } from '../mcp-servers/commands'
import type { ToolDefinition, ToolResult } from '../../shared/types/agent'

type ServerStatus = 'stopped' | 'starting' | 'connected' | 'error'

interface ManagedServer {
  id: string
  name: string
  client: McpClientWrapper | null
  status: ServerStatus
  tools: ToolDefinition[]
}

export class McpManager {
  private servers = new Map<string, ManagedServer>()
  private builtInTools: ToolDefinition[] = []
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    this.builtInTools = [...fileSystemTools, ...commandTools]

    this.initialized = true
  }

  async listAvailableTools(): Promise<ToolDefinition[]> {
    const externalTools: ToolDefinition[] = []
    for (const server of this.servers.values()) {
      if (server.status === 'connected' && server.tools.length > 0) {
        externalTools.push(...server.tools)
      }
    }
    return [...this.builtInTools, ...externalTools]
  }

  async executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const builtIn = this.builtInTools.find((t) => t.name === name)
    if (builtIn) {
      if (builtIn.source === 'filesystem') {
        return executeFileSystemTool(name, args)
      }
      if (builtIn.source === 'commands') {
        return executeCommandTool(name, args)
      }
    }

    for (const server of this.servers.values()) {
      if (server.status !== 'connected' || !server.client) continue
      const tool = server.tools.find((t) => t.name === name)
      if (tool) {
        const result = await server.client.callTool(name, args)
        if (result.success && result.data) return result.data
        return {
          output: result.error || 'Tool execution failed',
          isError: true,
          source: server.name,
        }
      }
    }

    return { output: `Tool not found: ${name}`, isError: true, source: 'mcp-manager' }
  }

  async startServer(
    id: string,
    config: {
      transportType: string
      stdio?: { command: string; args: string[] }
      sse?: { url: string }
    },
  ): Promise<boolean> {
    if (this.servers.has(id)) {
      const existing = this.servers.get(id)!
      if (existing.status === 'connected' || existing.status === 'starting') {
        return true
      }
    }

    const server: ManagedServer = {
      id,
      name: id,
      client: new McpClientWrapper(),
      status: 'starting',
      tools: [],
    }
    this.servers.set(id, server)

    try {
      const result = await server.client!.connect({
        transportType: config.transportType as 'stdio' | 'sse',
        stdio: config.stdio
          ? { command: config.stdio.command, args: config.stdio.args }
          : undefined,
        sse: config.sse,
      })

      if (!result.success) {
        server.status = 'error'
        server.client = null
        return false
      }

      server.status = 'connected'

      const toolsResult = await server.client!.listTools()
      if (toolsResult.success && toolsResult.data) {
        server.tools = toolsResult.data.map((t) => ({ ...t, source: id }))
      }

      return true
    } catch {
      server.status = 'error'
      server.client = null
      return false
    }
  }

  async stopServer(id: string): Promise<void> {
    const server = this.servers.get(id)
    if (server?.client) {
      await server.client.disconnect()
      server.client = null
      server.status = 'stopped'
    }
  }

  async stopAll(): Promise<void> {
    for (const [id] of this.servers) {
      await this.stopServer(id)
    }
  }

  getServerStatus(id: string): ServerStatus {
    return this.servers.get(id)?.status || 'stopped'
  }

  async refreshTools(): Promise<void> {
    for (const server of this.servers.values()) {
      if (server.client?.isConnected()) {
        const result = await server.client.listTools()
        if (result.success && result.data) {
          server.tools = result.data
        }
      }
    }
  }
}

// Singleton
let instance: McpManager | null = null

export function getMcpManager(): McpManager {
  if (!instance) {
    instance = new McpManager()
  }
  return instance
}
