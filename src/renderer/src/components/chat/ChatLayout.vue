<script setup lang="ts">
import ChatSidebar from './ChatSidebar.vue'
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden">
    <ChatSidebar />
    <main class="flex-1 overflow-hidden">
      <slot />
    </main>
  </div>
</template>
