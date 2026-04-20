<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { Message } from '@shared/types'
import ChatMessageItem from './ChatMessageItem.vue'

const props = defineProps<{
  messages: Message[]
  isStreaming?: boolean
  streamingContent?: string
}>()

const containerRef = ref<HTMLElement | null>(null)

let lastScrollTime = 0

function scrollToBottom(): void {
  if (containerRef.value) {
    containerRef.value.scrollTop = containerRef.value.scrollHeight
  }
}

function throttledScrollToBottom(): void {
  const now = Date.now()
  if (now - lastScrollTime >= 100) {
    lastScrollTime = now
    requestAnimationFrame(() => scrollToBottom())
  }
}

const streamingMessage = computed<Message>(() => ({
  id: '__streaming__',
  conversationId: '',
  role: 'assistant',
  content: props.streamingContent ?? '',
  createdAt: Date.now(),
}))

watch(
  () => props.messages.length,
  () => {
    nextTick(() => scrollToBottom())
  },
)

watch(
  () => props.streamingContent,
  () => {
    if (props.isStreaming) {
      throttledScrollToBottom()
    }
  },
)
</script>

<template>
  <div ref="containerRef" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
    <ChatMessageItem v-for="msg in messages" :key="msg.id" :message="msg" />
    <ChatMessageItem
      v-if="isStreaming"
      :key="'__streaming__'"
      :message="streamingMessage"
      :is-streaming="true"
      :streaming-content="streamingContent ?? ''"
    />
  </div>
</template>
