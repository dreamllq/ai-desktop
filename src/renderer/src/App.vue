<script setup lang="ts">
import { useAppStore } from '@renderer/stores/app'
import AppLayout from '@renderer/components/layout/AppLayout.vue'

const store = useAppStore()
store.initialize()
</script>

<template>
  <AppLayout>
    <RouterView />
  </AppLayout>
</template>
