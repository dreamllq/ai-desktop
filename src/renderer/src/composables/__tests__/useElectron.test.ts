import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useElectron } from '../useElectron'

describe('useElectron', () => {
  const mockApi = {
    ping: vi.fn<() => Promise<string>>().mockResolvedValue('pong'),
    getAppInfo: vi.fn().mockResolvedValue({}),
    getSetting: vi.fn().mockResolvedValue(null),
    setSetting: vi.fn().mockResolvedValue(undefined),
    openSettings: vi.fn().mockResolvedValue(undefined),
    openAbout: vi.fn().mockResolvedValue(undefined),
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    mockApi.ping.mockResolvedValue('pong')
    mockApi.getAppInfo.mockResolvedValue({})
    mockApi.getSetting.mockResolvedValue(null)
    mockApi.setSetting.mockResolvedValue(undefined)
    mockApi.openSettings.mockResolvedValue(undefined)
    mockApi.openAbout.mockResolvedValue(undefined)
    ;(window as unknown as Record<string, unknown>).api = mockApi
  })

  it('returns api methods', () => {
    const electron = useElectron()
    expect(electron.ping).toBeTypeOf('function')
    expect(electron.getAppInfo).toBeTypeOf('function')
    expect(electron.getSetting).toBeTypeOf('function')
    expect(electron.setSetting).toBeTypeOf('function')
  })

  it('ping() calls window.api.ping()', async () => {
    const electron = useElectron()
    const result = await electron.ping()
    expect(mockApi.ping).toHaveBeenCalledOnce()
    expect(result).toBe('pong')
  })

  it('getSetting() calls window.api.getSetting with key', async () => {
    mockApi.getSetting.mockResolvedValue('dark')
    const electron = useElectron()
    const result = await electron.getSetting('theme')
    expect(mockApi.getSetting).toHaveBeenCalledWith('theme')
    expect(result).toBe('dark')
  })
})
