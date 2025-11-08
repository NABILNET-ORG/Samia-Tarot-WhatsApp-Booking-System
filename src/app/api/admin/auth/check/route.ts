/**
 * 🔐 Admin Auth Check API
 * ✅ SECURITY: Verifies admin/owner role
 */

import { NextRequest, NextResponse } from 'next/server'
import { getEmployeeFromSession } from '@/lib/auth/session'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    // SECURITY: Verify employee has admin or owner role
    const { data: employeeData } = await supabaseAdmin
      .from('employees')
      .select('roles(name)')
      .eq('id', employee.id)
      .single()

    const roleName = employeeData?.roles?.name?.toLowerCase() || ''

    if (!['admin', 'owner'].includes(roleName)) {
      return NextResponse.json(
        { authenticated: false, error: 'Admin or Owner role required' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      employee: {
        id: employee.id,
        email: employee.email,
        full_name: employee.full_name,
        role_id: employee.role_id,
        role_name: roleName,
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
