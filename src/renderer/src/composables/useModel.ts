import type { IpcResult, ModelInfo } from '@shared/types'

export function useModel(): {
  listAvailableModels: () => Promise<IpcResult<ModelInfo[]>>
  switchModel: (conversationId: string, modelId: string) => Promise<IpcResult<boolean>>
} {
  async function listAvailableModels(): Promise<IpcResult<ModelInfo[]>> {
    return window.api.listAvailableModels()
  }

  async function switchModel(conversationId: string, modelId: string): Promise<IpcResult<boolean>> {
    return window.api.switchModel(conversationId, modelId)
  }

  return { listAvailableModels, switchModel }
}
