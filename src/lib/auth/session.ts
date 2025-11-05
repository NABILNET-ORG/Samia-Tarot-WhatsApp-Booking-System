/**
 * 🔐 Employee Session Management
 * JWT-based authentication for multi-tenant system
 */

import { NextRequest } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase/client'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-secret-key-min-32-chars-long'
)

const SESSION_COOKIE_NAME = 'employee_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 // 7 days in seconds

export type EmployeeSession = {
  employeeId: string
  businessId: string
  email: string
  roleId: string
}

/**
 * Create JWT session token
 */
export async function createSessionToken(employee: EmployeeSession): Promise<string> {
  const token = await new SignJWT({ ...employee })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify and decode JWT session token
 */
export async function verifySessionToken(token: string): Promise<EmployeeSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as EmployeeSession
  } catch (error) {
    return null
  }
}

/**
 * Get employee from session cookie
 */
export async function getEmployeeFromSession(request: NextRequest): Promise<any | null> {
  try {
    // Get session token from cookie
    const cookieStore = cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!sessionToken) {
      return null
    }

    // Verify token
    const session = await verifySessionToken(sessionToken)

    if (!session) {
      return null
    }

    // Load full employee data
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', session.employeeId)
      .eq('is_active', true)
      .single()

    if (error || !employee) {
      return null
    }

    return employee
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}

/**
 * Create session after login
 */
export async function createEmployeeSession(employee: any): Promise<string> {
  const session: EmployeeSession = {
    employeeId: employee.id,
    businessId: employee.business_id,
    email: employee.email,
    roleId: employee.role_id,
  }

  const token = await createSessionToken(session)

  // Set cookie
  const cookieStore = cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  })

  // Update last login
  await supabaseAdmin
    .from('employees')
    .update({
      last_login_at: new Date().toISOString(),
      is_online: true,
    })
    .eq('id', employee.id)

  return token
}

/**
 * Destroy session (logout)
 */
export async function destroySession(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Login with email and password
 */
export async function loginEmployee(
  email: string,
  password: string
): Promise<{ employee: any; token: string } | null> {
  try {
    // Find employee
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error || !employee) {
      return null
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, employee.password_hash)

    if (!passwordValid) {
      return null
    }

    // Create session
    const token = await createEmployeeSession(employee)

    return { employee, token }
  } catch (error) {
    console.error('Login error:', error)
    return null
  }
}

/**
 * Hash password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
