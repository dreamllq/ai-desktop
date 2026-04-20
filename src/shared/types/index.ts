export * from './agent'
import type { ToolCall } from './agent'

export const IPC_CHANNELS = {
  PING: 'ping',
  GET_APP_INFO: 'get-app-info',
  GET_SETTING: 'get-setting',
  SET_SETTING: 'set-setting',
  OPEN_SETTINGS: 'open-settings',
  OPEN_ABOUT: 'open-about',
  LLM_LIST_PROVIDERS: 'llm-list-providers',
  LLM_GET_PROVIDER: 'llm-get-provider',
  LLM_CREATE_PROVIDER: 'llm-create-provider',
  LLM_UPDATE_PROVIDER: 'llm-update-provider',
  LLM_DELETE_PROVIDER: 'llm-delete-provider',
  CHAT_LIST_CONVERSATIONS: 'chat-list-conversations',
  CHAT_GET_CONVERSATION: 'chat-get-conversation',
  CHAT_CREATE_CONVERSATION: 'chat-create-conversation',
  CHAT_UPDATE_CONVERSATION: 'chat-update-conversation',
  CHAT_DELETE_CONVERSATION: 'chat-delete-conversation',
  CHAT_LIST_MESSAGES: 'chat-list-messages',
  CHAT_SEND_MESSAGE: 'chat-send-message',
  CHAT_GET_ACTIVE_CONVERSATION: 'chat-get-active-conversation',
  CHAT_SET_ACTIVE_CONVERSATION: 'chat-set-active-conversation',
} as const

export const IPC_STREAM_EVENTS = {
  CHAT_STREAM_TOKEN: 'chat-stream-token',
  CHAT_STREAM_END: 'chat-stream-end',
  CHAT_STREAM_ERROR: 'chat-stream-error',
  CHAT_STREAM_TOOL_CALL: 'chat-stream-tool-call',
  CHAT_STREAM_TOOL_RESULT: 'chat-stream-tool-result',
  CHAT_STREAM_ABORT: 'chat-stream-abort',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

export interface AppInfo {
  name: string
  version: string
  electronVersion: string
  chromeVersion: string
  nodeVersion: string
  platform: string
}

export interface LlmCustomHeader {
  key: string
  value: string
}

export interface LlmDefaultParams {
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

export interface IpcResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface LlmProvider {
  id: string
  name: string
  enabled: boolean
  baseUrl: string
  apiPath: string
  encryptedKey: string
  models: string[]
  defaultModel: string
  defaultParams: LlmDefaultParams
  proxy: string
  timeout: number
  customHeaders: LlmCustomHeader[]
  createdAt: number
  updatedAt: number
}

export interface LlmProviderListItem {
  id: string
  name: string
  enabled: boolean
  baseUrl: string
  apiPath: string
  maskedApiKey: string
  models: string[]
  defaultModel: string
  defaultParams: LlmDefaultParams
  proxy: string
  timeout: number
  customHeaders: LlmCustomHeader[]
  createdAt: number
  updatedAt: number
}

export interface LlmProviderCreate {
  name: string
  apiKey: string
  enabled?: boolean
  baseUrl?: string
  apiPath?: string
  models?: string[]
  defaultModel?: string
  defaultParams?: LlmDefaultParams
  proxy?: string
  timeout?: number
  customHeaders?: LlmCustomHeader[]
}

export interface LlmProviderUpdate {
  name?: string
  apiKey?: string
  enabled?: boolean
  baseUrl?: string
  apiPath?: string
  models?: string[]
  defaultModel?: string
  defaultParams?: LlmDefaultParams
  proxy?: string
  timeout?: number
  customHeaders?: LlmCustomHeader[]
}

export interface Conversation {
  id: string
  title: string
  agentId?: string
  modelId?: string
  skillIds?: string[]
  createdAt: number
  updatedAt: number
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: ToolCall[]
  toolCallId?: string
  model?: string
  tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number }
  createdAt: number
}

export interface CreateConversationParams {
  title?: string
}

export interface UpdateConversationParams {
  id: string
  title?: string
}

export interface SendMessageParams {
  conversationId: string
  content: string
}

// Custom API exposed via contextBridge — this is the contract between preload and renderer
export interface CustomAPI {
  ping: () => Promise<string>
  getAppInfo: () => Promise<AppInfo>
  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>
  openSettings: () => Promise<void>
  openAbout: () => Promise<void>
  listProviders: () => Promise<IpcResult<LlmProviderListItem[]>>
  getProvider: (id: string) => Promise<IpcResult<LlmProviderListItem>>
  createProvider: (data: LlmProviderCreate) => Promise<IpcResult<string>>
  updateProvider: (id: string, updates: LlmProviderUpdate) => Promise<IpcResult<boolean>>
  deleteProvider: (id: string) => Promise<IpcResult<boolean>>
  listConversations: () => Promise<IpcResult<Conversation[]>>
  getConversation: (id: string) => Promise<IpcResult<Conversation | null>>
  createConversation: (title?: string) => Promise<IpcResult<Conversation>>
  updateConversation: (id: string, title: string) => Promise<IpcResult<boolean>>
  deleteConversation: (id: string) => Promise<IpcResult<boolean>>
  listMessages: (conversationId: string) => Promise<IpcResult<Message[]>>
  sendMessage: (conversationId: string, content: string) => Promise<IpcResult<Message>>
  getActiveConversation: () => Promise<IpcResult<string | null>>
  setActiveConversation: (id: string | null) => Promise<IpcResult<void>>
}
