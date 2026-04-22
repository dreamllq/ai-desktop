<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMcpConfigStore } from '@renderer/stores/mcpConfig'
import { useMcp } from '@renderer/composables/useMcp'
import type { McpServerConfig, McpToolDefinition } from '@shared/types'

const props = defineProps<{
  server: McpServerConfig
  onBack: () => void
}>()

const store = useMcpConfigStore()
const tools = ref<McpToolDefinition[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const expandedSchemas = ref<Set<string>>(new Set())

function getConfigDisplay(): string {
  if (props.server.transportType === 'stdio') {
    const cfg = props.server.config as { command: string; args: string[] }
    return `${cfg.command} ${cfg.args.join(' ')}`
  }
  return (props.server.config as { url: string }).url
}

function getStatusInfo(): { label: string; dotClass: string; pillClass: string } {
  const status = store.serverStatuses.get(props.server.id)
  if (!status) {
    return { label: '已断开', dotClass: 'bg-gray-400', pillClass: 'bg-gray-100 text-gray-500' }
  }
  if (status.connected) {
    return { label: '已连接', dotClass: 'bg-green-500', pillClass: 'bg-green-50 text-green-700' }
  }
  if (status.error) {
    return { label: '错误', dotClass: 'bg-red-500', pillClass: 'bg-red-50 text-red-700' }
  }
  return { label: '已断开', dotClass: 'bg-gray-400', pillClass: 'bg-gray-100 text-gray-500' }
}

function toggleSchema(toolName: string): void {
  if (expandedSchemas.value.has(toolName)) {
    expandedSchemas.value.delete(toolName)
  } else {
    expandedSchemas.value.add(toolName)
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const result = await useMcp().listMcpTools(props.server.id)
    if (result.success && result.data) {
      tools.value = result.data
    } else {
      error.value = result.error || '获取工具列表失败'
    }
  } catch (err) {
    error.value = String(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-gray-200 bg-white px-5 py-3">
      <button
        class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        @click="props.onBack()"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回列表
      </button>
      <h2 class="text-sm font-medium text-gray-900">工具列表 — {{ server.name }}</h2>
    </div>

    <!-- Server Status Summary -->
    <div class="border-b border-gray-200 bg-gray-50 p-4">
      <div class="flex items-center gap-3">
        <!-- Transport Badge -->
        <span
          class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          :class="
            server.transportType === 'stdio'
              ? 'bg-green-50 text-green-700'
              : 'bg-blue-50 text-blue-700'
          "
        >
          {{ server.transportType }}
        </span>
        <!-- Connection Status -->
        <span
          class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          :class="getStatusInfo().pillClass"
        >
          <span
            class="h-1.5 w-1.5 rounded-full"
            :class="getStatusInfo().dotClass"
          />
          {{ getStatusInfo().label }}
        </span>
        <!-- Config Display -->
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <svg
            class="h-3.5 w-3.5 shrink-0 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span class="truncate font-mono">{{ getConfigDisplay() }}</span>
        </div>
      </div>
    </div>

    <!-- Tool List -->
    <div class="p-4">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <svg class="h-6 w-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span class="ml-3 text-sm text-gray-500">加载工具列表中...</span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <p class="text-sm text-red-700">获取工具列表失败: {{ error }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="tools.length === 0" class="flex flex-col items-center justify-center py-16">
        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            class="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-900">该服务暂无可用工具</p>
        <p class="mt-1 text-xs text-gray-500">请确认服务已正确连接并提供了工具</p>
      </div>

      <!-- Tool Cards -->
      <div v-else class="space-y-3">
        <div
          v-for="tool in tools"
          :key="tool.name"
          class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div class="flex items-start justify-between">
            <div class="min-w-0 flex-1">
              <h3 class="font-mono text-sm font-medium text-gray-900">{{ tool.name }}</h3>
              <p class="mt-1 text-sm text-gray-500">{{ tool.description }}</p>
            </div>
            <button
              class="ml-3 shrink-0 text-xs text-blue-600 transition-colors hover:text-blue-800"
              @click="toggleSchema(tool.name)"
            >
              {{ expandedSchemas.has(tool.name) ? '收起 Schema' : '查看 Schema' }}
            </button>
          </div>
          <!-- Collapsible Schema -->
          <div v-show="expandedSchemas.has(tool.name)" class="mt-3">
            <pre class="overflow-x-auto rounded-md bg-gray-50 p-3 text-xs font-mono text-gray-700"><code>{{ JSON.stringify(tool.inputSchema, null, 2) }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
