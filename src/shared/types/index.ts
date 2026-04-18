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
}
