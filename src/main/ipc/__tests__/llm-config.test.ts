import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IPC_CHANNELS } from '@shared/types'
import type { LlmProviderCreate, LlmProviderUpdate } from '@shared/types'

// Mock DatabaseService methods
const mockListProviders = vi.fn()
const mockGetProviderPublic = vi.fn()
const mockCreateProvider = vi.fn()
const mockUpdateProvider = vi.fn()
const mockDeleteProvider = vi.fn()

vi.mock('../../database', () => ({
  DatabaseService: {
    getInstance: () => ({
      listProviders: mockListProviders,
      getProviderPublic: mockGetProviderPublic,
      createProvider: mockCreateProvider,
      updateProvider: mockUpdateProvider,
      deleteProvider: mockDeleteProvider,
      getSetting: vi.fn(),
      setSetting: vi.fn(),
    }),
  },
}))

vi.mock('../../windows', () => ({
  createAboutWindow: vi.fn(),
}))

// Capture registered handlers
const handlers = new Map<string, (...args: unknown[]) => unknown>()
vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler)
    },
  },
  app: { getName: () => 'Test', getVersion: () => '0.1.0' },
  BrowserWindow: { getAllWindows: () => [] },
}))

// Import after mocks are set up
import { registerIpcHandlers } from '../index'

