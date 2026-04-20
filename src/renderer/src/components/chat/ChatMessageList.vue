<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { Message } from '@shared/types'
import ChatMessageItem from './ChatMessageItem.vue'

const props = defineProps<{
  messages: Message[]
}>()

const containerRef = ref<HTMLElement | null>(null)

function scrollToBottom(): void {
  if (containerRef.value) {
    containerRef.value.scrollTop = containerRef.value.scrollHeight
  }
}

watch(
  () => props.messages.length,
  () => {
    nextTick(() => scrollToBottom())
  },
)
</script>

<template>
  <div ref="containerRef" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
    <ChatMessageItem v-for="msg in messages" :key="msg.id" :message="msg" />
  </div>
</template>
