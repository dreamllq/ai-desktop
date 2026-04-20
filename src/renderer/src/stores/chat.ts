import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Conversation, Message, CreateConversationWithConfigParams } from '@shared/types'
import { useChat } from '@renderer/composables/useChat'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const currentConversationId = ref<string | null>(null)
  const messages = ref<Map<string, Message[]>>(new Map())
  const loading = ref(false)
  const sending = ref(false)
  const error = ref<string | null>(null)

  const streamingMessageId = ref<string | null>(null)
  const streamingContent = ref('')
  const isStreaming = ref(false)

  const selectedModelId = ref<string | null>(null)
  const selectedAgentId = ref<string | null>(null)
  const selectedSkillIds = ref<string[]>([])

  const chatApi = useChat()

  const currentConversation = computed(() => {
    if (!currentConversationId.value) return null
    return conversations.value.find((c) => c.id === currentConversationId.value) || null
  })

  const currentMessages = computed(() => {
    if (!currentConversationId.value) return []
    return messages.value.get(currentConversationId.value) || []
  })

  async function loadConversations(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const result = await chatApi.listConversations()
      if (result.success && result.data) {
        conversations.value = result.data
      } else {
        error.value = result.error || 'Failed to load conversations'
      }
    } catch (err) {
      error.value = String(err)
    } finally {
      loading.value = false
    }
  }

  async function loadMessages(conversationId: string): Promise<void> {
    if (messages.value.has(conversationId)) return
    try {
      const result = await chatApi.listMessages(conversationId)
      if (result.success && result.data) {
        messages.value.set(conversationId, result.data)
      }
    } catch (err) {
      error.value = String(err)
    }
  }

  async function createConversation(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const result = await chatApi.createConversation()
      if (result.success && result.data) {
        conversations.value.unshift(result.data)
        await switchConversation(result.data.id)
      } else {
        error.value = result.error || 'Failed to create conversation'
      }
    } catch (err) {
      error.value = String(err)
    } finally {
      loading.value = false
    }
  }

  async function switchConversation(id: string): Promise<void> {
    currentConversationId.value = id
    await loadMessages(id)
    await chatApi.setActiveConversation(id)
    try {
      const configResult = await chatApi.getConversationConfig(id)
      if (configResult.success && configResult.data) {
        selectedAgentId.value = configResult.data.agentId
        selectedModelId.value = configResult.data.modelId
        selectedSkillIds.value = configResult.data.skillIds
      }
    } catch {
      // Non-critical — conversation config is optional
    }
  }

  async function deleteConversation(id: string): Promise<void> {
    error.value = null
    try {
      const result = await chatApi.deleteConversation(id)
      if (result.success) {
        conversations.value = conversations.value.filter((c) => c.id !== id)
        messages.value.delete(id)
        if (currentConversationId.value === id) {
          currentConversationId.value =
            conversations.value.length > 0 ? conversations.value[0].id : null
          if (currentConversationId.value) {
            await loadMessages(currentConversationId.value)
            await chatApi.setActiveConversation(currentConversationId.value)
          }
        }
      } else {
        error.value = result.error || 'Failed to delete conversation'
      }
    } catch (err) {
      error.value = String(err)
    }
  }

  async function sendMessage(content: string): Promise<void> {
    if (!currentConversationId.value) return
    sending.value = true
    error.value = null
    isStreaming.value = true
    streamingContent.value = ''
    try {
      const result = await chatApi.sendMessage(currentConversationId.value, content)
      if (result.success && result.data) {
        streamingMessageId.value = result.data.id
      } else {
        error.value = result.error || 'Failed to send message'
        isStreaming.value = false
      }
    } catch (err) {
      error.value = String(err)
      isStreaming.value = false
    } finally {
      sending.value = false
    }
  }

  function setupStreamingListeners(): () => void {
    const unsubToken = window.streaming.onStreamToken((_event, data) => {
      if (data.conversationId === currentConversationId.value) {
        streamingContent.value += data.token
      }
    })

    const unsubEnd = window.streaming.onStreamEnd((_event, data) => {
      if (data.conversationId === currentConversationId.value) {
        isStreaming.value = false
        streamingMessageId.value = null
        if (currentConversationId.value) {
          chatApi.listMessages(currentConversationId.value).then((result) => {
            if (result.success && result.data && currentConversationId.value) {
              messages.value.set(currentConversationId.value, result.data)
            }
          })
        }
      }
    })

    const unsubError = window.streaming.onStreamError((_event, data) => {
      if (data.conversationId === currentConversationId.value) {
        error.value = data.error
        isStreaming.value = false
        streamingContent.value = ''
        streamingMessageId.value = null
      }
    })

    const unsubToolCall = window.streaming.onStreamToolCall(() => {})

    const unsubToolResult = window.streaming.onStreamToolResult(() => {})

    return () => {
      unsubToken()
      unsubEnd()
      unsubError()
      unsubToolCall()
      unsubToolResult()
    }
  }

  async function selectModel(modelId: string | null): Promise<void> {
    selectedModelId.value = modelId
    if (modelId && currentConversationId.value) {
      await chatApi.switchModel(currentConversationId.value, modelId)
    }
  }

  function selectAgent(agentId: string | null): void {
    selectedAgentId.value = agentId
  }

  function selectSkills(skillIds: string[]): void {
    selectedSkillIds.value = skillIds
  }

  async function abortStream(): Promise<void> {
    if (currentConversationId.value) {
      await window.streaming.abortStream(currentConversationId.value)
    }
    isStreaming.value = false
    streamingContent.value = ''
    streamingMessageId.value = null
  }

  async function createConversationWithConfig(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const params: CreateConversationWithConfigParams = {
        agentId: selectedAgentId.value ?? undefined,
        modelId: selectedModelId.value ?? undefined,
        skillIds: selectedSkillIds.value.length > 0 ? selectedSkillIds.value : undefined,
      }
      const result = await chatApi.createConversationWithConfig(params)
      if (result.success && result.data) {
        conversations.value.unshift(result.data)
        await switchConversation(result.data.id)
      } else {
        error.value = result.error || 'Failed to create conversation'
      }
    } catch (err) {
      error.value = String(err)
    } finally {
      loading.value = false
    }
  }

  async function initialize(): Promise<void> {
    await loadConversations()
    const activeResult = await chatApi.getActiveConversation()
    if (activeResult.success && activeResult.data) {
      await switchConversation(activeResult.data)
    }
  }

  return {
    conversations,
    currentConversationId,
    messages,
    loading,
    sending,
    error,
    currentConversation,
    currentMessages,
    streamingMessageId,
    streamingContent,
    isStreaming,
    selectedModelId,
    selectedAgentId,
    selectedSkillIds,
    loadConversations,
    loadMessages,
    createConversation,
    switchConversation,
    deleteConversation,
    sendMessage,
    initialize,
    setupStreamingListeners,
    selectModel,
    selectAgent,
    selectSkills,
    abortStream,
    createConversationWithConfig,
  }
})