describe('LLM IPC Handlers', () => {
  beforeEach(() => {
    handlers.clear()
    vi.clearAllMocks()
    registerIpcHandlers()
  })

  describe('LLM_LIST_PROVIDERS', () => {
    it('returns success with provider list', async () => {
      const mockData = [
        { id: '1', name: 'OpenAI', enabled: true },
        { id: '2', name: 'Anthropic', enabled: false },
      ]
      mockListProviders.mockReturnValue(mockData)

      const handler = handlers.get(IPC_CHANNELS.LLM_LIST_PROVIDERS)!
      const result = await handler({})

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockData)
      expect(mockListProviders).toHaveBeenCalledOnce()
    })

    it('returns failure when DatabaseService throws', async () => {
      mockListProviders.mockImplementation(() => {
        throw new Error('DB error')
      })

      const handler = handlers.get(IPC_CHANNELS.LLM_LIST_PROVIDERS)!
      const result = await handler({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error: DB error')
    })
  })

  describe('LLM_GET_PROVIDER', () => {
    it('returns success when provider found', async () => {
      const mockProvider = { id: '1', name: 'OpenAI', enabled: true }
      mockGetProviderPublic.mockReturnValue(mockProvider)

      const handler = handlers.get(IPC_CHANNELS.LLM_GET_PROVIDER)!
      const result = await handler({}, '1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockProvider)
      expect(mockGetProviderPublic).toHaveBeenCalledWith('1')
    })

    it('returns failure when provider not found', async () => {
      mockGetProviderPublic.mockReturnValue(null)

      const handler = handlers.get(IPC_CHANNELS.LLM_GET_PROVIDER)!
      const result = await handler({}, 'nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Provider not found')
    })

    it('returns failure when DatabaseService throws', async () => {
      mockGetProviderPublic.mockImplementation(() => {
        throw new Error('DB read error')
      })

      const handler = handlers.get(IPC_CHANNELS.LLM_GET_PROVIDER)!
      const result = await handler({}, '1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error: DB read error')
    })
  })

  describe('LLM_CREATE_PROVIDER', () => {
    const validData: LlmProviderCreate = {
      name: 'Test Provider',
      apiKey: 'sk-test-key',
      baseUrl: 'https://api.test.com',
    }

    it('returns failure when name is empty', async () => {
      const handler = handlers.get(IPC_CHANNELS.LLM_CREATE_PROVIDER)!

      const result = await handler({}, { ...validData, name: '' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Provider name is required')
    })

    it('returns failure when name is whitespace only', async () => {
      const handler = handlers.get(IPC_CHANNELS.LLM_CREATE_PROVIDER)!

      const result = await handler({}, { ...validData, name: '   ' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Provider name is required')
    })

    it('returns failure when data is null', async () => {
      const handler = handlers.get(IPC_CHANNELS.LLM_CREATE_PROVIDER)!

      const result = await handler({}, null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Provider name is required')
    })

    it('returns failure when baseUrl is invalid', async () => {
      const handler = handlers.get(IPC_CHANNELS.LLM_CREATE_PROVIDER)!

      const result = await handler({}, { ...validData, baseUrl: 'not-a-url' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid baseUrl format')
    })

    it('returns failure when timeout is not a positive number', async () => {
      const handler = handlers.get(IPC_CHANNELS.LLM_CREATE_PROVIDER)!

      const result = await handler({}, { ...validData, timeout: -1 })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Timeout must be a positive number')
    })

    it('returns failure when timeout is zero', async () => {
      const handler = handlers.get(IPC_CHANNELS.LLM_CREATE_PROVIDER)!

      const result = await handler({}, { ...validData, timeout: 0 })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Timeout must be a positive number')
    })

    it('returns success with id when valid data', async () => {
      mockCreateProvider.mockReturnValue('new-id')

      const handler = handlers.get(IPC_CHANNELS.LLM_CREATE_PROVIDER)!
      const result = await handler({}, validData)

      expect(result.success).toBe(true)
      expect(result.data).toBe('new-id')
      expect(mockCreateProvider).toHaveBeenCalledWith(validData)
    })

    it('returns success when baseUrl is undefined', async () => {
      mockCreateProvider.mockReturnValue('new-id')

      const handler = handlers.get(IPC_CHANNELS.LLM_CREATE_PROVIDER)!
      const dataNoUrl: LlmProviderCreate = { name: 'Test', apiKey: 'sk-key' }
      const result = await handler({}, dataNoUrl)

      expect(result.success).toBe(true)
      expect(result.data).toBe('new-id')
    })

    it('returns failure when DatabaseService throws', async () => {
      mockCreateProvider.mockImplementation(() => {
        throw new Error('DB write error')
      })

      const handler = handlers.get(IPC_CHANNELS.LLM_CREATE_PROVIDER)!
      const result = await handler({}, validData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error: DB write error')
    })
  })

  describe('LLM_UPDATE_PROVIDER', () => {
    const validUpdates: LlmProviderUpdate = { name: 'Updated Provider' }

    it('returns failure when id is empty', async () => {
      const handler = handlers.get(IPC_CHANNELS.LLM_UPDATE_PROVIDER)!

      const result = await handler({}, '', validUpdates)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Provider ID is required')
    })

    it('returns failure when name is empty string', async () => {
      const handler = handlers.get(IPC_CHANNELS.LLM_UPDATE_PROVIDER)!

      const result = await handler({}, '1', { name: '' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Provider name cannot be empty')
    })

    it('returns failure when name is whitespace only', async () => {
      const handler = handlers.get(IPC_CHANNELS.LLM_UPDATE_PROVIDER)!

      const result = await handler({}, '1', { name: '   ' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Provider name cannot be empty')
    })

    it('returns failure when baseUrl is invalid', async () => {
      const handler = handlers.get(IPC_CHANNELS.LLM_UPDATE_PROVIDER)!

      const result = await handler({}, '1', { baseUrl: 'bad-url' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid baseUrl format')
    })

    it('returns success when valid updates', async () => {
      mockUpdateProvider.mockReturnValue(true)

      const handler = handlers.get(IPC_CHANNELS.LLM_UPDATE_PROVIDER)!
      const result = await handler({}, '1', validUpdates)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockUpdateProvider).toHaveBeenCalledWith('1', validUpdates)
    })

    it('allows name to be undefined in updates', async () => {
      mockUpdateProvider.mockReturnValue(true)

      const handler = handlers.get(IPC_CHANNELS.LLM_UPDATE_PROVIDER)!
      const result = await handler({}, '1', { baseUrl: 'https://updated.com' })

      expect(result.success).toBe(true)
    })

    it('allows baseUrl to be empty string in updates', async () => {
      mockUpdateProvider.mockReturnValue(true)

      const handler = handlers.get(IPC_CHANNELS.LLM_UPDATE_PROVIDER)!
      const result = await handler({}, '1', { baseUrl: '' })

      expect(result.success).toBe(true)
    })

    it('returns failure when DatabaseService throws', async () => {
      mockUpdateProvider.mockImplementation(() => {
        throw new Error('DB update error')
      })

      const handler = handlers.get(IPC_CHANNELS.LLM_UPDATE_PROVIDER)!
      const result = await handler({}, '1', validUpdates)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error: DB update error')
    })
  })

  describe('LLM_DELETE_PROVIDER', () => {
    it('returns failure when id is empty', async () => {
      const handler = handlers.get(IPC_CHANNELS.LLM_DELETE_PROVIDER)!

      const result = await handler({}, '')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Provider ID is required')
    })

    it('returns success when valid id', async () => {
      mockDeleteProvider.mockReturnValue(true)

      const handler = handlers.get(IPC_CHANNELS.LLM_DELETE_PROVIDER)!
      const result = await handler({}, 'provider-1')

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockDeleteProvider).toHaveBeenCalledWith('provider-1')
    })

    it('returns failure when DatabaseService throws', async () => {
      mockDeleteProvider.mockImplementation(() => {
        throw new Error('DB delete error')
      })

      const handler = handlers.get(IPC_CHANNELS.LLM_DELETE_PROVIDER)!
      const result = await handler({}, '1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error: DB delete error')
    })
  })
})
