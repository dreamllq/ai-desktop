import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (str: string) => Buffer.from(`encrypted:${str}`),
    decryptString: (buf: Buffer) => {
      const str = buf.toString()
      return str.replace('encrypted:', '')
    },
  },
}))

import { encryptApiKey, decryptApiKey, maskApiKey, isEncryptionAvailable } from '../encryption'

describe('encryption', () => {
  describe('isEncryptionAvailable', () => {
    it('returns true when safeStorage is available', () => {
      expect(isEncryptionAvailable()).toBe(true)
    })
  })

  describe('encryptApiKey', () => {
    it('returns empty string for empty input', () => {
      expect(encryptApiKey('')).toBe('')
    })

    it('returns a base64-encoded string', () => {
      const result = encryptApiKey('test-key')
      expect(result).toBeTruthy()
      expect(() => Buffer.from(result, 'base64')).not.toThrow()
    })

    it('produces a value that round-trips through decryptApiKey', () => {
      const original = 'sk-proj-abcdef1234567890'
      const encrypted = encryptApiKey(original)
      const decrypted = decryptApiKey(encrypted)
      expect(decrypted).toBe(original)
    })
  })

  describe('decryptApiKey', () => {
    it('returns empty string for empty input', () => {
      expect(decryptApiKey('')).toBe('')
    })

    it('decrypts an encrypted key back to plaintext', () => {
      const encrypted = encryptApiKey('my-secret-key')
      expect(decryptApiKey(encrypted)).toBe('my-secret-key')
    })
  })

  describe('maskApiKey', () => {
    it('returns empty string for empty input', () => {
      expect(maskApiKey('')).toBe('')
    })

    it('masks a long key showing first 3 and last 4 chars', () => {
      expect(maskApiKey('sk-proj-abcdef1234567890')).toBe('sk-****7890')
    })

    it('masks short keys (<=8 chars) showing first 2 chars', () => {
      expect(maskApiKey('short')).toBe('sh****')
    })

    it('masks an 8-char key with short-key logic', () => {
      expect(maskApiKey('12345678')).toBe('12****')
    })

    it('masks a 9-char key with long-key logic', () => {
      expect(maskApiKey('123456789')).toBe('123****6789')
    })
  })
})

describe('encryption fallback (safeStorage unavailable)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('falls back to base64 when safeStorage is unavailable', async () => {
    vi.doMock('electron', () => ({
      safeStorage: {
        isEncryptionAvailable: () => false,
        encryptString: () => {
          throw new Error('not available')
        },
        decryptString: () => {
          throw new Error('not available')
        },
      },
    }))

    const { encryptApiKey: enc, decryptApiKey: dec } = await import('../encryption')
    const plainKey = 'fallback-test-key'
    const encrypted = enc(plainKey)
    expect(Buffer.from(encrypted, 'base64').toString('utf-8')).toBe(plainKey)
    expect(dec(encrypted)).toBe(plainKey)
  })
})
