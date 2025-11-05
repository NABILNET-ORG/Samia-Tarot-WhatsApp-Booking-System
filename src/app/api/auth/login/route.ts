/**
 * 🔐 Employee Login API
 * Authenticate employees and create session
 */

import { NextRequest, NextResponse } from 'next/server'
import { loginEmployee, createEmployeeSession } from '@/lib/auth/session'

/**
 * POST /api/auth/login - Employee login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

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
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const { employee, token } = result

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
