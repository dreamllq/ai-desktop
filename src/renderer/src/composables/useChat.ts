import type {
  IpcResult,
  Conversation,
  Message,
  CreateConversationWithConfigParams,
  ConversationConfig,
} from '@shared/types'

export function useChat(): {
  listConversations: () => Promise<IpcResult<Conversation[]>>
  getConversation: (id: string) => Promise<IpcResult<Conversation | null>>
  createConversation: (title?: string) => Promise<IpcResult<Conversation>>
  updateConversation: (id: string, title: string) => Promise<IpcResult<boolean>>
  deleteConversation: (id: string) => Promise<IpcResult<boolean>>
  listMessages: (conversationId: string) => Promise<IpcResult<Message[]>>
  sendMessage: (conversationId: string, content: string) => Promise<IpcResult<Message>>
  getActiveConversation: () => Promise<IpcResult<string | null>>
  setActiveConversation: (id: string | null) => Promise<IpcResult<void>>
  createConversationWithConfig: (
    params: CreateConversationWithConfigParams,
  ) => Promise<IpcResult<Conversation>>
  switchModel: (conversationId: string, modelId: string) => Promise<IpcResult<boolean>>
  getConversationConfig: (conversationId: string) => Promise<IpcResult<ConversationConfig>>
} {
  async function listConversations(): Promise<IpcResult<Conversation[]>> {
    return window.api.listConversations()
  }

  async function getConversation(id: string): Promise<IpcResult<Conversation | null>> {
    return window.api.getConversation(id)
  }

  async function createConversation(title?: string): Promise<IpcResult<Conversation>> {
    return window.api.createConversation(title)
  }

  async function updateConversation(id: string, title: string): Promise<IpcResult<boolean>> {
    return window.api.updateConversation(id, title)
  }

  async function deleteConversation(id: string): Promise<IpcResult<boolean>> {
    return window.api.deleteConversation(id)
  }

  async function listMessages(conversationId: string): Promise<IpcResult<Message[]>> {
    return window.api.listMessages(conversationId)
  }

  async function sendMessage(conversationId: string, content: string): Promise<IpcResult<Message>> {
    return window.api.sendMessage(conversationId, content)
  }

  async function getActiveConversation(): Promise<IpcResult<string | null>> {
    return window.api.getActiveConversation()
  }

  async function setActiveConversation(id: string | null): Promise<IpcResult<void>> {
    return window.api.setActiveConversation(id)
  }

  async function createConversationWithConfig(
    params: CreateConversationWithConfigParams,
  ): Promise<IpcResult<Conversation>> {
    return window.api.createConversationWithConfig(params)
  }

  async function switchModel(conversationId: string, modelId: string): Promise<IpcResult<boolean>> {
    return window.api.switchModel(conversationId, modelId)
  }

  async function getConversationConfig(
    conversationId: string,
  ): Promise<IpcResult<ConversationConfig>> {
    return window.api.getConversationConfig(conversationId)
  }

  return {
    listConversations,
    getConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    listMessages,
    sendMessage,
    getActiveConversation,
    setActiveConversation,
    createConversationWithConfig,
    switchModel,
    getConversationConfig,
  }
}
