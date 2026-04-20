import type { IpcResult, AgentConfig, AgentRegisterParams } from '@shared/types'

export function useAgent() {
  async function listAgents(): Promise<IpcResult<AgentConfig[]>> {
    return window.api.listAgents()
  }

  async function getAgent(id: string): Promise<IpcResult<AgentConfig | null>> {
    return window.api.getAgent(id)
  }

  async function registerAgent(params: AgentRegisterParams): Promise<IpcResult<string>> {
    return window.api.registerAgent(params)
  }

  return { listAgents, getAgent, registerAgent }
}
