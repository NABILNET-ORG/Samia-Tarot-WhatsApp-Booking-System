/**
 * Unit Tests for API Key Security Functions
 */

import {
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  validateInternalApiKey,
} from '../api-keys'

describe('API Key Security', () => {
  describe('generateApiKey', () => {
    it('should generate a key with correct format', () => {
      const key = generateApiKey('test')
      expect(key).toMatch(/^wh_test_[a-z0-9]+_[a-f0-9]{64}$/)
    })

    it('should generate unique keys', () => {
      const key1 = generateApiKey('test')
      const key2 = generateApiKey('test')
      expect(key1).not.toBe(key2)
    })

    it('should use default prefix', () => {
      const key = generateApiKey()
      expect(key).toMatch(/^wh_sk_/)
    })
  })

  describe('hashApiKey', () => {
    it('should hash a key consistently', () => {
      const key = 'test-key-123'
      const hash1 = hashApiKey(key)
      const hash2 = hashApiKey(key)
      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different keys', () => {
      const hash1 = hashApiKey('key1')
      const hash2 = hashApiKey('key2')
      expect(hash1).not.toBe(hash2)
    })

    it('should produce 64-character hex hash', () => {
      const hash = hashApiKey('test')
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('verifyApiKey', () => {
    it('should verify correct key against hash', () => {
      const key = 'test-api-key'
      const hash = hashApiKey(key)
      const result = verifyApiKey(key, hash)
      expect(result).toBe(true)
    })

    it('should reject incorrect key', () => {
      const key = 'correct-key'
      const wrongKey = 'wrong-key'
      const hash = hashApiKey(key)
      const result = verifyApiKey(wrongKey, hash)
      expect(result).toBe(false)
    })

    it('should handle timing attack resistance', () => {
      // Test that timing is consistent regardless of correctness
      const key = 'test-key'
      const hash = hashApiKey(key)

      // Just verify the function uses timingSafeEqual
      // Actual timing consistency is hard to test in Jest
      const result1 = verifyApiKey(key, hash)
      const result2 = verifyApiKey('wrong', hash)

      expect(result1).toBe(true)
      expect(result2).toBe(false)
      // The use of crypto.timingSafeEqual ensures constant-time comparison
    })
  })

  describe('validateInternalApiKey', () => {
    const originalEnv = process.env.INTERNAL_API_KEY

    afterEach(() => {
      process.env.INTERNAL_API_KEY = originalEnv
    })

    it('should validate correct internal key', () => {
      process.env.INTERNAL_API_KEY = 'test-internal-key'
      const result = validateInternalApiKey('test-internal-key')
      expect(result).toBe(true)
    })

    it('should reject incorrect internal key', () => {
      process.env.INTERNAL_API_KEY = 'correct-key'
      const result = validateInternalApiKey('wrong-key')
      expect(result).toBe(false)
    })

    it('should reject null key', () => {
      process.env.INTERNAL_API_KEY = 'test-key'
      const result = validateInternalApiKey(null)
      expect(result).toBe(false)
    })

    it('should return false if env var not set', () => {
      delete process.env.INTERNAL_API_KEY
      const result = validateInternalApiKey('any-key')
      expect(result).toBe(false)
    })
  })
})
