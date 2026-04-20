<script setup lang="ts">
import type { Message } from '@shared/types'
import ChatMarkdown from './ChatMarkdown.vue'

defineProps<{
  message: Message
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
          <ChatMarkdown :content="message.content" />
        </div>
        <p v-else class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
      </div>
      <div class="px-4 pb-1.5">
        <span class="text-xs opacity-50">{{ formatTime(message.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>
