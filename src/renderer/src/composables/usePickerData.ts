import { ref, computed } from 'vue'
import { useAgent } from './useAgent'
import { useModel } from './useModel'
import { useSkill } from './useSkill'
import { useChatStore } from '@renderer/stores/chat'
import type { AgentConfig, SkillConfig, ModelInfo } from '@shared/types'

export function usePickerData(): {
  availableModels: import('vue').ComputedRef<import('@shared/types').ModelInfo[]>
  availableAgents: import('vue').ComputedRef<import('@shared/types').AgentConfig[]>
  availableSkills: import('vue').ComputedRef<import('@shared/types').SkillConfig[]>
  currentConversationConfig: import('vue').ComputedRef<{
    agentId: string | null
    modelId: string | null
    skillIds: string[]
  }>
  loadAll: () => Promise<void>
  refreshModels: () => Promise<void>
  refreshAgents: () => Promise<void>
  refreshSkills: () => Promise<void>
} {
  const agentApi = useAgent()
  const modelApi = useModel()
  const skillApi = useSkill()
  const chatStore = useChatStore()

  const models = ref<ModelInfo[]>([])
  const agents = ref<AgentConfig[]>([])
  const skills = ref<SkillConfig[]>([])
  const loaded = ref(false)

  const availableModels = computed(() => models.value)
  const availableAgents = computed(() => agents.value)
  const availableSkills = computed(() => skills.value)

  const currentConversationConfig = computed(() => ({
    agentId: chatStore.selectedAgentId,
    modelId: chatStore.selectedModelId,
    skillIds: chatStore.selectedSkillIds,
  }))

  async function loadAll(): Promise<void> {
    if (loaded.value) return
    await Promise.all([refreshModels(), refreshAgents(), refreshSkills()])
    loaded.value = true
  }

  async function refreshModels(): Promise<void> {
    const result = await modelApi.listAvailableModels()
    if (result.success && result.data) {
      models.value = result.data
    }
  }

  async function refreshAgents(): Promise<void> {
    const result = await agentApi.listAgents()
    if (result.success && result.data) {
      agents.value = result.data
    }
  }

  async function refreshSkills(): Promise<void> {
    const result = await skillApi.listSkills()
    if (result.success && result.data) {
      skills.value = result.data.filter((s) => s.enabled)
    }
  }

  return {
    availableModels,
    availableAgents,
    availableSkills,
    currentConversationConfig,
    loadAll,
    refreshModels,
    refreshAgents,
    refreshSkills,
  }
}
