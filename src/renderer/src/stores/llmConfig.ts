import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { LlmProviderCreate, LlmProviderListItem, LlmProviderUpdate } from '@shared/types'
import { useLlmConfig } from '@renderer/composables/useLlmConfig'

export const useLlmConfigStore = defineStore('llmConfig', () => {
  const providers = ref<LlmProviderListItem[]>([])
  const currentProvider = ref<LlmProviderListItem | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const encryptionWarning = ref(false)

  const llmApi = useLlmConfig()

  async function loadProviders(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const result = await llmApi.listProviders()
      if (result.success && result.data) {
        providers.value = result.data
      } else {
        error.value = result.error || 'Failed to load providers'
      }
    } catch (err) {
      error.value = String(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchProvider(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const result = await llmApi.getProvider(id)
      if (result.success && result.data) {
        currentProvider.value = result.data
      } else {
        error.value = result.error || 'Failed to load provider'
      }
    } catch (err) {
      error.value = String(err)
    } finally {
      loading.value = false
    }
  }

  async function addProvider(data: LlmProviderCreate): Promise<boolean> {
    error.value = null
    try {
      const result = await llmApi.createProvider(data)
      if (result.success && result.data) {
        await loadProviders()
        return true
      } else {
        error.value = result.error || 'Failed to create provider'
        return false
      }
    } catch (err) {
      error.value = String(err)
      return false
    }
  }

  async function editProvider(id: string, updates: LlmProviderUpdate): Promise<boolean> {
    error.value = null
    try {
      const result = await llmApi.updateProvider(id, updates)
      if (result.success) {
        await loadProviders()
        return true
      } else {
        error.value = result.error || 'Failed to update provider'
        return false
      }
    } catch (err) {
      error.value = String(err)
      return false
    }
  }

  async function removeProvider(id: string): Promise<boolean> {
    error.value = null
    try {
      const result = await llmApi.deleteProvider(id)
      if (result.success) {
        providers.value = providers.value.filter((p) => p.id !== id)
        if (currentProvider.value?.id === id) {
          currentProvider.value = null
        }
        return true
      } else {
        error.value = result.error || 'Failed to delete provider'
        return false
      }
    } catch (err) {
      error.value = String(err)
      return false
    }
  }

  return {
    providers,
    currentProvider,
    loading,
    error,
    encryptionWarning,
    loadProviders,
    fetchProvider,
    addProvider,
    editProvider,
    removeProvider,
  }
})
