/**
 * 🔐 API Key Encryption
 * Encrypt/decrypt sensitive business API keys
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

// Encryption key from environment
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'default-key-replace-in-production-min-32-chars'

/**
 * Derive encryption key from master key + business ID
 * Each business has unique encryption key
 */
function deriveKey(businessId: string): Buffer {
  return crypto.pbkdf2Sync(
    MASTER_KEY,
    `business:${businessId}`,
    100000,
    KEY_LENGTH,
    'sha256'
  )
}

/**
 * Encrypt API key
 */
export function encryptApiKey(plaintext: string, businessId: string): string {
  try {
    const key = deriveKey(businessId)
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error: any) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt API key')
  }
}

/**
 * Decrypt API key
 */
export function decryptApiKey(encrypted: string, businessId: string): string {
  try {
    const parts = encrypted.split(':')

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const [ivHex, authTagHex, encryptedHex] = parts

    const key = deriveKey(businessId)
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error: any) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt API key')
  }
}

/**
 * Encrypt all business API keys before saving
 */
export function encryptBusinessKeys(business: any): any {
  const encrypted = { ...business }

  if (business.meta_access_token) {
    encrypted.meta_access_token_encrypted = encryptApiKey(business.meta_access_token, business.id)
    delete encrypted.meta_access_token
  }

  if (business.meta_app_secret) {
    encrypted.meta_app_secret_encrypted = encryptApiKey(business.meta_app_secret, business.id)
    delete encrypted.meta_app_secret
  }

  if (business.twilio_account_sid) {
    encrypted.twilio_account_sid_encrypted = encryptApiKey(business.twilio_account_sid, business.id)
    delete encrypted.twilio_account_sid
  }

  if (business.twilio_auth_token) {
    encrypted.twilio_auth_token_encrypted = encryptApiKey(business.twilio_auth_token, business.id)
    delete encrypted.twilio_auth_token
  }

  if (business.openai_api_key) {
    encrypted.openai_api_key_encrypted = encryptApiKey(business.openai_api_key, business.id)
    delete encrypted.openai_api_key
  }

  if (business.stripe_secret_key) {
    encrypted.stripe_secret_key_encrypted = encryptApiKey(business.stripe_secret_key, business.id)
    delete encrypted.stripe_secret_key
  }

  if (business.google_client_secret) {
    encrypted.google_client_secret_encrypted = encryptApiKey(business.google_client_secret, business.id)
    delete encrypted.google_client_secret
  }

  if (business.google_refresh_token) {
    encrypted.google_refresh_token_encrypted = encryptApiKey(business.google_refresh_token, business.id)
    delete encrypted.google_refresh_token
  }

  return encrypted
}

/**
 * Decrypt business API keys after loading
 */
export function decryptBusinessKeys(business: any): any {
  const decrypted = { ...business }

  try {
    if (business.meta_access_token_encrypted) {
      decrypted.meta_access_token = decryptApiKey(business.meta_access_token_encrypted, business.id)
    }

    if (business.meta_app_secret_encrypted) {
      decrypted.meta_app_secret = decryptApiKey(business.meta_app_secret_encrypted, business.id)
    }

    if (business.twilio_account_sid_encrypted) {
      decrypted.twilio_account_sid = decryptApiKey(business.twilio_account_sid_encrypted, business.id)
    }

    if (business.twilio_auth_token_encrypted) {
      decrypted.twilio_auth_token = decryptApiKey(business.twilio_auth_token_encrypted, business.id)
    }

    if (business.openai_api_key_encrypted) {
      decrypted.openai_api_key = decryptApiKey(business.openai_api_key_encrypted, business.id)
    }

    if (business.stripe_secret_key_encrypted) {
      decrypted.stripe_secret_key = decryptApiKey(business.stripe_secret_key_encrypted, business.id)
    }

    if (business.google_client_secret_encrypted) {
      decrypted.google_client_secret = decryptApiKey(business.google_client_secret_encrypted, business.id)
    }

    if (business.google_refresh_token_encrypted) {
      decrypted.google_refresh_token = decryptApiKey(business.google_refresh_token_encrypted, business.id)
    }
  } catch (error: any) {
    console.error('Failed to decrypt some business keys:', error.message)
  }

  return decrypted
}
