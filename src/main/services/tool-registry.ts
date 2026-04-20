import type { McpManager } from './mcp-manager'
import type { ToolDefinition, ToolResult } from '../../shared/types/agent'

export class ToolRegistry {
  private mcpManager: McpManager | null = null
  private cachedTools: ToolDefinition[] | null = null

  initialize(mcpManager: McpManager): void {
    this.mcpManager = mcpManager
    this.cachedTools = null
  }

  async getAllTools(): Promise<ToolDefinition[]> {
    if (this.cachedTools) return this.cachedTools

    const tools = await this.fetchToolsFromManager()
    this.cachedTools = tools
    return tools
  }

  async getTool(name: string): Promise<ToolDefinition | undefined> {
    const tools = await this.getAllTools()
    return tools.find((t) => t.name === name)
  }

  async executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    if (!this.mcpManager) {
      return {
        output: 'ToolRegistry not initialized: no MCP Manager reference',
        isError: true,
        source: 'tool-registry',
      }
    }

    const resolvedName = this.resolveToolName(name)
    return this.mcpManager.executeTool(resolvedName, args)
  }

  async getToolsByServer(serverId: string): Promise<ToolDefinition[]> {
    const tools = await this.getAllTools()
    return tools.filter((t) => t.source === serverId)
  }

  async refresh(): Promise<void> {
    this.cachedTools = null
    if (this.mcpManager) {
      await this.mcpManager.refreshTools()
    }
    await this.getAllTools()
  }

  async validateToolAccess(
    requiredTools: string[],
  ): Promise<{ available: string[]; missing: string[] }> {
    const tools = await this.getAllTools()
    const toolNames = new Set(tools.map((t) => t.name))

    const available: string[] = []
    const missing: string[] = []

    for (const name of requiredTools) {
      if (toolNames.has(name)) {
        available.push(name)
      } else {
        missing.push(name)
      }
    }

    return { available, missing }
  }

  private async fetchToolsFromManager(): Promise<ToolDefinition[]> {
    if (!this.mcpManager) return []

    const rawTools = await this.mcpManager.listAvailableTools()
    return this.applyNamespacing(rawTools)
  }

  private applyNamespacing(tools: ToolDefinition[]): ToolDefinition[] {
    const nameCount = new Map<string, number>()
    for (const tool of tools) {
      const count = nameCount.get(tool.name) ?? 0
      nameCount.set(tool.name, count + 1)
    }

    return tools.map((tool) => {
      if ((nameCount.get(tool.name) ?? 0) > 1) {
        return {
          ...tool,
          name: `${tool.source}__${tool.name}`,
        }
      }
      return tool
    })
  }

  private resolveToolName(name: string): string {
    if (!this.cachedTools) return name

    const separatorIndex = name.indexOf('__')
    if (separatorIndex === -1) return name

    const originalName = name.slice(separatorIndex + 2)
    const hasCollision = this.cachedTools.some((t) => t.name === name && t.name !== originalName)
    return hasCollision ? originalName : name
  }
}

// Singleton
let instance: ToolRegistry | null = null

export function getToolRegistry(): ToolRegistry {
  if (!instance) {
    instance = new ToolRegistry()
  }
  return instance
}
