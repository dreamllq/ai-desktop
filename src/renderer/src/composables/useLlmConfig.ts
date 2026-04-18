import type {
  IpcResult,
  LlmProviderCreate,
  LlmProviderListItem,
  LlmProviderUpdate,
} from '@shared/types'

export function useLlmConfig(): {
  listProviders: () => Promise<IpcResult<LlmProviderListItem[]>>
  getProvider: (id: string) => Promise<IpcResult<LlmProviderListItem>>
  createProvider: (data: LlmProviderCreate) => Promise<IpcResult<string>>
  updateProvider: (id: string, updates: LlmProviderUpdate) => Promise<IpcResult<boolean>>
  deleteProvider: (id: string) => Promise<IpcResult<boolean>>
} {
  async function listProviders(): Promise<IpcResult<LlmProviderListItem[]>> {
    return window.api.listProviders()
  }

  async function getProvider(id: string): Promise<IpcResult<LlmProviderListItem>> {
    return window.api.getProvider(id)
  }

  async function createProvider(data: LlmProviderCreate): Promise<IpcResult<string>> {
    return window.api.createProvider(data)
  }

  async function updateProvider(
    id: string,
    updates: LlmProviderUpdate,
  ): Promise<IpcResult<boolean>> {
    return window.api.updateProvider(id, updates)
  }

  async function deleteProvider(id: string): Promise<IpcResult<boolean>> {
    return window.api.deleteProvider(id)
  }

  return { listProviders, getProvider, createProvider, updateProvider, deleteProvider }
}
