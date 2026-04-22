<script setup lang="ts">
import type { McpServerConfig } from '@shared/types'

defineProps<{
  showForm: (server?: McpServerConfig) => void
  showTools: (server: McpServerConfig) => void
}>()
</script>

<template>
  <div>MCP Server List</div>
</template>
