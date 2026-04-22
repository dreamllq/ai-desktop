<script setup lang="ts">
import type { McpServerConfig } from '@shared/types'

defineProps<{
  server?: McpServerConfig
  onCancel: () => void
  onSaved: () => void
}>()
</script>

<template>
  <div>MCP Server Form</div>
</template>
