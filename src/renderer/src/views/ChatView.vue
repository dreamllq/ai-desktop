<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useChatStore } from '@renderer/stores/chat'
import ChatLayout from '@renderer/components/chat/ChatLayout.vue'
import ChatHeader from '@renderer/components/chat/ChatHeader.vue'
import ChatMessageList from '@renderer/components/chat/ChatMessageList.vue'
import ChatInput from '@renderer/components/chat/ChatInput.vue'

const store = useChatStore()

let cleanupStreaming: (() => void) | null = null

onMounted(() => {
  store.initialize()
  cleanupStreaming = store.setupStreamingListeners()
})

onUnmounted(() => {
  cleanupStreaming?.()
})

function handleSend(content: string): void {
  store.sendMessage(content)
}
</script>

<template>
  <ChatLayout>
    <template #header>
      <ChatHeader v-if="store.currentConversationId" />
    </template>

    <div v-if="store.currentConversationId" class="flex flex-col h-full">
      <!-- Message Area -->
      <ChatMessageList
        :messages="store.currentMessages"
        :is-streaming="store.isStreaming"
        :streaming-content="store.streamingContent"
      />

      <!-- Input Area -->
      <ChatInput :disabled="store.sending" @send="handleSend" />
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center h-full text-center">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900">AI Desktop</h2>
        <p class="mt-2 text-gray-500">选择一个对话开始聊天，或创建新对话</p>
      </div>
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 text-sm font-medium transition-colors"
        @click="store.createConversationWithConfig()"
      >
        开始新对话
      </button>
    </div>
  </ChatLayout>
</template>
