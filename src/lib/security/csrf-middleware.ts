/**
 * 🛡️ CSRF Middleware
 * Validates CSRF tokens on state-changing requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateCSRFToken } from './csrf'

/**
 * Wrap API route handler with CSRF protection
 * Use for POST, PATCH, PUT, DELETE endpoints
 */
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Skip CSRF for GET/HEAD/OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return handler(request)
    }

    // Skip CSRF for webhook endpoints (they have their own verification)
    if (request.nextUrl.pathname.startsWith('/api/webhook/')) {
      return handler(request)
    }

    // Parse body to get CSRF token (if sent in body)
    let bodyToken: string | undefined

    try {
      const body = await request.json()
      bodyToken = body._csrf
      // Re-create request with parsed body attached
      ;(request as any).parsedBody = body
    } catch (error) {
      // Body is not JSON or empty, that's okay
    }

    // Validate CSRF token
    const isValid = validateCSRFToken(request, bodyToken)

    if (!isValid) {
      return NextResponse.json(
        {
          error: 'CSRF token validation failed',
          message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
        },
        { status: 403 }
      )
    }

    // CSRF valid, proceed with handler
    return handler(request)
  }
}
