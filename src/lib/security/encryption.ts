/**
 * 🔐 Encryption Utilities
 * AES-256-GCM encryption for sensitive data
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_MASTER_KEY
  if (!key) {
    throw new Error('ENCRYPTION_MASTER_KEY not set in environment variables')
  }
  // Use first 32 bytes of the key
  return Buffer.from(key.slice(0, KEY_LENGTH * 2), 'utf8').subarray(0, KEY_LENGTH)
}

/**
 * Encrypt a string value
 * Returns base64 encoded string: iv:authTag:encrypted
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ''

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  // Combine iv:authTag:encrypted (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * Decrypt an encrypted string
 * Expects format: iv:authTag:encrypted (all base64)
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return ''

  try {
    const key = getEncryptionKey()
    const parts = encryptedData.split(':')

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const iv = Buffer.from(parts[0], 'base64')
    const authTag = Buffer.from(parts[1], 'base64')
    const encrypted = parts[2]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    return ''
  }
}

/**
 * Hash a value (one-way, for verification)
 */
export function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}
