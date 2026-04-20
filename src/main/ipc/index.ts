import { ipcMain, app, BrowserWindow } from 'electron'
import { randomUUID } from 'node:crypto'
import { IPC_CHANNELS, IPC_STREAM_EVENTS } from '@shared/types'
import type {
  AppInfo,
  IpcResult,
  LlmProviderCreate,
  LlmProviderUpdate,
  Conversation,
  ConversationConfig,
  ModelInfo,
  CreateConversationWithConfigParams,
  ExecutionRequest,
} from '@shared/types'
import { DatabaseService, type Repositories } from '../database'
import { createSettingsWindow, createAboutWindow } from '../windows'
import { createLLMProvider } from '../services/llm-service'
import { AgentRegistry } from '../services/agent-registry'
import { SkillManager } from '../services/skill-manager'
import { getMcpManager } from '../services/mcp-manager'
import { getToolRegistry } from '../services/tool-registry'
import { createExecutionEngine } from '../services/execution-engine'
import { createStreamer } from './streaming'
import { registerAgentHandlers } from './agent-handlers'
import { registerSkillHandlers } from './skill-handlers'
import { registerMcpHandlers } from './mcp-handlers'

function db(): DatabaseService {
  return DatabaseService.getInstance()
}

function repos(): Repositories {
  return db().repositories
}

