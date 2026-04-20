<script setup lang="ts">
import type { Message } from '@shared/types'
import ChatMarkdown from './ChatMarkdown.vue'
import ToolCallDisplay from './ToolCallDisplay.vue'

const props = defineProps<{
  message: Message
  isStreaming?: boolean
  streamingContent?: string
}>()

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="chat-bubble flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
    <div
      class="max-w-[80%]"
      :class="
        message.role === 'user'
          ? 'chat-bubble--user bg-blue-600 text-white rounded-2xl rounded-br-sm'
          : 'chat-bubble--assistant bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm'
      "
    >
      <div class="px-4 py-2.5">
        <div v-if="message.role === 'assistant'" class="text-sm">
          <ChatMarkdown :content="isStreaming ? (streamingContent ?? '') : message.content" />
          <span v-if="isStreaming" class="streaming-cursor inline-block text-blue-500">▍</span>
        </div>
        <p v-else class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
      </div>
      <div
        v-if="message.role === 'assistant' && message.toolCalls && message.toolCalls.length > 0"
        class="px-4 py-1 space-y-2"
      >
        <ToolCallDisplay
          v-for="tc in message.toolCalls"
          :key="tc.id"
          :tool-call="tc"
          :tool-result="null"
        />
      </div>
      <div v-if="!isStreaming" class="px-4 pb-1.5">
        <span class="text-xs opacity-50">{{ formatTime(message.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.streaming-cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}
</style>
