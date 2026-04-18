<script setup lang="ts">
const navItems = [
  { path: '/', label: 'Home' },
  { path: '/settings', label: 'Settings' },
]
</script>

<template>
  <aside class="w-[200px] h-screen bg-slate-900 text-slate-300 flex flex-col">
    <div class="px-5 py-6">
      <h1 class="text-lg font-semibold text-white tracking-tight">AI Desktop</h1>
    </div>
    <nav class="flex-1 px-3">
      <ul class="space-y-1">
        <li v-for="item in navItems" :key="item.path">
          <router-link
            :to="item.path"
            class="block px-3 py-2 rounded-md text-sm transition-colors hover:bg-slate-800 hover:text-white [&.router-link-active]:bg-slate-800 [&.router-link-active]:text-white [&.router-link-exact-active]:bg-slate-800 [&.router-link-exact-active]:text-white"
          >
            {{ item.label }}
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>
