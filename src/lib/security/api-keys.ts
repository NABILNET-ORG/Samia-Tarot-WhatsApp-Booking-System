/**
 * 🔐 API Key Management
 * Secure API key generation and validation
 */

import crypto from 'crypto'

/**
 * Generate a cryptographically secure API key
 * Format: prefix_randomBytes
 * Example: wh_sk_live_abc123def456...
 */
export function generateApiKey(prefix: string = 'sk'): string {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  const timestamp = Date.now().toString(36)
  return `wh_${prefix}_${timestamp}_${randomBytes}`
}

/**
 * Hash an API key for storage
 * Uses SHA-256 for one-way hashing
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(apiKey: string, hash: string): boolean {
  const computedHash = hashApiKey(apiKey)
  return crypto.timingSafeEqual(
    Buffer.from(computedHash),
    Buffer.from(hash)
  )
}

/**
 * Generate a secure internal API key for webhook processing
 * This should be stored in environment variables
 */
export function generateInternalApiKey(): string {
  return generateApiKey('internal')
}

/**
 * Validate internal API key from request headers
 */
export function validateInternalApiKey(providedKey: string | null): boolean {
  if (!providedKey) return false

  const validKey = process.env.INTERNAL_API_KEY
  if (!validKey) {
    console.error('❌ INTERNAL_API_KEY not set in environment')
    return false
  }

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedKey),
      Buffer.from(validKey)
    )
  } catch {
    return false
  }
}

/**
 * Middleware to validate internal API key
 */
export function requireInternalApiKey(
  request: Request
): { valid: boolean; error?: string } {
  const apiKey = request.headers.get('x-internal-api-key')

  if (!apiKey) {
    return {
      valid: false,
      error: 'Missing x-internal-api-key header'
    }
  }

  if (!validateInternalApiKey(apiKey)) {
    return {
      valid: false,
      error: 'Invalid API key'
    }
  }

  return { valid: true }
}

/**
 * Generate a new internal API key and print instructions
 * Run this script to generate a new key for .env
 */
export function generateNewInternalKey() {
  const newKey = generateInternalApiKey()
  console.log('\n🔑 New Internal API Key Generated:\n')
  console.log(newKey)
  console.log('\n📝 Add this to your .env file:')
  console.log(`INTERNAL_API_KEY=${newKey}`)
  console.log('\n⚠️  Store this securely and never commit to git!\n')
  return newKey
}
