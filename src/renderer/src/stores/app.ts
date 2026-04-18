import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const appName = ref('AI Desktop')
  const version = ref('0.1.0')
  const isInitialized = ref(false)

  async function initialize(): Promise<void> {
    // Will use IPC in the future to fetch app info
    isInitialized.value = true
  }

  return { appName, version, isInitialized, initialize }
})
