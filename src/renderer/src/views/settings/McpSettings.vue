<script setup lang="ts">
import { ref } from 'vue'
import McpServerList from '@renderer/components/mcp/McpServerList.vue'
import McpServerForm from '@renderer/components/mcp/McpServerForm.vue'
import McpToolsPanel from '@renderer/components/mcp/McpToolsPanel.vue'
import type { McpServerConfig } from '@shared/types'

const view = ref<'list' | 'form' | 'tools'>('list')
const editingServer = ref<McpServerConfig | undefined>()
const toolsServer = ref<McpServerConfig | undefined>()

function showForm(server?: McpServerConfig): void {
  editingServer.value = server
  view.value = 'form'
}

function showTools(server: McpServerConfig): void {
  toolsServer.value = server
  view.value = 'tools'
}

function showList(): void {
  view.value = 'list'
  editingServer.value = undefined
  toolsServer.value = undefined
}
</script>

<template>
  <div class="h-full">
    <McpServerList v-if="view === 'list'" :show-form="showForm" :show-tools="showTools" />
    <McpServerForm
      v-else-if="view === 'form'"
      :server="editingServer"
      :on-cancel="showList"
      :on-saved="showList"
    />
    <McpToolsPanel v-else-if="view === 'tools'" :server="toolsServer!" :on-back="showList" />
  </div>
</template>
