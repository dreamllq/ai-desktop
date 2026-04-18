<script setup lang="ts">
const tabs = [
  { label: '通用', route: '/settings/general' },
  { label: '大模型配置', route: '/settings/llm' },
]
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <!-- Tab navigation -->
    <div class="flex border-b border-gray-200 bg-white">
      <router-link
        v-for="tab in tabs"
        :key="tab.route"
        :to="tab.route"
        class="px-5 py-3 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 border-b-2 border-transparent [&.router-link-active]:text-blue-600 [&.router-link-active]:border-blue-600"
      >
        {{ tab.label }}
      </router-link>
    </div>
    <!-- Content area for nested routes -->
    <div class="flex-1 overflow-auto">
      <RouterView />
    </div>
  </div>
</template>
