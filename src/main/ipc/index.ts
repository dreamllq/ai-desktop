import { ipcMain, app, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '@shared/types'
import type { AppInfo, LlmProviderCreate, LlmProviderUpdate } from '@shared/types'
import { DatabaseService } from '../database'
import { createSettingsWindow, createAboutWindow } from '../windows'
import { createLLMService } from '../services/llm-service'

function db(): DatabaseService {
  return DatabaseService.getInstance()
}

function repos() {
  return db().repositories
}

export function registerIpcHandlers(): void {
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
    async (_event, conversationId: string, content: string) => {
      try {
        if (!conversationId) {
          return { success: false as const, error: 'Conversation ID is required' }
        }
        if (!content || !content.trim()) {
          return { success: false as const, error: 'Message content is required' }
        }

        const { conversation: convRepo, message: msgRepo } = repos()

        msgRepo.create(conversationId, 'user', content.trim())

        const conversation = convRepo.get(conversationId)
        if (conversation && conversation.title === '新的对话') {
          const title = content.trim().substring(0, 20)
          convRepo.update(conversationId, title)
        }

        const messages = msgRepo.list(conversationId)

        const llmService = createLLMService()
        const llmMessages = messages
          .filter((m) => m.role !== 'tool')
          .map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }))
        const response = await llmService.sendMessage(conversationId, llmMessages)

        const assistantMessage = msgRepo.create(conversationId, 'assistant', response.content)

        return { success: true as const, data: assistantMessage }
      } catch (error) {
        return { success: false as const, error: String(error) }
      }
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
}