export async function registerIpcHandlers(): Promise<void> {
  const agentRegistry = new AgentRegistry(repos().agent)
  const skillManager = new SkillManager(repos().skill)
  const mcpManager = getMcpManager()

  await agentRegistry.initialize()
  await skillManager.initialize()

  const toolRegistry = getToolRegistry()
  toolRegistry.initialize(mcpManager)

  const engine = createExecutionEngine({
    getProviderForModel: (modelId: string) => {
      const providers = db().listProviders()
      const provider = providers.find(
        (p) => p.enabled && (p.models.includes(modelId) || p.defaultModel === modelId),
      )
      if (!provider) throw new Error(`No provider found for model: ${modelId}`)
      const fullProvider = db().getProviderById(provider.id)
      if (!fullProvider) throw new Error(`Provider not found: ${provider.id}`)
      return createLLMProvider(fullProvider, fullProvider.encryptedKey)
    },
    toolRegistry,
    agentRegistry,
    skillManager,
    messageRepo: repos().message,
  })

  const agents = agentRegistry.listAgents()
  const defaultAgentId =
    agents.success && agents.data
      ? agents.data.find((a) => a.name === '默认助手')?.id || agents.data[0]?.id || ''
      : ''

  const providers = db().listProviders()
  const firstEnabled = providers.find((p) => p.enabled)
  const defaultModelId = firstEnabled?.defaultModel || firstEnabled?.models?.[0] || ''

  const activeExecutions = new Map<string, AbortController>()

  ipcMain.handle(IPC_CHANNELS.PING, () => 'pong')

  ipcMain.handle(IPC_CHANNELS.GET_APP_INFO, (): AppInfo => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
      platform: process.platform,
    }
  })

  ipcMain.handle(IPC_CHANNELS.GET_SETTING, (_event, key: string): string | null => {
    return db().getSetting(key)
  })

  ipcMain.handle(IPC_CHANNELS.SET_SETTING, (_event, key: string, value: string): void => {
    db().setSetting(key, value)
  })

  ipcMain.handle(IPC_CHANNELS.OPEN_SETTINGS, () => {
    createSettingsWindow()
  })

  ipcMain.handle(IPC_CHANNELS.OPEN_ABOUT, () => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      createAboutWindow(mainWindow)
    }
  })

  // LLM Provider handlers
  ipcMain.handle(IPC_CHANNELS.LLM_LIST_PROVIDERS, () => {
    try {
      const providers = db().listProviders()
      return { success: true as const, data: providers }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.LLM_GET_PROVIDER, (_event, id: string) => {
    try {
      const provider = db().getProviderPublic(id)
      if (!provider) {
        return { success: false as const, error: 'Provider not found' }
      }
      return { success: true as const, data: provider }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.LLM_CREATE_PROVIDER, (_event, data: LlmProviderCreate) => {
    try {
      if (!data || !data.name || !data.name.trim()) {
        return { success: false as const, error: 'Provider name is required' }
      }
      if (data.baseUrl) {
        try {
          new URL(data.baseUrl)
        } catch {
          return { success: false as const, error: 'Invalid baseUrl format' }
        }
      }
      if (data.timeout !== undefined && (typeof data.timeout !== 'number' || data.timeout <= 0)) {
        return { success: false as const, error: 'Timeout must be a positive number' }
      }
      const id = db().createProvider(data)
      return { success: true as const, data: id }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(
    IPC_CHANNELS.LLM_UPDATE_PROVIDER,
    (_event, id: string, updates: LlmProviderUpdate) => {
      try {
        if (!id) {
          return { success: false as const, error: 'Provider ID is required' }
        }
        if (updates.name !== undefined && !updates.name.trim()) {
          return { success: false as const, error: 'Provider name cannot be empty' }
        }
        if (updates.baseUrl !== undefined && updates.baseUrl) {
          try {
            new URL(updates.baseUrl)
          } catch {
            return { success: false as const, error: 'Invalid baseUrl format' }
          }
        }
        const result = db().updateProvider(id, updates)
        return { success: true as const, data: result }
      } catch (error) {
        return { success: false as const, error: String(error) }
      }
    },
  )

  ipcMain.handle(IPC_CHANNELS.LLM_DELETE_PROVIDER, (_event, id: string) => {
    try {
      if (!id) {
        return { success: false as const, error: 'Provider ID is required' }
      }
      const result = db().deleteProvider(id)
      return { success: true as const, data: result }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  // Chat handlers
  ipcMain.handle(IPC_CHANNELS.CHAT_LIST_CONVERSATIONS, () => {
    try {
      const conversations = repos().conversation.list()
      return { success: true as const, data: conversations }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CHAT_GET_CONVERSATION, (_event, id: string) => {
    try {
      if (!id) {
        return { success: false as const, error: 'Conversation ID is required' }
      }
      const conversation = repos().conversation.get(id)
      return { success: true as const, data: conversation }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CHAT_CREATE_CONVERSATION, (_event, title?: string) => {
    try {
      const conversation = repos().conversation.create(title)
      return { success: true as const, data: conversation }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CHAT_UPDATE_CONVERSATION, (_event, id: string, title: string) => {
    try {
      if (!id) {
        return { success: false as const, error: 'Conversation ID is required' }
      }
      if (!title || !title.trim()) {
        return { success: false as const, error: 'Title is required' }
      }
      const result = repos().conversation.update(id, title)
      return { success: true as const, data: result }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CHAT_DELETE_CONVERSATION, (_event, id: string) => {
    try {
      if (!id) {
        return { success: false as const, error: 'Conversation ID is required' }
      }
      const result = repos().conversation.delete(id)
      return { success: true as const, data: result }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CHAT_LIST_MESSAGES, (_event, conversationId: string) => {
    try {
      if (!conversationId) {
        return { success: false as const, error: 'Conversation ID is required' }
      }
      const messages = repos().message.list(conversationId)
      return { success: true as const, data: messages }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(
    IPC_CHANNELS.CHAT_SEND_MESSAGE,
    async (event, conversationId: string, content: string) => {
      try {
        if (!conversationId) {
          return { success: false as const, error: 'Conversation ID is required' }
        }
        if (!content || !content.trim()) {
          return { success: false as const, error: 'Message content is required' }
        }

        const { conversation: convRepo, message: msgRepo } = repos()

        const userMessage = msgRepo.create(conversationId, 'user', content.trim())

        const conversation = convRepo.get(conversationId)
        if (conversation && conversation.title === '新的对话') {
          convRepo.update(conversationId, content.trim().substring(0, 20))
        }

        const rawConfig = db().getSetting(`conversation-config:${conversationId}`)
        const config: ConversationConfig = rawConfig
          ? JSON.parse(rawConfig)
          : { agentId: null, modelId: null, skillIds: [] }

        const agentId = config.agentId || defaultAgentId
        const modelId = config.modelId || defaultModelId
        const skillIds = config.skillIds || []

        const messageId = randomUUID()
        const streamer = createStreamer(event.sender, conversationId, messageId)

        const request: ExecutionRequest = {
          conversationId,
          message: content.trim(),
          agentId,
          modelId,
          skillIds,
        }

        const abortController = new AbortController()
        activeExecutions.set(conversationId, abortController)

        engine.execute(request, streamer, abortController.signal).finally(() => {
          activeExecutions.delete(conversationId)
        })

        return { success: true as const, data: userMessage }
      } catch (error) {
        return { success: false as const, error: String(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_STREAM_EVENTS.CHAT_STREAM_ABORT,
    (_event, conversationId: string): IpcResult<true> => {
      const controller = activeExecutions.get(conversationId)
      if (controller) {
        controller.abort()
        activeExecutions.delete(conversationId)
        return { success: true, data: true }
      }
      return { success: false, error: 'No active execution' }
    },
  )

  ipcMain.handle(IPC_CHANNELS.CHAT_GET_ACTIVE_CONVERSATION, () => {
    try {
      const id = db().getActiveConversationId()
      return { success: true as const, data: id }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CHAT_SET_ACTIVE_CONVERSATION, (_event, id: string | null) => {
    try {
      db().setActiveConversationId(id)
      return { success: true as const, data: undefined }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  registerAgentHandlers(() => agentRegistry)
  registerSkillHandlers(() => skillManager)
  registerMcpHandlers(() => ({ repository: repos().mcpServer, manager: mcpManager }))

  // Model handlers
  ipcMain.handle(IPC_CHANNELS.MODEL_LIST_AVAILABLE, (): IpcResult<ModelInfo[]> => {
    try {
      const providers = db().listProviders()
      const models: ModelInfo[] = []
      for (const provider of providers) {
        if (!provider.enabled) continue
        for (const model of provider.models) {
          models.push({
            id: model,
            name: model,
            providerId: provider.id,
            providerName: provider.name,
          })
        }
        if (provider.defaultModel && !provider.models.includes(provider.defaultModel)) {
          models.push({
            id: provider.defaultModel,
            name: provider.defaultModel,
            providerId: provider.id,
            providerName: provider.name,
          })
        }
      }
      return { success: true, data: models }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Chat extension handlers
  ipcMain.handle(
    IPC_CHANNELS.CHAT_CREATE_WITH_CONFIG,
    (_event, params: CreateConversationWithConfigParams): IpcResult<Conversation> => {
      try {
        const conversation = repos().conversation.create(params.title)
        if (params.agentId || params.modelId || params.skillIds) {
          const config: ConversationConfig = {
            agentId: params.agentId ?? null,
            modelId: params.modelId ?? null,
            skillIds: params.skillIds ?? [],
          }
          db().setSetting(`conversation-config:${conversation.id}`, JSON.stringify(config))
        }
        return { success: true, data: conversation }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.CHAT_SWITCH_MODEL,
    (_event, conversationId: string, modelId: string): IpcResult<boolean> => {
      try {
        if (!conversationId) return { success: false, error: 'Conversation ID is required' }
        if (!modelId) return { success: false, error: 'Model ID is required' }
        const raw = db().getSetting(`conversation-config:${conversationId}`)
        const config: ConversationConfig = raw
          ? JSON.parse(raw)
          : { agentId: null, modelId: null, skillIds: [] }
        config.modelId = modelId
        db().setSetting(`conversation-config:${conversationId}`, JSON.stringify(config))
        return { success: true, data: true }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.CHAT_GET_CONFIG,
    (_event, conversationId: string): IpcResult<ConversationConfig> => {
      try {
        if (!conversationId) return { success: false, error: 'Conversation ID is required' }
        const raw = db().getSetting(`conversation-config:${conversationId}`)
        const config: ConversationConfig = raw
          ? JSON.parse(raw)
          : { agentId: null, modelId: null, skillIds: [] }
        return { success: true, data: config }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    },
  )
}
