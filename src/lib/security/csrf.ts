/**
 * 🛡️ CSRF Protection
 * Cross-Site Request Forgery prevention
 */

import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const CSRF_TOKEN_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Set CSRF token in HTTP-only cookie
 */
export function setCSRFToken(): string {
  const token = generateCSRFToken()
  const cookieStore = cookies()

  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600, // 1 hour
    path: '/',
  })

  return token
}

/**
 * Get CSRF token from cookie
 */
export function getCSRFToken(): string | null {
  const cookieStore = cookies()
  return cookieStore.get(CSRF_TOKEN_NAME)?.value || null
}

/**
 * Validate CSRF token from request
 * Checks both header and body
 */
export function validateCSRFToken(request: NextRequest, bodyToken?: string): boolean {
  const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  if (!cookieToken) {
    console.warn('CSRF validation failed: No cookie token')
    return false
  }

  // Check header first (for API calls)
  if (headerToken && headerToken === cookieToken && headerToken.length === 64) {
    return true
  }

  // Check body (for form submissions)
  if (bodyToken && bodyToken === cookieToken && bodyToken.length === 64) {
    return true
  }

  console.warn('CSRF validation failed: Token mismatch or invalid')
  return false
}

/**
 * Rotate CSRF token (generate new one)
 * Call after successful form submission
 */
export function rotateCSRFToken(): string {
  return setCSRFToken()
}

/**
 * Delete CSRF token
 */
export function deleteCSRFToken(): void {
  const cookieStore = cookies()
  cookieStore.delete(CSRF_TOKEN_NAME)
}
