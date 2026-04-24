<script setup lang="ts">
import { ref } from 'vue'
import LlmProviderList from '@renderer/components/llm/LlmProviderList.vue'
import LlmProviderForm from '@renderer/components/llm/LlmProviderForm.vue'
import type { LlmProviderListItem } from '@shared/types'

const view = ref<'list' | 'form'>('list')
const editingProvider = ref<LlmProviderListItem | undefined>()

function showForm(provider?: LlmProviderListItem): void {
  editingProvider.value = provider
  view.value = 'form'
}

function showList(): void {
  view.value = 'list'
  editingProvider.value = undefined
}
</script>

<template>
  <div class="h-full">
    <LlmProviderList v-if="view === 'list'" :show-form="showForm" />
    <LlmProviderForm
      v-else
      :provider="editingProvider"
      :on-cancel="showList"
      :on-saved="showList"
    />
  </div>
</template>
