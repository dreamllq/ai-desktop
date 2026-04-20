import type {
  AppInfo,
  Conversation,
  ConversationConfig,
  CustomAPI,
  LlmProviderCreate,
  LlmProviderListItem,
  LlmProviderUpdate,
  Message,
  AgentRegisterParams,
  AgentUpdateParams,
  AgentConfig,
  SkillConfig,
  McpServerConfig,
  McpServerAddParams,
  McpServerUpdateParams,
  McpToolDefinition,
  McpToolResult,
  ModelInfo,
  CreateConversationWithConfigParams,
  IpcResult,
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

  function listAgents(): Promise<IpcResult<AgentConfig[]>> {
    return api.listAgents()
  }

  function getAgent(id: string): Promise<IpcResult<AgentConfig | null>> {
    return api.getAgent(id)
  }

  function registerAgent(params: AgentRegisterParams): Promise<IpcResult<string>> {
    return api.registerAgent(params)
  }

  function updateAgent(id: string, params: AgentUpdateParams): Promise<IpcResult<boolean>> {
    return api.updateAgent(id, params)
  }

  function deleteAgent(id: string): Promise<IpcResult<boolean>> {
    return api.deleteAgent(id)
  }

  function listSkills(): Promise<IpcResult<SkillConfig[]>> {
    return api.listSkills()
  }

  function getSkill(id: string): Promise<IpcResult<SkillConfig | null>> {
    return api.getSkill(id)
  }

  function reloadSkills(): Promise<IpcResult<boolean>> {
    return api.reloadSkills()
  }

  function deleteSkill(id: string): Promise<IpcResult<boolean>> {
    return api.deleteSkill(id)
  }

  function listMcpServers(): Promise<IpcResult<McpServerConfig[]>> {
    return api.listMcpServers()
  }

  function getMcpServer(id: string): Promise<IpcResult<McpServerConfig | null>> {
    return api.getMcpServer(id)
  }

  function addMcpServer(params: McpServerAddParams): Promise<IpcResult<string>> {
    return api.addMcpServer(params)
  }

  function updateMcpServer(id: string, params: McpServerUpdateParams): Promise<IpcResult<boolean>> {
    return api.updateMcpServer(id, params)
  }

  function deleteMcpServer(id: string): Promise<IpcResult<boolean>> {
    return api.deleteMcpServer(id)
  }

  function listMcpTools(serverId: string): Promise<IpcResult<McpToolDefinition[]>> {
    return api.listMcpTools(serverId)
  }

  function executeMcpTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<IpcResult<McpToolResult>> {
    return api.executeMcpTool(serverId, toolName, args)
  }

  function getMcpServerStatus(
    serverId: string,
  ): Promise<IpcResult<{ connected: boolean; error?: string }>> {
    return api.getMcpServerStatus(serverId)
  }

  function listAvailableModels(): Promise<IpcResult<ModelInfo[]>> {
    return api.listAvailableModels()
  }

  function createConversationWithConfig(
    params: CreateConversationWithConfigParams,
  ): Promise<IpcResult<Conversation>> {
    return api.createConversationWithConfig(params)
  }

  function switchModel(conversationId: string, modelId: string): Promise<IpcResult<boolean>> {
    return api.switchModel(conversationId, modelId)
  }

  function getConversationConfig(conversationId: string): Promise<IpcResult<ConversationConfig>> {
    return api.getConversationConfig(conversationId)
  }

  return {
    ping,
    getAppInfo,
    getSetting,
    setSetting,
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
    listAgents,
    getAgent,
    registerAgent,
    updateAgent,
    deleteAgent,
    listSkills,
    getSkill,
    reloadSkills,
    deleteSkill,
    listMcpServers,
    getMcpServer,
    addMcpServer,
    updateMcpServer,
    deleteMcpServer,
    listMcpTools,
    executeMcpTool,
    getMcpServerStatus,
    listAvailableModels,
    createConversationWithConfig,
    switchModel,
    getConversationConfig,
  }
}
