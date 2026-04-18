import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLlmConfigStore } from '../llmConfig'
import type {
  IpcResult,
  LlmProviderListItem,
  LlmProviderCreate,
  LlmProviderUpdate,
} from '@shared/types'

const mockProviders: LlmProviderListItem[] = [
  {
    id: 'id-1',
    name: 'Provider A',
    enabled: true,
    baseUrl: 'https://a.test.com',
    apiPath: '/v1/chat/completions',
    maskedApiKey: 'sk-****1111',
    models: [],
    defaultModel: '',
    defaultParams: {},
    proxy: '',
    timeout: 30000,
    customHeaders: [],
    createdAt: 1000,
    updatedAt: 1000,
  },
  {
    id: 'id-2',
    name: 'Provider B',
    enabled: false,
    baseUrl: 'https://b.test.com',
    apiPath: '/v1/chat/completions',
    maskedApiKey: 'sk-****2222',
    models: [],
    defaultModel: '',
    defaultParams: {},
    proxy: '',
    timeout: 30000,
    customHeaders: [],
    createdAt: 2000,
    updatedAt: 2000,
  },
]

describe('useLlmConfigStore', () => {
  const mockApi = {
    listProviders: vi.fn<() => Promise<IpcResult<LlmProviderListItem[]>>>(),
    getProvider: vi.fn<(id: string) => Promise<IpcResult<LlmProviderListItem>>>(),
    createProvider: vi.fn<(data: LlmProviderCreate) => Promise<IpcResult<string>>>(),
    updateProvider:
      vi.fn<(id: string, updates: LlmProviderUpdate) => Promise<IpcResult<boolean>>>(),
    deleteProvider: vi.fn<(id: string) => Promise<IpcResult<boolean>>>(),
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    mockApi.listProviders.mockResolvedValue({ success: true, data: mockProviders })
    mockApi.getProvider.mockResolvedValue({ success: true, data: mockProviders[0] })
    mockApi.createProvider.mockResolvedValue({ success: true, data: 'new-id' })
    mockApi.updateProvider.mockResolvedValue({ success: true, data: true })
    mockApi.deleteProvider.mockResolvedValue({ success: true, data: true })
    ;(window as unknown as Record<string, unknown>).api = mockApi
  })

  // ── Initial state ──

  it('initializes with correct default values', () => {
    const store = useLlmConfigStore()
    expect(store.providers).toEqual([])
    expect(store.currentProvider).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.encryptionWarning).toBe(false)
  })

  // ── loadProviders ──

  describe('loadProviders', () => {
    it('populates providers on success', async () => {
      const store = useLlmConfigStore()
      await store.loadProviders()
      expect(store.providers).toEqual(mockProviders)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('sets error when API returns failure', async () => {
      mockApi.listProviders.mockResolvedValue({ success: false, error: 'DB failure' })
      const store = useLlmConfigStore()
      await store.loadProviders()
      expect(store.error).toBe('DB failure')
      expect(store.providers).toEqual([])
    })

    it('sets error on exception', async () => {
      mockApi.listProviders.mockRejectedValue(new Error('Network error'))
      const store = useLlmConfigStore()
      await store.loadProviders()
      expect(store.error).toBeTruthy()
      expect(store.loading).toBe(false)
    })

    it('manages loading state', async () => {
      let resolvePromise: (value: IpcResult<LlmProviderListItem[]>) => void
      const pending = new Promise<IpcResult<LlmProviderListItem[]>>((resolve) => {
        resolvePromise = resolve
      })
      mockApi.listProviders.mockReturnValue(pending)

      const store = useLlmConfigStore()
      const loadPromise = store.loadProviders()
      expect(store.loading).toBe(true)

      resolvePromise!({ success: true, data: mockProviders })
      await loadPromise
      expect(store.loading).toBe(false)
    })
  })

  // ── fetchProvider ──

  describe('fetchProvider', () => {
    it('sets currentProvider on success', async () => {
      const store = useLlmConfigStore()
      await store.fetchProvider('id-1')
      expect(store.currentProvider).toEqual(mockProviders[0])
    })

    it('sets error on API failure', async () => {
      mockApi.getProvider.mockResolvedValue({ success: false, error: 'Not found' })
      const store = useLlmConfigStore()
      await store.fetchProvider('bad-id')
      expect(store.error).toBe('Not found')
      expect(store.currentProvider).toBeNull()
    })
  })

  // ── addProvider ──

  describe('addProvider', () => {
    it('creates provider and reloads list', async () => {
      const store = useLlmConfigStore()
      const data: LlmProviderCreate = { name: 'New', apiKey: 'sk-test' }
      const result = await store.addProvider(data)
      expect(result).toBe(true)
      expect(mockApi.createProvider).toHaveBeenCalledWith(data)
      expect(mockApi.listProviders).toHaveBeenCalled()
    })

    it('returns false and sets error on failure', async () => {
      mockApi.createProvider.mockResolvedValue({ success: false, error: 'Validation error' })
      const store = useLlmConfigStore()
      const result = await store.addProvider({ name: 'Bad', apiKey: '' })
      expect(result).toBe(false)
      expect(store.error).toBe('Validation error')
    })
  })

  // ── editProvider ──

  describe('editProvider', () => {
    it('updates provider and reloads list', async () => {
      const store = useLlmConfigStore()
      const updates: LlmProviderUpdate = { name: 'Updated' }
      const result = await store.editProvider('id-1', updates)
      expect(result).toBe(true)
      expect(mockApi.updateProvider).toHaveBeenCalledWith('id-1', updates)
      expect(mockApi.listProviders).toHaveBeenCalled()
    })

    it('returns false on failure', async () => {
      mockApi.updateProvider.mockResolvedValue({ success: false, error: 'Not found' })
      const store = useLlmConfigStore()
      const result = await store.editProvider('bad-id', { name: 'X' })
      expect(result).toBe(false)
      expect(store.error).toBe('Not found')
    })
  })

  // ── removeProvider ──

  describe('removeProvider', () => {
    it('removes provider from state', async () => {
      const store = useLlmConfigStore()
      await store.loadProviders()
      expect(store.providers).toHaveLength(2)

      const result = await store.removeProvider('id-1')
      expect(result).toBe(true)
      expect(store.providers).toHaveLength(1)
      expect(store.providers[0].id).toBe('id-2')
    })

    it('clears currentProvider if it matches deleted id', async () => {
      const store = useLlmConfigStore()
      await store.loadProviders()
      await store.fetchProvider('id-1')
      expect(store.currentProvider).toBeTruthy()

      await store.removeProvider('id-1')
      expect(store.currentProvider).toBeNull()
    })

    it('returns false and sets error on failure', async () => {
      mockApi.deleteProvider.mockResolvedValue({ success: false, error: 'Cannot delete' })
      const store = useLlmConfigStore()
      const result = await store.removeProvider('non-existent')
      expect(result).toBe(false)
      expect(store.error).toBe('Cannot delete')
    })
  })
})
