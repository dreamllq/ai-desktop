import { ipcMain, app, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '@shared/types'
import type { AppInfo, LlmProviderCreate, LlmProviderUpdate } from '@shared/types'
import { DatabaseService } from '../database'
import { createSettingsWindow, createAboutWindow } from '../windows'
import { createLLMService } from '../services/llm-service'

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
    return DatabaseService.getInstance().getSetting(key)
  })

  ipcMain.handle(IPC_CHANNELS.SET_SETTING, (_event, key: string, value: string): void => {
    DatabaseService.getInstance().setSetting(key, value)
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
      const providers = DatabaseService.getInstance().listProviders()
      return { success: true as const, data: providers }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.LLM_GET_PROVIDER, (_event, id: string) => {
    try {
      const provider = DatabaseService.getInstance().getProviderPublic(id)
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
      const id = DatabaseService.getInstance().createProvider(data)
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
        const result = DatabaseService.getInstance().updateProvider(id, updates)
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
      const result = DatabaseService.getInstance().deleteProvider(id)
      return { success: true as const, data: result }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  // Chat handlers
  ipcMain.handle(IPC_CHANNELS.CHAT_LIST_CONVERSATIONS, () => {
    try {
      const conversations = DatabaseService.getInstance().listConversations()
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
      const conversation = DatabaseService.getInstance().getConversation(id)
      return { success: true as const, data: conversation }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CHAT_CREATE_CONVERSATION, (_event, title?: string) => {
    try {
      const conversation = DatabaseService.getInstance().createConversation(title)
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
      const result = DatabaseService.getInstance().updateConversation(id, title)
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
      const result = DatabaseService.getInstance().deleteConversation(id)
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
      const messages = DatabaseService.getInstance().listMessages(conversationId)
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

        const db = DatabaseService.getInstance()

        // Save user message
        db.createMessage(conversationId, 'user', content.trim())

        // Check if this is the first user message - update conversation title
        const conversation = db.getConversation(conversationId)
        if (conversation && conversation.title === '新的对话') {
          const title = content.trim().substring(0, 20)
          db.updateConversation(conversationId, title)
        }

        // Get all messages for LLM context
        const messages = db.listMessages(conversationId)

        // Call LLM service
        const llmService = createLLMService()
        const llmMessages = messages.map((m) => ({ role: m.role, content: m.content }))
        const response = await llmService.sendMessage(conversationId, llmMessages)

        // Save AI response
        const assistantMessage = db.createMessage(conversationId, 'assistant', response.content)

        return { success: true as const, data: assistantMessage }
      } catch (error) {
        return { success: false as const, error: String(error) }
      }
    },
  )

  ipcMain.handle(IPC_CHANNELS.CHAT_GET_ACTIVE_CONVERSATION, () => {
    try {
      const id = DatabaseService.getInstance().getActiveConversationId()
      return { success: true as const, data: id }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CHAT_SET_ACTIVE_CONVERSATION, (_event, id: string | null) => {
    try {
      DatabaseService.getInstance().setActiveConversationId(id)
      return { success: true as const, data: undefined }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })
}
