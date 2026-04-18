import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLlmConfig } from '../useLlmConfig'
import type {
  IpcResult,
  LlmProviderListItem,
  LlmProviderCreate,
  LlmProviderUpdate,
} from '@shared/types'

describe('useLlmConfig', () => {
  const mockProviders: LlmProviderListItem[] = [
    {
      id: 'test-id',
      name: 'Test Provider',
      enabled: true,
      baseUrl: 'https://api.test.com',
      apiPath: '/v1/chat/completions',
      maskedApiKey: 'sk-****6789',
      models: ['gpt-4'],
      defaultModel: 'gpt-4',
      defaultParams: {},
      proxy: '',
      timeout: 30000,
      customHeaders: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]

  const mockApi = {
    listProviders: vi.fn<() => Promise<IpcResult<LlmProviderListItem[]>>>(),
    getProvider: vi.fn<(id: string) => Promise<IpcResult<LlmProviderListItem>>>(),
    createProvider: vi.fn<(data: LlmProviderCreate) => Promise<IpcResult<string>>>(),
    updateProvider:
      vi.fn<(id: string, updates: LlmProviderUpdate) => Promise<IpcResult<boolean>>>(),
    deleteProvider: vi.fn<(id: string) => Promise<IpcResult<boolean>>>(),
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    mockApi.listProviders.mockResolvedValue({ success: true, data: mockProviders })
    mockApi.getProvider.mockResolvedValue({ success: true, data: mockProviders[0] })
    mockApi.createProvider.mockResolvedValue({ success: true, data: 'new-id' })
    mockApi.updateProvider.mockResolvedValue({ success: true, data: true })
    mockApi.deleteProvider.mockResolvedValue({ success: true, data: true })
    ;(window as unknown as Record<string, unknown>).api = mockApi
  })

  it('returns all LLM config methods', () => {
    const config = useLlmConfig()
    expect(config.listProviders).toBeTypeOf('function')
    expect(config.getProvider).toBeTypeOf('function')
    expect(config.createProvider).toBeTypeOf('function')
    expect(config.updateProvider).toBeTypeOf('function')
    expect(config.deleteProvider).toBeTypeOf('function')
  })

  it('listProviders calls window.api.listProviders', async () => {
    const config = useLlmConfig()
    const result = await config.listProviders()
    expect(mockApi.listProviders).toHaveBeenCalledOnce()
    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockProviders)
  })

  it('getProvider calls window.api.getProvider with id', async () => {
    const config = useLlmConfig()
    const result = await config.getProvider('test-id')
    expect(mockApi.getProvider).toHaveBeenCalledWith('test-id')
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Test Provider')
  })

  it('createProvider calls window.api.createProvider with data', async () => {
    const config = useLlmConfig()
    const data: LlmProviderCreate = { name: 'New', apiKey: 'sk-test' }
    const result = await config.createProvider(data)
    expect(mockApi.createProvider).toHaveBeenCalledWith(data)
    expect(result.success).toBe(true)
    expect(result.data).toBe('new-id')
  })

  it('updateProvider calls window.api.updateProvider with id and updates', async () => {
    const config = useLlmConfig()
    const updates: LlmProviderUpdate = { name: 'Updated' }
    const result = await config.updateProvider('test-id', updates)
    expect(mockApi.updateProvider).toHaveBeenCalledWith('test-id', updates)
    expect(result.success).toBe(true)
  })

  it('deleteProvider calls window.api.deleteProvider with id', async () => {
    const config = useLlmConfig()
    const result = await config.deleteProvider('test-id')
    expect(mockApi.deleteProvider).toHaveBeenCalledWith('test-id')
    expect(result.success).toBe(true)
  })

  it('propagates error responses from API', async () => {
    mockApi.listProviders.mockResolvedValue({ success: false, error: 'DB error' })
    const config = useLlmConfig()
    const result = await config.listProviders()
    expect(result.success).toBe(false)
    expect(result.error).toBe('DB error')
  })
})
