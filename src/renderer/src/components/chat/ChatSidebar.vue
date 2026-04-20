<script setup lang="ts">
import { useChatStore } from '@renderer/stores/chat'

const store = useChatStore()

function handleCreate(): void {
  store.createConversationWithConfig()
}

function handleSelect(id: string): void {
  store.switchConversation(id)
}

function handleDelete(id: string): void {
  if (confirm('确定要删除这个对话吗？')) {
    store.deleteConversation(id)
  }
}

function openSettings(): void {
  window.api.openSettings()
}
</script>

<template>
  <aside class="w-[260px] h-screen bg-slate-900 text-slate-300 flex flex-col">
    <!-- Header -->
    <div class="px-4 py-4 flex items-center justify-between">
      <h1 class="text-lg font-semibold text-white tracking-tight">AI Desktop</h1>
    </div>
    <div class="px-3 pb-3">
      <button
        class="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        @click="handleCreate"
      >
        + 新对话
      </button>
    </div>

    <!-- Conversation List -->
    <nav class="flex-1 overflow-y-auto px-3">
      <ul v-if="store.conversations.length > 0" class="space-y-1">
        <li v-for="conv in store.conversations" :key="conv.id" class="group relative">
          <button
            class="w-full text-left px-3 py-2.5 rounded-md text-sm cursor-pointer transition-colors"
            :class="
              conv.id === store.currentConversationId
                ? 'bg-slate-800 text-white'
                : 'hover:bg-slate-800/50'
            "
            @click="handleSelect(conv.id)"
          >
            <span class="block truncate">{{ conv.title }}</span>
          </button>
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-opacity px-1"
            title="删除对话"
            @click.stop="handleDelete(conv.id)"
          >
            ×
          </button>
        </li>
      </ul>
      <p v-else class="text-xs text-slate-500 px-3 py-4 text-center">暂无对话，点击上方按钮开始</p>
    </nav>

    <!-- Footer -->
    <div class="px-3 pb-4">
      <button
        class="w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-slate-800 hover:text-white"
        @click="openSettings"
      >
        设置
      </button>
    </div>
  </aside>
</template>
