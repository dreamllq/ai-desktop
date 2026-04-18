import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    initialized: false,
  }),
  actions: {
    initialize(): void {
      this.initialized = true
    },
  },
})
