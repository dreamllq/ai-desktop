<script setup lang="ts">
import ChatSidebar from './ChatSidebar.vue'
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden">
    <ChatSidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
      <slot name="header" />
      <main class="flex-1 overflow-hidden">
        <slot />
      </main>
    </div>
  </div>
</template>
