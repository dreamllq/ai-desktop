<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack(): void {
  router.push('/')
}

const menuItems = [
  {
    label: '通用',
    route: '/settings/general',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  },
  {
    label: '大模型配置',
    route: '/settings/llm',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`,
  },
]
</script>

<template>
  <div class="flex h-screen w-screen">
    <!-- Left outline navigation -->
    <aside class="w-[250px] flex flex-col bg-white border-r border-gray-200">
      <!-- Back button + title -->
      <div class="px-4 py-4 border-b border-gray-100">
        <button
          class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          @click="goBack"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span class="font-medium">设置</span>
        </button>
      </div>

      <!-- Menu items -->
      <nav class="flex-1 py-2">
        <router-link
          v-for="item in menuItems"
          :key="item.route"
          :to="item.route"
          class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors border-l-2 border-transparent [&.router-link-exact-active]:text-gray-900 [&.router-link-exact-active]:font-medium [&.router-link-exact-active]:border-gray-900"
        >
          <span v-html="item.icon" class="shrink-0" />
          {{ item.label }}
        </router-link>
      </nav>
    </aside>

    <!-- Right content area -->
    <div class="flex-1 overflow-auto bg-gray-50">
      <RouterView />
    </div>
  </div>
</template>
