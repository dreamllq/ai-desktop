<script setup lang="ts">
import type { McpServerConfig } from '@shared/types'

defineProps<{
  server: McpServerConfig
  onBack: () => void
}>()
</script>

<template>
  <div>MCP Tools Panel</div>
</template>
