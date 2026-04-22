import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { SkillConfig, SkillCreateParams, SkillUpdateParams } from '@shared/types'
import { useSkill } from '@renderer/composables/useSkill'

export const useSkillConfigStore = defineStore('skillConfig', () => {
  const skills = ref<SkillConfig[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const skillApi = useSkill()

  const builtInSkills = computed(() => skills.value.filter((s) => s.source === 'built-in'))
  const userSkills = computed(() => skills.value.filter((s) => s.source === 'user-defined'))

  async function loadSkills(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const result = await skillApi.listSkills()
      if (result.success && result.data) {
        skills.value = result.data
      } else {
        error.value = result.error || '加载技能列表失败'
      }
    } catch (err) {
      error.value = String(err)
    } finally {
      loading.value = false
    }
  }

  async function createNewSkill(params: SkillCreateParams): Promise<boolean> {
    error.value = null
    try {
      const result = await skillApi.createSkill(params)
      if (result.success) {
        await loadSkills()
        return true
      }
      error.value = result.error || '创建技能失败'
      return false
    } catch (err) {
      error.value = String(err)
      return false
    }
  }

  async function editSkill(id: string, params: SkillUpdateParams): Promise<boolean> {
    error.value = null
    try {
      const result = await skillApi.updateSkill(id, params)
      if (result.success) {
        await loadSkills()
        return true
      }
      error.value = result.error || '更新技能失败'
      return false
    } catch (err) {
      error.value = String(err)
      return false
    }
  }

  async function removeSkill(id: string): Promise<boolean> {
    error.value = null
    try {
      const result = await skillApi.deleteSkill(id)
      if (result.success) {
        skills.value = skills.value.filter((s) => s.id !== id)
        return true
      }
      error.value = result.error || '删除技能失败'
      return false
    } catch (err) {
      error.value = String(err)
      return false
    }
  }

  async function toggleSkill(id: string, enabled: boolean): Promise<boolean> {
    return editSkill(id, { enabled })
  }

  async function reloadAllSkills(): Promise<boolean> {
    error.value = null
    try {
      const result = await skillApi.reloadSkills()
      if (result.success) {
        await loadSkills()
        return true
      }
      error.value = result.error || '重新加载技能失败'
      return false
    } catch (err) {
      error.value = String(err)
      return false
    }
  }

  return {
    skills,
    loading,
    error,
    builtInSkills,
    userSkills,
    loadSkills,
    createNewSkill,
    editSkill,
    removeSkill,
    toggleSkill,
    reloadAllSkills,
  }
})
