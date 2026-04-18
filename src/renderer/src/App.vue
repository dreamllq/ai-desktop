<script setup lang="ts">
import { useAppStore } from '@renderer/stores/app'

const store = useAppStore()
store.initialize()
</script>

<template>
  <RouterView />
</template>
