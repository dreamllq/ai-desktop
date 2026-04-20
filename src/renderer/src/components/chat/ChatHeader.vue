<script setup lang="ts">
import { useChatStore } from '@renderer/stores/chat'
import type { usePickerData } from '@renderer/composables/usePickerData'
import ModelSelector from './ModelSelector.vue'
import AgentSelector from './AgentSelector.vue'

const store = useChatStore()

const props = defineProps<{
  picker: ReturnType<typeof usePickerData>
}>()

function handleModelSelect(modelId: string): void {
  store.selectModel(modelId)
}

function handleAgentSelect(agentId: string | null): void {
  store.selectAgent(agentId)
}
</script>

<template>
  <header class="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2">
    <!-- Agent Selector -->
    <AgentSelector
      :model-value="store.selectedAgentId"
      :agents="props.picker.availableAgents.value"
      @update:model-value="handleAgentSelect"
    />

    <!-- Divider -->
    <div class="h-5 w-px bg-gray-200"></div>

    <!-- Model Selector -->
    <ModelSelector
      :model-value="store.selectedModelId"
      :models="props.picker.availableModels.value"
      @update:model-value="handleModelSelect"
    />

    <!-- Divider -->
    <div class="h-5 w-px bg-gray-200"></div>

    <!-- Conversation title -->
    <div class="flex-1 truncate text-sm text-gray-600">
      {{ store.currentConversation?.title || '' }}
    </div>

    <!-- Skill badges -->
    <div v-if="store.selectedSkillIds.length > 0" class="flex gap-1">
      <span
        v-for="skillId in store.selectedSkillIds"
        :key="skillId"
        class="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
      >
        {{ skillId }}
      </span>
    </div>
  </header>
</template>
