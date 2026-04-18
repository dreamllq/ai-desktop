<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useLlmConfigStore } from '@renderer/stores/llmConfig'
import type { LlmProviderListItem } from '@shared/types'

const props = defineProps<{
  showForm: (provider?: LlmProviderListItem) => void
}>()

const store = useLlmConfigStore()
const deletingId = ref<string | null>(null)

function confirmDelete(id: string): void {
  deletingId.value = id
}

function cancelDelete(): void {
  deletingId.value = null
}

async function executeDelete(id: string): Promise<void> {
  await store.removeProvider(id)
  deletingId.value = null
}

onMounted(() => {
  store.loadProviders()
})
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-medium text-gray-900">大模型提供商</h2>
        <p class="mt-1 text-sm text-gray-500">管理大模型提供商的连接配置</p>
      </div>
      <button
        class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        @click="props.showForm()"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        添加提供商
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
      v-else-if="store.providers.length === 0"
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
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <p class="text-sm font-medium text-gray-900">还没有配置任何大模型提供商</p>
      <p class="mt-1 text-xs text-gray-500">添加您的第一个大模型提供商以开始使用</p>
      <button
        class="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        @click="props.showForm()"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        添加提供商
      </button>
    </div>

    <!-- Provider Cards -->
    <div v-else class="grid grid-cols-1 gap-4">
      <div
        v-for="provider in store.providers"
        :key="provider.id"
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <!-- Card Header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-gray-900">{{ provider.name }}</h3>
            <span
              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="provider.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'"
            >
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="provider.enabled ? 'bg-green-500' : 'bg-gray-400'"
              />
              {{ provider.enabled ? '已启用' : '已禁用' }}
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
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"
              />
            </svg>
            <span class="truncate font-mono">{{ provider.baseUrl }}</span>
          </div>
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
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>{{ provider.defaultModel }}</span>
          </div>
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <span class="font-mono">{{ provider.maskedApiKey }}</span>
          </div>
        </div>

        <!-- Delete Confirmation (inline) -->
        <div
          v-if="deletingId === provider.id"
          class="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2.5"
        >
          <p class="text-xs text-red-700">确定要删除 "{{ provider.name }}" 吗？此操作不可撤销。</p>
          <div class="mt-2 flex gap-2">
            <button
              class="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
              @click="executeDelete(provider.id)"
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
            <button
              class="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
              @click="props.showForm(provider)"
            >
              编辑
            </button>
            <button
              class="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              @click="confirmDelete(provider.id)"
            >
              删除
            </button>
          </div>
          <label class="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              :checked="provider.enabled"
              class="peer sr-only"
              @change="store.editProvider(provider.id, { enabled: !provider.enabled })"
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
