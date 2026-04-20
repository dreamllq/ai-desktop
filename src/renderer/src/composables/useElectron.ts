import type {
  AppInfo,
  Conversation,
  CustomAPI,
  LlmProviderCreate,
  LlmProviderListItem,
  LlmProviderUpdate,
  Message,
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

  function listProviders(): Promise<{
    success: boolean
    data?: LlmProviderListItem[]
    error?: string
  }> {
    return api.listProviders() as Promise<{
      success: boolean
      data?: LlmProviderListItem[]
      error?: string
    }>
  }

  function getProvider(id: string): Promise<{
    success: boolean
    data?: LlmProviderListItem
    error?: string
  }> {
    return api.getProvider(id) as Promise<{
      success: boolean
      data?: LlmProviderListItem
      error?: string
    }>
  }

  function createProvider(data: LlmProviderCreate): Promise<{
    success: boolean
    data?: string
    error?: string
  }> {
    return api.createProvider(data) as Promise<{
      success: boolean
      data?: string
      error?: string
    }>
  }

  function updateProvider(
    id: string,
    updates: LlmProviderUpdate,
  ): Promise<{
    success: boolean
    data?: boolean
    error?: string
  }> {
    return api.updateProvider(id, updates) as Promise<{
      success: boolean
      data?: boolean
      error?: string
    }>
  }

  function deleteProvider(id: string): Promise<{
    success: boolean
    data?: boolean
    error?: string
  }> {
    return api.deleteProvider(id) as Promise<{
      success: boolean
      data?: boolean
      error?: string
    }>
  }

  function listConversations(): Promise<{
    success: boolean
    data?: Conversation[]
    error?: string
  }> {
    return api.listConversations() as Promise<{
      success: boolean
      data?: Conversation[]
      error?: string
    }>
  }

  function getConversation(id: string): Promise<{
    success: boolean
    data?: Conversation | null
    error?: string
  }> {
    return api.getConversation(id) as Promise<{
      success: boolean
      data?: Conversation | null
      error?: string
    }>
  }

  function createConversation(title?: string): Promise<{
    success: boolean
    data?: Conversation
    error?: string
  }> {
    return api.createConversation(title) as Promise<{
      success: boolean
      data?: Conversation
      error?: string
    }>
  }

  function updateConversation(
    id: string,
    title: string,
  ): Promise<{
    success: boolean
    data?: boolean
    error?: string
  }> {
    return api.updateConversation(id, title) as Promise<{
      success: boolean
      data?: boolean
      error?: string
    }>
  }

  function deleteConversation(id: string): Promise<{
    success: boolean
    data?: boolean
    error?: string
  }> {
    return api.deleteConversation(id) as Promise<{
      success: boolean
      data?: boolean
      error?: string
    }>
  }

  function listMessages(conversationId: string): Promise<{
    success: boolean
    data?: Message[]
    error?: string
  }> {
    return api.listMessages(conversationId) as Promise<{
      success: boolean
      data?: Message[]
      error?: string
    }>
  }

  function sendMessage(
    conversationId: string,
    content: string,
  ): Promise<{
    success: boolean
    data?: Message
    error?: string
  }> {
    return api.sendMessage(conversationId, content) as Promise<{
      success: boolean
      data?: Message
      error?: string
    }>
  }

  function getActiveConversation(): Promise<{
    success: boolean
    data?: string | null
    error?: string
  }> {
    return api.getActiveConversation() as Promise<{
      success: boolean
      data?: string | null
      error?: string
    }>
  }

  function setActiveConversation(id: string | null): Promise<{
    success: boolean
    data?: void
    error?: string
  }> {
    return api.setActiveConversation(id) as Promise<{
      success: boolean
      data?: void
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
    listConversations,
    getConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    listMessages,
    sendMessage,
    getActiveConversation,
    setActiveConversation,
  }
}
