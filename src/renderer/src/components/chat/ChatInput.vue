<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [content: string]
}>()

const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function canSend(): boolean {
  return inputText.value.trim().length > 0 && !props.disabled
}

function handleSend(): void {
  if (!canSend()) return
  emit('send', inputText.value.trim())
  inputText.value = ''
  nextTick(() => adjustHeight())
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

function adjustHeight(): void {
  const textarea = textareaRef.value
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
}

function onInput(): void {
  adjustHeight()
}
</script>

<template>
  <div class="border-t border-gray-200 bg-white px-4 py-3">
    <div class="flex items-end gap-3">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-[120px]"
        placeholder="输入消息..."
        rows="1"
        :disabled="disabled"
        @keydown="handleKeydown"
        @input="onInput"
      ></textarea>
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        :disabled="!canSend()"
        @click="handleSend"
      >
        <svg
          v-if="disabled"
          class="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span v-else>发送</span>
      </button>
    </div>
  </div>
</template>
