import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types/index'
import type {
  IpcResult,
  AgentRegisterParams,
  AgentUpdateParams,
  AgentConfig,
} from '../../shared/types/index'
import type { AgentRegistry } from '../services/agent-registry'

export function registerAgentHandlers(getRegistry: () => AgentRegistry): void {
  ipcMain.handle(IPC_CHANNELS.AGENT_LIST, (): IpcResult<AgentConfig[]> => {
    const result = getRegistry().listAgents()
    if (result.success) return { success: true, data: result.data }
    return { success: false, error: result.error }
  })

  ipcMain.handle(IPC_CHANNELS.AGENT_GET, (_event, id: string): IpcResult<AgentConfig | null> => {
    if (!id) return { success: false, error: 'Agent ID is required' }
    const result = getRegistry().getAgent(id)
    if (result.success) return { success: true, data: result.data! }
    return { success: false, error: result.error }
  })

  ipcMain.handle(
    IPC_CHANNELS.AGENT_REGISTER,
    (_event, params: AgentRegisterParams): IpcResult<string> => {
      if (!params.name?.trim()) return { success: false, error: 'Agent name is required' }
      const result = getRegistry().registerAgent(params)
      if (result.success) return { success: true, data: result.data!.id }
      return { success: false, error: result.error }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.AGENT_UPDATE,
    (_event, id: string, params: AgentUpdateParams): IpcResult<boolean> => {
      if (!id) return { success: false, error: 'Agent ID is required' }
      const result = getRegistry().updateAgent(id, params)
      if (result.success) return { success: true, data: true }
      return { success: false, error: result.error }
    },
  )

  ipcMain.handle(IPC_CHANNELS.AGENT_DELETE, (_event, id: string): IpcResult<boolean> => {
    if (!id) return { success: false, error: 'Agent ID is required' }
    const result = getRegistry().deleteAgent(id)
    if (result.success) return { success: true, data: true }
    return { success: false, error: result.error }
  })
}
