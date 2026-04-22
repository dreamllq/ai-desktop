export * from './agent'
import type {
  ToolCall,
  AgentConfig,
  AgentType,
  RemoteAgentConfig,
  LocalAgentConfig,
  AgentManifest,
  SkillConfig,
  McpServerConfig,
  McpTransportType,
  McpToolDefinition,
  McpToolResult,
} from './agent'

export const IPC_CHANNELS = {
  PING: 'ping',
  GET_APP_INFO: 'get-app-info',
  GET_SETTING: 'get-setting',
  SET_SETTING: 'set-setting',
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

  // Agent channels
  AGENT_LIST: 'agent-list',
  AGENT_GET: 'agent-get',
  AGENT_REGISTER: 'agent-register',
  AGENT_UPDATE: 'agent-update',
  AGENT_DELETE: 'agent-delete',

  // Skill channels
  SKILL_LIST: 'skill-list',
  SKILL_GET: 'skill-get',
  SKILL_RELOAD: 'skill-reload',
  SKILL_DELETE: 'skill-delete',
  SKILL_CREATE: 'skill-create',
  SKILL_UPDATE: 'skill-update',

  // MCP channels
  MCP_LIST_SERVERS: 'mcp-list-servers',
  MCP_GET_SERVER: 'mcp-get-server',
  MCP_ADD_SERVER: 'mcp-add-server',
  MCP_UPDATE_SERVER: 'mcp-update-server',
  MCP_DELETE_SERVER: 'mcp-delete-server',
  MCP_LIST_TOOLS: 'mcp-list-tools',
  MCP_EXECUTE_TOOL: 'mcp-execute-tool',
  MCP_GET_SERVER_STATUS: 'mcp-get-server-status',
  MCP_START_SERVER: 'mcp-start-server',
  MCP_STOP_SERVER: 'mcp-stop-server',
  MCP_TEST_CONNECTION: 'mcp-test-connection',

  // Model channels
  MODEL_LIST_AVAILABLE: 'model-list-available',

  // Chat extensions
  CHAT_CREATE_WITH_CONFIG: 'chat-create-with-config',
  CHAT_SWITCH_MODEL: 'chat-switch-model',
  CHAT_GET_CONFIG: 'chat-get-config',
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

export interface AgentRegisterParams {
  name: string
  description: string
  type: AgentType
  config: RemoteAgentConfig | LocalAgentConfig
  manifest: AgentManifest
  enabled?: boolean
}

export interface AgentUpdateParams {
  name?: string
  description?: string
  type?: AgentType
  config?: RemoteAgentConfig | LocalAgentConfig
  manifest?: AgentManifest
  enabled?: boolean
}

export interface McpServerAddParams {
  name: string
  transportType: McpTransportType
  config:
    | { command: string; args: string[]; env?: Record<string, string> }
    | { url: string; headers?: Record<string, string> }
  enabled?: boolean
}

export interface McpServerUpdateParams {
  name?: string
  transportType?: McpTransportType
  config?:
    | { command: string; args: string[]; env?: Record<string, string> }
    | { url: string; headers?: Record<string, string> }
  enabled?: boolean
}

export interface SkillCreateParams {
  name: string
  description: string
  content: string
}

export interface SkillUpdateParams {
  name?: string
  description?: string
  content?: string
  enabled?: boolean
}

export interface CreateConversationWithConfigParams {
  title?: string
  agentId?: string
  modelId?: string
  skillIds?: string[]
}

export interface ConversationConfig {
  agentId: string | null
  modelId: string | null
  skillIds: string[]
}

export interface ModelInfo {
  id: string
  name: string
  providerId: string
  providerName: string
}

// Custom API exposed via contextBridge — this is the contract between preload and renderer
export interface CustomAPI {
  ping: () => Promise<string>
  getAppInfo: () => Promise<AppInfo>
  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>
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

  // Agent
  listAgents: () => Promise<IpcResult<AgentConfig[]>>
  getAgent: (id: string) => Promise<IpcResult<AgentConfig | null>>
  registerAgent: (params: AgentRegisterParams) => Promise<IpcResult<string>>
  updateAgent: (id: string, params: AgentUpdateParams) => Promise<IpcResult<boolean>>
  deleteAgent: (id: string) => Promise<IpcResult<boolean>>

  // Skill
  listSkills: () => Promise<IpcResult<SkillConfig[]>>
  getSkill: (id: string) => Promise<IpcResult<SkillConfig | null>>
  reloadSkills: () => Promise<IpcResult<boolean>>
  deleteSkill: (id: string) => Promise<IpcResult<boolean>>
  createSkill: (params: SkillCreateParams) => Promise<IpcResult<string>>
  updateSkill: (id: string, params: SkillUpdateParams) => Promise<IpcResult<boolean>>

  // MCP
  listMcpServers: () => Promise<IpcResult<McpServerConfig[]>>
  getMcpServer: (id: string) => Promise<IpcResult<McpServerConfig | null>>
  addMcpServer: (params: McpServerAddParams) => Promise<IpcResult<string>>
  updateMcpServer: (id: string, params: McpServerUpdateParams) => Promise<IpcResult<boolean>>
  deleteMcpServer: (id: string) => Promise<IpcResult<boolean>>
  listMcpTools: (serverId: string) => Promise<IpcResult<McpToolDefinition[]>>
  executeMcpTool: (
    serverId: string,
    toolName: string,
    args: Record<string, unknown>,
  ) => Promise<IpcResult<McpToolResult>>
  getMcpServerStatus: (
    serverId: string,
  ) => Promise<IpcResult<{ connected: boolean; error?: string }>>
  startMcpServer: (id: string) => Promise<IpcResult<boolean>>
  stopMcpServer: (id: string) => Promise<IpcResult<boolean>>
  testMcpConnection: (
    params: McpServerAddParams,
  ) => Promise<IpcResult<{ success: boolean; toolCount: number; error?: string }>>

  // Model
  listAvailableModels: () => Promise<IpcResult<ModelInfo[]>>

  // Chat extensions
  createConversationWithConfig: (
    params: CreateConversationWithConfigParams,
  ) => Promise<IpcResult<Conversation>>
  switchModel: (conversationId: string, modelId: string) => Promise<IpcResult<boolean>>
  getConversationConfig: (conversationId: string) => Promise<IpcResult<ConversationConfig>>
}
