import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DatabaseService } from '../index'

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp/test' },
}))

vi.mock('../../encryption', () => ({
  encryptApiKey: (key: string) => `enc:${key}`,
  decryptApiKey: (enc: string) => enc.replace('enc:', ''),
  maskApiKey: (key: string) =>
    key.length > 8 ? key.slice(0, 3) + '****' + key.slice(-4) : key.slice(0, 2) + '****',
}))

interface ProviderRow {
  id: string
  name: string
  enabled: number
  base_url: string
  api_path: string
  encrypted_key: string
  models: string
  default_model: string
  default_params: string
  proxy: string
  timeout: number
  custom_headers: string
  created_at: number
  updated_at: number
}

const store = new Map<string, ProviderRow>()

vi.mock('better-sqlite3', () => ({
  default: vi.fn(function (this: Record<string, unknown>) {
    function allRowsSorted(): ProviderRow[] {
      return Array.from(store.values()).sort((a, b) => b.created_at - a.created_at)
    }

    this.pragma = (stmt: string) => {
      if (stmt === 'user_version') return [{ user_version: 0 }]
      return []
    }
    this.exec = vi.fn()
    this.prepare = (sql: string) => {
      if (sql.includes('INSERT INTO llm_providers')) {
        return {
          run: (...args: unknown[]) => {
            const row: ProviderRow = {
              id: args[0] as string,
              name: args[1] as string,
              enabled: args[2] as number,
              base_url: args[3] as string,
              api_path: args[4] as string,
              encrypted_key: args[5] as string,
              models: args[6] as string,
              default_model: args[7] as string,
              default_params: args[8] as string,
              proxy: args[9] as string,
              timeout: args[10] as number,
              custom_headers: args[11] as string,
              created_at: args[12] as number,
              updated_at: args[13] as number,
            }
            store.set(row.id, row)
          },
        }
      }

      if (sql.includes('DELETE FROM llm_providers')) {
        return {
          run: (id: string) => {
            const existed = store.delete(id)
            return { changes: existed ? 1 : 0 }
          },
        }
      }

      if (sql.includes('UPDATE llm_providers')) {
        return {
          run: (...args: unknown[]) => {
            const id = args[args.length - 1] as string
            const row = store.get(id)
            if (!row) return { changes: 0 }
            const setClauses = sql.match(/SET (.+) WHERE/)?.[1].split(',') ?? []
            let argIdx = 0
            for (const clause of setClauses) {
              const col = clause.trim().split('=')[0].trim()
              ;(row as Record<string, unknown>)[col] = args[argIdx]
              argIdx++
            }
            return { changes: 1 }
          },
        }
      }

      if (sql.includes('ORDER BY created_at DESC')) {
        return { all: () => allRowsSorted() }
      }

      if (sql.includes('SELECT') && sql.includes('WHERE id = ?')) {
        return {
          get: (id: string) => store.get(id) ?? undefined,
        }
      }

      return { run: vi.fn(), get: vi.fn(() => undefined), all: vi.fn(() => []) }
    }
    this.close = vi.fn()
  }),
}))

function createService(): DatabaseService {
  ;(DatabaseService as unknown as Record<string, unknown>).instance = null
  return new DatabaseService(':memory:')
}

