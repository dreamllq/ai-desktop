import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types/index'
import type {
  IpcResult,
  McpServerConfig,
  McpServerAddParams,
  McpServerUpdateParams,
  McpToolDefinition,
  McpToolResult,
} from '../../shared/types/index'
import type { McpServerRepository } from '../repositories/mcp-server'
import type { McpManager } from '../services/mcp-manager'

export interface McpServices {
  repository: McpServerRepository
  manager: McpManager
}

export function registerMcpHandlers(getServices: () => McpServices): void {
  ipcMain.handle(IPC_CHANNELS.MCP_LIST_SERVERS, (): IpcResult<McpServerConfig[]> => {
    try {
      const servers = getServices().repository.list()
      return { success: true, data: servers }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(
    IPC_CHANNELS.MCP_GET_SERVER,
    (_event, id: string): IpcResult<McpServerConfig | null> => {
      try {
        if (!id) return { success: false, error: 'Server ID is required' }
        const server = getServices().repository.get(id)
        return { success: true, data: server }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.MCP_ADD_SERVER,
    (_event, params: McpServerAddParams): IpcResult<string> => {
      try {
        if (!params.name?.trim()) return { success: false, error: 'Server name is required' }
        const id = getServices().repository.create(params)
        return { success: true, data: id }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.MCP_UPDATE_SERVER,
    (_event, id: string, params: McpServerUpdateParams): IpcResult<boolean> => {
      try {
        if (!id) return { success: false, error: 'Server ID is required' }
        const result = getServices().repository.update(id, params)
        return { success: true, data: result }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.MCP_DELETE_SERVER,
    async (_event, id: string): Promise<IpcResult<boolean>> => {
      try {
        if (!id) return { success: false, error: 'Server ID is required' }
        await getServices().manager.stopServer(id)
        const result = getServices().repository.delete(id)
        return { success: true, data: result }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.MCP_LIST_TOOLS,
    async (_event, serverId: string): Promise<IpcResult<McpToolDefinition[]>> => {
      try {
        if (!serverId) return { success: false, error: 'Server ID is required' }
        const allTools = await getServices().manager.listAvailableTools()
        const serverTools = allTools.filter((t) => t.source === serverId)
        return { success: true, data: serverTools }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.MCP_EXECUTE_TOOL,
    async (
      _event,
      _serverId: string,
      toolName: string,
      args: Record<string, unknown>,
    ): Promise<IpcResult<McpToolResult>> => {
      try {
        if (!toolName) return { success: false, error: 'Tool name is required' }
        const result = await getServices().manager.executeTool(toolName, args)
        return {
          success: true,
          data: { content: result.output, isError: result.isError },
        }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.MCP_GET_SERVER_STATUS,
    (_event, serverId: string): IpcResult<{ connected: boolean; error?: string }> => {
      try {
        if (!serverId) return { success: false, error: 'Server ID is required' }
        const status = getServices().manager.getServerStatus(serverId)
        return {
          success: true,
          data: {
            connected: status === 'connected',
            error: status === 'error' ? 'Connection error' : undefined,
          },
        }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.MCP_START_SERVER,
    async (_event, id: string): Promise<IpcResult<boolean>> => {
      try {
        if (!id) return { success: false, error: 'Server ID is required' }
        const server = getServices().repository.get(id)
        if (!server) return { success: false, error: 'Server not found' }
        const result = await getServices().manager.startServer(id, {
          transportType: server.transportType,
          stdio:
            server.transportType === 'stdio'
              ? {
                  command: (server.config as { command: string; args: string[] }).command,
                  args: (server.config as { command: string; args: string[] }).args,
                }
              : undefined,
          sse:
            server.transportType === 'sse'
              ? { url: (server.config as { url: string }).url }
              : undefined,
        })
        return { success: true, data: result }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.MCP_STOP_SERVER,
    async (_event, id: string): Promise<IpcResult<boolean>> => {
      try {
        if (!id) return { success: false, error: 'Server ID is required' }
        await getServices().manager.stopServer(id)
        return { success: true, data: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.MCP_TEST_CONNECTION,
    async (
      _event,
      params: McpServerAddParams,
    ): Promise<IpcResult<{ success: boolean; toolCount: number; error?: string }>> => {
      const { McpClientWrapper } = await import('../services/mcp-client')
      const client = new McpClientWrapper()
      try {
        const connectResult = await client.connect({
          transportType: params.transportType,
          stdio:
            params.transportType === 'stdio'
              ? {
                  command: (
                    params.config as {
                      command: string
                      args: string[]
                      env?: Record<string, string>
                    }
                  ).command,
                  args: (
                    params.config as {
                      command: string
                      args: string[]
                      env?: Record<string, string>
                    }
                  ).args,
                  env: (
                    params.config as {
                      command: string
                      args: string[]
                      env?: Record<string, string>
                    }
                  ).env,
                }
              : undefined,
          sse:
            params.transportType === 'sse'
              ? {
                  url: (params.config as { url: string; headers?: Record<string, string> }).url,
                }
              : undefined,
        })
        if (!connectResult.success) {
          return { success: false, data: { success: false, toolCount: 0, error: connectResult.error } }
        }
        const toolsResult = await client.listTools()
        let toolCount = 0
        if (toolsResult.success && toolsResult.data) {
          toolCount = toolsResult.data.length
        }
        return { success: true, data: { success: true, toolCount } }
      } catch (error) {
        return { success: false, error: String(error) }
      } finally {
        await client.disconnect()
      }
    },
  )
}
