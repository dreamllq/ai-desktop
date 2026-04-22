import type {
  IpcResult,
  McpServerConfig,
  McpServerAddParams,
  McpServerUpdateParams,
  McpToolDefinition,
} from '@shared/types'

export function useMcp(): {
  listMcpServers: () => Promise<IpcResult<McpServerConfig[]>>
  getMcpServer: (id: string) => Promise<IpcResult<McpServerConfig | null>>
  addMcpServer: (params: McpServerAddParams) => Promise<IpcResult<string>>
  updateMcpServer: (id: string, params: McpServerUpdateParams) => Promise<IpcResult<boolean>>
  deleteMcpServer: (id: string) => Promise<IpcResult<boolean>>
  startMcpServer: (id: string) => Promise<IpcResult<boolean>>
  stopMcpServer: (id: string) => Promise<IpcResult<boolean>>
  testMcpConnection: (
    params: McpServerAddParams,
  ) => Promise<IpcResult<{ success: boolean; toolCount: number; error?: string }>>
  listMcpTools: (serverId: string) => Promise<IpcResult<McpToolDefinition[]>>
  getMcpServerStatus: (
    serverId: string,
  ) => Promise<IpcResult<{ connected: boolean; error?: string }>>
} {
  async function listMcpServers(): Promise<IpcResult<McpServerConfig[]>> {
    return window.api.listMcpServers()
  }

  async function getMcpServer(id: string): Promise<IpcResult<McpServerConfig | null>> {
    return window.api.getMcpServer(id)
  }

  async function addMcpServer(params: McpServerAddParams): Promise<IpcResult<string>> {
    return window.api.addMcpServer(params)
  }

  async function updateMcpServer(
    id: string,
    params: McpServerUpdateParams,
  ): Promise<IpcResult<boolean>> {
    return window.api.updateMcpServer(id, params)
  }

  async function deleteMcpServer(id: string): Promise<IpcResult<boolean>> {
    return window.api.deleteMcpServer(id)
  }

  async function startMcpServer(id: string): Promise<IpcResult<boolean>> {
    return window.api.startMcpServer(id)
  }

  async function stopMcpServer(id: string): Promise<IpcResult<boolean>> {
    return window.api.stopMcpServer(id)
  }

  async function testMcpConnection(
    params: McpServerAddParams,
  ): Promise<IpcResult<{ success: boolean; toolCount: number; error?: string }>> {
    return window.api.testMcpConnection(params)
  }

  async function listMcpTools(serverId: string): Promise<IpcResult<McpToolDefinition[]>> {
    return window.api.listMcpTools(serverId)
  }

  async function getMcpServerStatus(
    serverId: string,
  ): Promise<IpcResult<{ connected: boolean; error?: string }>> {
    return window.api.getMcpServerStatus(serverId)
  }

  return {
    listMcpServers,
    getMcpServer,
    addMcpServer,
    updateMcpServer,
    deleteMcpServer,
    startMcpServer,
    stopMcpServer,
    testMcpConnection,
    listMcpTools,
    getMcpServerStatus,
  }
}
