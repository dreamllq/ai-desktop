<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@renderer/stores/app'
import AppLayout from '@renderer/components/layout/AppLayout.vue'

const route = useRoute()
const store = useAppStore()
store.initialize()

const showSidebar = computed(() => !route.path.startsWith('/settings'))
</script>

<template>
  <AppLayout v-if="showSidebar">
    <RouterView />
  </AppLayout>
  <RouterView v-else />
</template>
