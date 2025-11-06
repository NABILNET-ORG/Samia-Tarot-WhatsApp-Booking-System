/**
 * 🔐 Employee Login API
 * Authenticate employees and create session
 * ✅ SECURITY: Rate limiting + account lockout
 */

import { NextRequest, NextResponse } from 'next/server'
import { loginEmployee, createEmployeeSession } from '@/lib/auth/session'
import { rateLimit, resetRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/auth/login - Employee login
 * Rate limit: 5 attempts per 15 minutes per IP
 * Lockout: 15 minutes after 5 failed attempts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Rate limit by IP (5 attempts per 15 minutes)
    const rateLimitResult = rateLimit(ip, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      lockoutDurationMs: 15 * 60 * 1000, // 15 minutes lockout
    })

    // Check if locked out
    if (rateLimitResult.isLocked) {
      const minutesRemaining = Math.ceil(
        ((rateLimitResult.lockedUntil || 0) - Date.now()) / 60000
      )
      return NextResponse.json(
        {
          error: 'Too many login attempts',
          message: `Account temporarily locked. Please try again in ${minutesRemaining} minute(s).`,
          lockedUntil: rateLimitResult.lockedUntil,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(((rateLimitResult.lockedUntil || 0) - Date.now()) / 1000)),
          },
        }
      )
    }

    // Check if rate limit exceeded
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Too many login attempts. Please try again later.',
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
          },
        }
      )
    }

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Attempt login
    const result = await loginEmployee(email, password)

    if (!result) {
      // Failed login - rate limit is already incremented
      return NextResponse.json(
        {
          error: 'Invalid email or password',
          remaining: rateLimitResult.remaining - 1,
        },
        {
          status: 401,
          headers: {
            'X-RateLimit-Remaining': String(rateLimitResult.remaining - 1),
          },
        }
      )
    }

    const { employee, token } = result

    // Successful login - reset rate limit for this IP
    resetRateLimit(ip)

    // Remove sensitive data
    const { password_hash, ...employeeData } = employee

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      employee: employeeData,
      token,
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed', message: error.message },
      { status: 500 }
    )
  }
}
