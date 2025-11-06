/**
 * 🔐 Admin Auth Check API
 * ✅ SECURITY: Now requires authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { getEmployeeFromSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    // Check if employee is authenticated
    const employee = await getEmployeeFromSession(request)

    if (!employee) {
      return NextResponse.json(
        { authenticated: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if employee has admin role
    // Admin role ID should be checked here if needed
    // For now, any authenticated employee can access admin

    return NextResponse.json({
      authenticated: true,
      employee: {
        id: employee.id,
        email: employee.email,
        full_name: employee.full_name,
        role_id: employee.role_id,
      },
    })
  } catch (error: any) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Authentication check failed' },
      { status: 500 }
    )
  }
}
