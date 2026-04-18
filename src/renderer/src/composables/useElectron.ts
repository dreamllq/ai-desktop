import type {
  AppInfo,
  CustomAPI,
  LlmProviderCreate,
  LlmProviderListItem,
  LlmProviderUpdate,
} from '@shared/types'

export function useElectron(): CustomAPI {
  const api = window.api

  function ping(): Promise<string> {
    return api.ping()
  }

  function getAppInfo(): Promise<AppInfo> {
    return api.getAppInfo()
  }

  function getSetting(key: string): Promise<string | null> {
    return api.getSetting(key)
  }

  function setSetting(key: string, value: string): Promise<void> {
    return api.setSetting(key, value)
  }

  function openSettings(): Promise<void> {
    return api.openSettings()
  }

  function openAbout(): Promise<void> {
    return api.openAbout()
  }

  function listProviders() {
    return api.listProviders() as Promise<{
      success: boolean
      data?: LlmProviderListItem[]
      error?: string
    }>
  }

  function getProvider(id: string) {
    return api.getProvider(id) as Promise<{
      success: boolean
      data?: LlmProviderListItem
      error?: string
    }>
  }

  function createProvider(data: LlmProviderCreate) {
    return api.createProvider(data) as Promise<{
      success: boolean
      data?: string
      error?: string
    }>
  }

  function updateProvider(id: string, updates: LlmProviderUpdate) {
    return api.updateProvider(id, updates) as Promise<{
      success: boolean
      data?: boolean
      error?: string
    }>
  }

  function deleteProvider(id: string) {
    return api.deleteProvider(id) as Promise<{
      success: boolean
      data?: boolean
      error?: string
    }>
  }

  return {
    ping,
    getAppInfo,
    getSetting,
    setSetting,
    openSettings,
    openAbout,
    listProviders,
    getProvider,
    createProvider,
    updateProvider,
    deleteProvider,
  }
}
