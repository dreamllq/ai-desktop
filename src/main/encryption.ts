import { safeStorage } from 'electron'

/**
 * Check if safeStorage encryption is available on this platform.
 * Returns false on Linux without a keyring/secret service.
 */
export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}

/**
 * Encrypt an API key using Electron safeStorage.
 * Falls back to Base64 encoding if safeStorage is unavailable.
 * @param plainKey - The plaintext API key to encrypt
 * @returns Base64-encoded encrypted string
 */
export function encryptApiKey(plainKey: string): string {
  if (!plainKey) return ''
  if (isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(plainKey)
    return encrypted.toString('base64')
  }
  // Fallback: encode as Base64 (not secure, but better than plaintext)
  console.warn('safeStorage unavailable — storing API key with BasicText encoding')
  return Buffer.from(plainKey, 'utf-8').toString('base64')
}

/**
 * Decrypt an API key that was encrypted with encryptApiKey.
 * @param encryptedBase64 - Base64-encoded encrypted string
 * @returns Decrypted plaintext API key
 */
export function decryptApiKey(encryptedBase64: string): string {
  if (!encryptedBase64) return ''
  if (isEncryptionAvailable()) {
    const buffer = Buffer.from(encryptedBase64, 'base64')
    return safeStorage.decryptString(buffer)
  }
  // Fallback: decode from Base64
  return Buffer.from(encryptedBase64, 'base64').toString('utf-8')
}

/**
 * Mask an API key for display in the UI.
 * Shows first 3 and last 4 characters, replaces the rest with ****.
 * Short keys (< 8 chars) get special handling.
 * @param key - The plaintext API key to mask
 * @returns Masked string like "sk-****7890"
 */
export function maskApiKey(key: string): string {
  if (!key) return ''
  if (key.length <= 8) {
    return key.slice(0, 2) + '****'
  }
  return key.slice(0, 3) + '****' + key.slice(-4)
}
