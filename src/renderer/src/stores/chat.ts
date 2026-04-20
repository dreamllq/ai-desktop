import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Conversation, Message } from '@shared/types'
import { useChat } from '@renderer/composables/useChat'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const currentConversationId = ref<string | null>(null)
  const messages = ref<Map<string, Message[]>>(new Map())
  const loading = ref(false)
  const sending = ref(false)
  const error = ref<string | null>(null)

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
    try {
      const result = await chatApi.sendMessage(currentConversationId.value, content)
      if (result.success && result.data) {
        const msgsResult = await chatApi.listMessages(currentConversationId.value)
        if (msgsResult.success && msgsResult.data) {
          messages.value.set(currentConversationId.value, msgsResult.data)
        }

        const convResult = await chatApi.getConversation(currentConversationId.value)
        if (convResult.success && convResult.data) {
          const idx = conversations.value.findIndex((c) => c.id === currentConversationId.value)
          if (idx !== -1) {
            conversations.value[idx] = convResult.data
          }
        }
      } else {
        error.value = result.error || 'Failed to send message'
      }
    } catch (err) {
      error.value = String(err)
    } finally {
      sending.value = false
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
    loadConversations,
    loadMessages,
    createConversation,
    switchConversation,
    deleteConversation,
    sendMessage,
    initialize,
  }
})
