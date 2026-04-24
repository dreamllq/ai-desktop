<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useMcpConfigStore } from '@renderer/stores/mcpConfig'
import type { McpServerConfig } from '@shared/types'

const props = defineProps<{
  showForm: (server?: McpServerConfig) => void
  showTools: (server: McpServerConfig) => void
}>()

const store = useMcpConfigStore()
const deletingId = ref<string | null>(null)
let statusInterval: ReturnType<typeof setInterval> | null = null

function confirmDelete(id: string): void {
  deletingId.value = id
}

function cancelDelete(): void {
  deletingId.value = null
}

async function executeDelete(id: string): Promise<void> {
  await store.removeServer(id)
  deletingId.value = null
}

function isBuiltIn(server: McpServerConfig): boolean {
  return server.source === 'built-in'
}

function getConfigDisplay(server: McpServerConfig): string {
  if (server.source === 'built-in') return '内置工具'
  if (server.transportType === 'stdio') {
    const cfg = server.config as { command: string; args: string[] }
    return `${cfg.command} ${cfg.args.join(' ')}`
  }
  return (server.config as { url: string }).url
}

function getStatusInfo(server: McpServerConfig): {
  label: string
  dotClass: string
  pillClass: string
} {
  const status = store.serverStatuses.get(server.id)
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

onMounted(() => {
  store.loadServers().then(() => {
    store.loadAllStatuses()
  })
  statusInterval = setInterval(() => {
    store.loadAllStatuses()
  }, 10000)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
    statusInterval = null
  }
})
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-medium text-gray-900">MCP 服务</h2>
        <p class="mt-1 text-sm text-gray-500">管理 MCP 服务连接配置</p>
      </div>
      <button
        class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        @click="props.showForm()"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        添加服务
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex items-center justify-center py-20">
      <svg class="h-6 w-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span class="ml-3 text-sm text-gray-500">加载中...</span>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
      <p class="text-sm text-red-700">{{ store.error }}</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="store.servers.length === 0"
      class="flex flex-col items-center justify-center py-16"
    >
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
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      </div>
      <p class="text-sm font-medium text-gray-900">还没有配置任何 MCP 服务</p>
      <p class="mt-1 text-xs text-gray-500">添加您的第一个 MCP 服务以开始使用</p>
      <button
        class="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        @click="props.showForm()"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        添加服务
      </button>
    </div>

    <!-- Server Cards -->
    <div v-else class="grid grid-cols-1 gap-4">
      <div
        v-for="server in store.servers"
        :key="server.id"
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <!-- Card Header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-gray-900">{{ server.name }}</h3>
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
            <!-- Built-in Badge -->
            <span
              v-if="isBuiltIn(server)"
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700"
            >
              内置
            </span>
            <!-- Connection Status Badge -->
            <span
              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="getStatusInfo(server).pillClass"
            >
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="getStatusInfo(server).dotClass"
              />
              {{ getStatusInfo(server).label }}
            </span>
          </div>
        </div>

        <!-- Card Metadata -->
        <div class="mt-3 space-y-1.5">
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
            <span class="truncate font-mono">{{ getConfigDisplay(server) }}</span>
          </div>
        </div>

        <!-- Delete Confirmation (inline) -->
        <div
          v-if="deletingId === server.id"
          class="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2.5"
        >
          <p class="text-xs text-red-700">确定要删除 "{{ server.name }}" 吗？此操作不可撤销。</p>
          <div class="mt-2 flex gap-2">
            <button
              class="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
              @click="executeDelete(server.id)"
            >
              确认删除
            </button>
            <button
              class="rounded-md bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 transition-colors hover:bg-gray-50"
              @click="cancelDelete"
            >
              取消
            </button>
          </div>
        </div>

        <!-- Card Actions -->
        <div v-else class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <div class="flex gap-2">
            <!-- Built-in server: View tools only -->
            <template v-if="isBuiltIn(server)">
              <button
                class="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                @click="props.showTools(server)"
              >
                查看工具
              </button>
            </template>
            <!-- User server: Full actions -->
            <template v-else>
              <button
                v-if="store.serverStatuses.get(server.id)?.connected"
                class="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                @click="store.stopServer(server.id)"
              >
                停止
              </button>
              <button
                v-else
                class="rounded-md px-2.5 py-1 text-xs font-medium text-green-600 transition-colors hover:bg-green-50"
                @click="store.startServer(server.id)"
              >
                启动
              </button>
              <button
                v-if="store.serverStatuses.get(server.id)?.connected"
                class="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                @click="props.showTools(server)"
              >
                工具
              </button>
              <button
                class="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                @click="props.showForm(server)"
              >
                编辑
              </button>
              <button
                class="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                @click="confirmDelete(server.id)"
              >
                删除
              </button>
            </template>
          </div>
          <!-- Toggle: only for user servers -->
          <label v-if="!isBuiltIn(server)" class="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              :checked="server.enabled"
              class="peer sr-only"
              @change="store.editServer(server.id, { enabled: !server.enabled })"
            />
            <div
              class="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-4"
            />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
