/**
 * 🛡️ Rate Limiting Utility
 * Prevents brute force attacks and API abuse
 */

type RateLimitStore = {
  [key: string]: {
    count: number
    resetTime: number
    lockedUntil?: number
  }
}

// In-memory store (use Redis in production for multi-instance deployments)
const store: RateLimitStore = {}

export type RateLimitConfig = {
  maxAttempts: number      // Max requests allowed
  windowMs: number         // Time window in milliseconds
  lockoutDurationMs?: number // How long to lock after max attempts exceeded
}

export type RateLimitResult = {
  success: boolean
  remaining: number
  resetTime: number
  isLocked: boolean
  lockedUntil?: number
}

/**
 * Rate limit by IP address or identifier
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const entry = store[identifier]

  // Check if currently locked out
  if (entry?.lockedUntil && entry.lockedUntil > now) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      isLocked: true,
      lockedUntil: entry.lockedUntil,
    }
  }

  // Initialize or reset if window expired
  if (!entry || entry.resetTime < now) {
    store[identifier] = {
      count: 1,
      resetTime: now + config.windowMs,
    }

    return {
      success: true,
      remaining: config.maxAttempts - 1,
      resetTime: now + config.windowMs,
      isLocked: false,
    }
  }

  // Increment count
  entry.count++

  // Check if exceeded limit
  if (entry.count > config.maxAttempts) {
    // Apply lockout if configured
    if (config.lockoutDurationMs) {
      entry.lockedUntil = now + config.lockoutDurationMs
    }

    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      isLocked: true,
      lockedUntil: entry.lockedUntil,
    }
  }

  return {
    success: true,
    remaining: config.maxAttempts - entry.count,
    resetTime: entry.resetTime,
    isLocked: false,
  }
}

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 */
export function resetRateLimit(identifier: string): void {
  delete store[identifier]
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(identifier: string): RateLimitResult | null {
  const entry = store[identifier]
  if (!entry) return null

  const now = Date.now()

  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      isLocked: true,
      lockedUntil: entry.lockedUntil,
    }
  }

  if (entry.resetTime < now) {
    delete store[identifier]
    return null
  }

  return {
    success: entry.count < 5, // Assuming max 5 attempts
    remaining: Math.max(0, 5 - entry.count),
    resetTime: entry.resetTime,
    isLocked: false,
  }
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const key in store) {
    const entry = store[key]
    if (entry.resetTime < now && (!entry.lockedUntil || entry.lockedUntil < now)) {
      delete store[key]
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000)
}
