import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../app'

describe('useAppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with correct default values', () => {
    const store = useAppStore()
    expect(store.appName).toBe('AI Desktop')
    expect(store.version).toBe('0.1.0')
    expect(store.isInitialized).toBe(false)
  })

  it('initialize() sets isInitialized to true', async () => {
    const store = useAppStore()
    expect(store.isInitialized).toBe(false)
    await store.initialize()
    expect(store.isInitialized).toBe(true)
  })
})
