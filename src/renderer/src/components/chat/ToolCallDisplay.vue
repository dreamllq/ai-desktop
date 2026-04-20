<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ToolCall, ToolResult } from '@shared/types'

const props = defineProps<{
  toolCall: ToolCall
  toolResult: ToolResult | null
}>()

const isExpanded = ref(false)

function toggleExpand(): void {
  isExpanded.value = !isExpanded.value
}

const status = computed<'running' | 'success' | 'error'>(() => {
  if (!props.toolResult) return 'running'
  return props.toolResult.isError ? 'error' : 'success'
})

const statusIcon = computed(() => {
  if (status.value === 'running') return '⏳'
  return status.value === 'success' ? '✓' : '✗'
})

const argsSummary = computed(() => {
  const entries = Object.entries(props.toolCall.arguments)
  if (entries.length === 0) return ''
  const str = entries
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(', ')
  return str.length > 80 ? str.slice(0, 77) + '...' : str
})

function formatJson(obj: Record<string, unknown>): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}
</script>

<template>
  <div
    class="rounded-lg border transition-colors"
    :class="{
      'border-yellow-200 bg-yellow-50/50': status === 'running',
      'border-green-200 bg-green-50/50': status === 'success',
      'border-red-200 bg-red-50/50': status === 'error',
    }"
  >
    <!-- Collapsed header -->
    <div class="flex cursor-pointer items-center gap-2 px-3 py-2 select-none" @click="toggleExpand">
      <span
        class="text-sm"
        :class="{
          'text-yellow-600': status === 'running',
          'text-green-600': status === 'success',
          'text-red-600': status === 'error',
        }"
        >{{ statusIcon }}</span
      >
      <span class="text-sm font-semibold text-gray-800">{{ toolCall.name }}</span>
      <span v-if="argsSummary" class="flex-1 truncate text-xs text-gray-500">
        {{ argsSummary }}
      </span>
      <svg
        class="h-4 w-4 shrink-0 text-gray-400 transition-transform"
        :class="{ 'rotate-90': isExpanded }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>

    <!-- Expanded content -->
    <div v-if="isExpanded" class="border-t border-gray-200 p-3">
      <!-- Input arguments -->
      <div class="mb-2">
        <div class="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Input</div>
        <pre
          class="max-h-[200px] overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-xs text-gray-800"
          style="font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"
          >{{ formatJson(toolCall.arguments) }}</pre
        >
      </div>

      <!-- Output -->
      <div v-if="toolResult">
        <div class="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Output</div>
        <pre
          class="max-h-[200px] overflow-auto whitespace-pre-wrap rounded p-2 text-xs"
          :class="toolResult.isError ? 'bg-red-50 text-red-600' : 'bg-white text-gray-800'"
          style="font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"
          >{{ toolResult.output }}</pre
        >
      </div>
    </div>
  </div>
</template>