describe('DatabaseService LLM Provider CRUD', () => {
  beforeEach(() => {
    store.clear()
  })

  // ── Create ──

  describe('createProvider', () => {
    it('returns a UUID string', () => {
      const svc = createService()
      const id = svc.createProvider({ name: 'TestProvider', apiKey: 'sk-test' })
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    })

    it('throws if name is empty', () => {
      const svc = createService()
      expect(() => svc.createProvider({ name: '', apiKey: '' })).toThrow(
        'Provider name is required',
      )
    })

    it('throws if name is whitespace-only', () => {
      const svc = createService()
      expect(() => svc.createProvider({ name: '   ', apiKey: '' })).toThrow(
        'Provider name is required',
      )
    })

    it('throws if baseUrl is invalid', () => {
      const svc = createService()
      expect(() => svc.createProvider({ name: 'Bad', apiKey: '', baseUrl: 'not a url' })).toThrow(
        'Invalid baseUrl format',
      )
    })

    it('stores provider with normalized baseUrl', () => {
      const svc = createService()
      const id = svc.createProvider({
        name: 'SlashProvider',
        apiKey: 'key',
        baseUrl: 'https://api.example.com/',
      })
      const row = store.get(id)!
      expect(row.name).toBe('SlashProvider')
      expect(row.base_url).toBe('https://api.example.com')
      expect(row.encrypted_key).toBe('enc:key')
    })

    it('defaults enabled to true', () => {
      const svc = createService()
      const id = svc.createProvider({ name: 'DefaultEnabled', apiKey: '' })
      expect(store.get(id)!.enabled).toBe(1)
    })

    it('sets enabled to false when specified', () => {
      const svc = createService()
      const id = svc.createProvider({ name: 'Disabled', apiKey: '', enabled: false })
      expect(store.get(id)!.enabled).toBe(0)
    })

    it('stores custom timeout', () => {
      const svc = createService()
      const id = svc.createProvider({ name: 'Timeout', apiKey: '', timeout: 60000 })
      expect(store.get(id)!.timeout).toBe(60000)
    })
  })

  // ── List ──

  describe('listProviders', () => {
    it('returns empty array when no providers exist', () => {
      const svc = createService()
      expect(svc.listProviders()).toEqual([])
    })

    it('returns providers with masked API keys', () => {
      const svc = createService()
      svc.createProvider({ name: 'Masked', apiKey: 'sk-proj-abcdef1234567890' })
      const list = svc.listProviders()
      expect(list).toHaveLength(1)
      expect(list[0].maskedApiKey).toBe('sk-****7890')
      expect(list[0].name).toBe('Masked')
    })

    it('returns providers in store for listing', () => {
      const svc = createService()
      svc.createProvider({ name: 'First', apiKey: '' })
      svc.createProvider({ name: 'Second', apiKey: '' })
      const list = svc.listProviders()
      expect(list).toHaveLength(2)
      const names = list.map((p) => p.name)
      expect(names).toContain('First')
      expect(names).toContain('Second')
    })
  })

  // ── Get by ID ──

  describe('getProviderById', () => {
    it('returns null for non-existent id', () => {
      const svc = createService()
      expect(svc.getProviderById('non-existent')).toBeNull()
    })

    it('returns decrypted API key', () => {
      const svc = createService()
      const id = svc.createProvider({ name: 'Decrypted', apiKey: 'secret-key' })
      const provider = svc.getProviderById(id)
      expect(provider?.encryptedKey).toBe('secret-key')
    })

    it('returns full provider with all fields', () => {
      const svc = createService()
      const id = svc.createProvider({
        name: 'Full',
        apiKey: 'key',
        baseUrl: 'https://api.test.com',
        apiPath: '/v1/chat',
        models: ['gpt-4', 'gpt-3.5'],
        defaultModel: 'gpt-4',
        defaultParams: { temperature: 0.7 },
        proxy: 'http://proxy:8080',
        timeout: 45000,
        customHeaders: [{ key: 'X-Custom', value: 'test' }],
      })
      const provider = svc.getProviderById(id)
      expect(provider).toBeTruthy()
      expect(provider!.name).toBe('Full')
      expect(provider!.baseUrl).toBe('https://api.test.com')
      expect(provider!.apiPath).toBe('/v1/chat')
      expect(provider!.models).toEqual(['gpt-4', 'gpt-3.5'])
      expect(provider!.defaultModel).toBe('gpt-4')
      expect(provider!.defaultParams).toEqual({ temperature: 0.7 })
      expect(provider!.proxy).toBe('http://proxy:8080')
      expect(provider!.timeout).toBe(45000)
      expect(provider!.customHeaders).toEqual([{ key: 'X-Custom', value: 'test' }])
    })
  })

  // ── Get public (masked) ──

  describe('getProviderPublic', () => {
    it('returns null for non-existent id', () => {
      const svc = createService()
      expect(svc.getProviderPublic('non-existent')).toBeNull()
    })

    it('returns provider with masked API key', () => {
      const svc = createService()
      const id = svc.createProvider({ name: 'Public', apiKey: 'sk-testkey1234567890' })
      const publicProvider = svc.getProviderPublic(id)
      expect(publicProvider?.maskedApiKey).toBe('sk-****7890')
    })
  })

  // ── Update ──

  describe('updateProvider', () => {
    it('returns false for non-existent provider', () => {
      const svc = createService()
      expect(svc.updateProvider('non-existent', { name: 'X' })).toBe(false)
    })

    it('updates specified fields', () => {
      const svc = createService()
      const id = svc.createProvider({ name: 'Original', apiKey: '' })
      const updated = svc.updateProvider(id, { name: 'Updated', enabled: false })
      expect(updated).toBe(true)
      expect(store.get(id)!.name).toBe('Updated')
      expect(store.get(id)!.enabled).toBe(0)
    })

    it('throws if name is set to empty', () => {
      const svc = createService()
      const id = svc.createProvider({ name: 'Valid', apiKey: '' })
      expect(() => svc.updateProvider(id, { name: '' })).toThrow('Provider name cannot be empty')
    })

    it('returns false when no fields provided', () => {
      const svc = createService()
      const id = svc.createProvider({ name: 'NoUpdate', apiKey: '' })
      expect(svc.updateProvider(id, {})).toBe(false)
    })

    it('normalizes baseUrl on update', () => {
      const svc = createService()
      const id = svc.createProvider({
        name: 'URL',
        apiKey: '',
        baseUrl: 'https://api.test.com',
      })
      svc.updateProvider(id, { baseUrl: 'https://new.api.com/' })
      expect(store.get(id)!.base_url).toBe('https://new.api.com')
    })

    it('updates API key (re-encrypts)', () => {
      const svc = createService()
      const id = svc.createProvider({ name: 'Key', apiKey: 'old-key' })
      svc.updateProvider(id, { apiKey: 'new-key' })
      expect(store.get(id)!.encrypted_key).toBe('enc:new-key')
    })
  })

  // ── Delete ──

  describe('deleteProvider', () => {
    it('returns false for non-existent provider', () => {
      const svc = createService()
      expect(svc.deleteProvider('non-existent')).toBe(false)
    })

    it('removes provider from store', () => {
      const svc = createService()
      const id = svc.createProvider({ name: 'ToDelete', apiKey: '' })
      expect(store.has(id)).toBe(true)
      expect(svc.deleteProvider(id)).toBe(true)
      expect(store.has(id)).toBe(false)
    })

    it('returns true for successful deletion', () => {
      const svc = createService()
      const id = svc.createProvider({ name: 'Gone', apiKey: '' })
      expect(svc.deleteProvider(id)).toBe(true)
    })
  })
})
