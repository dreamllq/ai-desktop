// Agent Types

export type AgentType = 'remote' | 'local'

export interface AgentManifest {
  name: string
  description: string
  version: string
  author?: string
  requiredTools: string[]
  supportedModelPatterns?: string[]
}

export interface RemoteAgentConfig {
  url: string
  protocol: 'json-rpc'
  headers?: Record<string, string>
}

export interface LocalAgentConfig {
  packageName: string
  version: string
  entryPoint?: string
}

export interface AgentConfig {
  id: string
  name: string
  description: string
  type: AgentType
  config: RemoteAgentConfig | LocalAgentConfig
  manifest: AgentManifest
  enabled: boolean
  createdAt: number
  updatedAt: number
}

// Skill Types

export type SkillSource = 'built-in' | 'user-defined'

export interface SkillManifest {
  name: string
  version: string
  description: string
  requiredTools: string[]
  triggers?: string[]
}

export interface SkillConfig {
  id: string
  name: string
  description: string
  source: SkillSource
  filePath: string | null
  manifest: SkillManifest
  content: string
  enabled: boolean
  createdAt: number
  updatedAt: number
}

// MCP Types

export type McpTransportType = 'stdio' | 'sse'

export interface McpServerConfig {
  id: string
  name: string
  transportType: McpTransportType
  config: { command: string; args: string[] } | { url: string }
  enabled: boolean
  createdAt: number
  updatedAt: number
}

export interface McpToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface McpToolResult {
  content: string
  isError: boolean
}

// Tool Types

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  source: string
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolResult {
  output: string
  isError: boolean
  source: string
}

// Execution Types

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'error' | 'aborted'

export type ExecutionEventType = 'token' | 'tool-call' | 'tool-result' | 'error' | 'complete'

export interface ExecutionRequest {
  conversationId: string
  message: string
  agentId: string
  modelId: string
  skillIds: string[]
}

export interface ExecutionEvent {
  type: ExecutionEventType
  payload: unknown
}

// Streaming Types

export interface StreamTokenEvent {
  conversationId: string
  messageId: string
  token: string
  index: number
}

export interface StreamEndEvent {
  conversationId: string
  messageId: string
  fullContent: string
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
}

export interface StreamErrorEvent {
  conversationId: string
  messageId: string
  error: string
}

export interface StreamToolCallEvent {
  conversationId: string
  messageId: string
  toolCall: ToolCall
}

export interface StreamToolResultEvent {
  conversationId: string
  messageId: string
  toolResult: ToolResult
}

// LLM Types

export type LlmMessageRole = 'system' | 'user' | 'assistant' | 'tool'

export interface LlmToolCall {
  id: string
  name: string
  arguments: string // JSON string
}

export interface LlmMessage {
  role: LlmMessageRole
  content: string | null
  toolCalls?: LlmToolCall[]
  toolCallId?: string
}

export interface LlmResponse {
  content: string | null
  toolCalls: LlmToolCall[]
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
  stopReason: string
}

export interface LlmStreamChunk {
  deltaContent: string | null
  deltaToolCalls?: Partial<LlmToolCall>[]
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
  stopReason?: string
}

export interface LlmChatRequest {
  messages: LlmMessage[]
  model: string
  tools?: ToolDefinition[]
  temperature?: number
  maxTokens?: number
  topP?: number
  abortSignal?: AbortSignal
}

// Memory Types

export interface IMemoryService {
  getContext(conversationId: string, query: string): Promise<string[]>
  storeInteraction(conversationId: string, role: string, content: string): Promise<void>
  search(query: string, limit?: number): Promise<string[]>
  clear(conversationId?: string): Promise<void>
}
