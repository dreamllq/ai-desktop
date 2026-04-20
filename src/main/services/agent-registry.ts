import {
  AgentRepository,
  type AgentCreateParams,
  type AgentUpdateParams,
} from '../repositories/agent'
import type {
  AgentConfig,
  AgentManifest,
  RemoteAgentConfig,
  LocalAgentConfig,
  AgentType,
} from '../../shared/types/agent'

export interface AgentResult<T> {
  success: boolean
  data?: T
  error?: string
}

const DEFAULT_AGENT_MANIFEST: AgentManifest = {
  name: '默认助手',
  description: '内置默认助手，使用执行引擎处理对话',
  version: '1.0.0',
  requiredTools: [],
}

const DEFAULT_AGENT_CONFIG: RemoteAgentConfig = {
  url: 'builtin://execution-engine',
  protocol: 'json-rpc',
}

export class AgentRegistry {
  private repository: AgentRepository
  private initialized = false

  constructor(repository: AgentRepository) {
    this.repository = repository
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    const agents = this.repository.list()
    const hasDefault = agents.some((a) => a.name === DEFAULT_AGENT_MANIFEST.name)

    if (!hasDefault) {
      this.repository.create({
        name: DEFAULT_AGENT_MANIFEST.name,
        description: DEFAULT_AGENT_MANIFEST.description,
        type: 'remote' as AgentType,
        config: DEFAULT_AGENT_CONFIG,
        manifest: DEFAULT_AGENT_MANIFEST,
        enabled: true,
      })
    }

    this.initialized = true
  }

  listAgents(): AgentResult<AgentConfig[]> {
    try {
      const agents = this.repository.list()
      return { success: true, data: agents }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  getAgent(id: string): AgentResult<AgentConfig> {
    try {
      const agent = this.repository.get(id)
      if (!agent) return { success: false, error: 'Agent not found' }
      return { success: true, data: agent }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  registerAgent(params: {
    name: string
    description: string
    type: AgentType
    config: RemoteAgentConfig | LocalAgentConfig
    manifest?: Partial<AgentManifest>
  }): AgentResult<AgentConfig> {
    try {
      if (params.type === 'remote') {
        const remoteConfig = params.config as RemoteAgentConfig
        if (!remoteConfig.url || !remoteConfig.url.startsWith('http')) {
          return { success: false, error: 'Invalid remote agent URL' }
        }
      }

      const fullManifest: AgentManifest = {
        name: params.name,
        description: params.description,
        version: params.manifest?.version || '1.0.0',
        author: params.manifest?.author,
        requiredTools: params.manifest?.requiredTools || [],
        supportedModelPatterns: params.manifest?.supportedModelPatterns,
      }

      const createParams: AgentCreateParams = {
        name: params.name,
        description: params.description,
        type: params.type,
        config: params.config,
        manifest: fullManifest,
        enabled: true,
      }

      const id = this.repository.create(createParams)
      const agent = this.repository.get(id)

      if (!agent) {
        return { success: false, error: 'Failed to retrieve created agent' }
      }

      return { success: true, data: agent }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  updateAgent(
    id: string,
    updates: Partial<Pick<AgentConfig, 'name' | 'description' | 'enabled' | 'config' | 'manifest'>>,
  ): AgentResult<AgentConfig> {
    try {
      const existing = this.repository.get(id)
      if (!existing) return { success: false, error: 'Agent not found' }

      const updateParams: AgentUpdateParams = {
        name: updates.name,
        description: updates.description,
        config: updates.config,
        manifest: updates.manifest,
        enabled: updates.enabled,
      }

      this.repository.update(id, updateParams)

      const updated = this.repository.get(id)
      if (!updated) return { success: false, error: 'Failed to retrieve updated agent' }

      return { success: true, data: updated }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  deleteAgent(id: string): AgentResult<void> {
    try {
      const agent = this.repository.get(id)
      if (!agent) return { success: false, error: 'Agent not found' }
      if (agent.name === DEFAULT_AGENT_MANIFEST.name) {
        return { success: false, error: 'Cannot delete the default agent' }
      }

      this.repository.delete(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  async validateRemoteAgent(url: string): Promise<AgentResult<{ name: string; version: string }>> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'ai-desktop', version: '1.0.0' },
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` }
      }

      const data = (await response.json()) as {
        result?: { serverInfo?: { name?: string; version?: string } }
      }
      const serverInfo = data?.result?.serverInfo || {}

      return {
        success: true,
        data: {
          name: serverInfo.name || 'Unknown',
          version: serverInfo.version || '0.0.0',
        },
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Connection failed' }
    }
  }

  getAgentManifest(agent: AgentConfig): AgentManifest {
    return agent.manifest
  }
}
