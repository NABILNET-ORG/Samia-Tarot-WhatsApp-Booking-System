/**
 * 🛡️ CSRF Token API
 * Get CSRF token for form submissions
 */

import { NextResponse } from 'next/server'
import { setCSRFToken, getCSRFToken } from '@/lib/security/csrf'

/**
 * GET /api/csrf-token
 * Returns CSRF token (creates one if doesn't exist)
 */
export async function GET() {
  try {
    let token = getCSRFToken()

    if (!token) {
      token = setCSRFToken()
    }

    return NextResponse.json({ csrfToken: token })
  } catch (error: any) {
    console.error('CSRF token error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
