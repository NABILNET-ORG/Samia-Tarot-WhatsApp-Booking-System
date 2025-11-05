/**
 * 👥 Employee Management API
 * Invite, list, and manage employees
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'
import { hashPassword } from '@/lib/auth/session'

/**
 * GET /api/employees - List employees in business
 */
export async function GET(request: NextRequest) {
  return requirePermission(request, 'employees', 'list', async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const active = searchParams.get('active')

      let query = supabaseAdmin
        .from('employees')
        .select(`
          *,
          roles (
            id,
            name,
            permissions_json
          )
        `)
        .eq('business_id', context.business.id)
        .order('created_at', { ascending: false })

      if (active === 'true') {
        query = query.eq('is_active', true)
      }

      const { data: employees, error } = await query

      if (error) throw error

      // Remove password hashes from response
      const sanitized = employees.map((emp: any) => {
        const { password_hash, ...rest } = emp
        return rest
      })

      return NextResponse.json({ employees: sanitized })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch employees', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/employees - Invite new employee
 */
export async function POST(request: NextRequest) {
  return requirePermission(request, 'employees', 'create', async (context) => {
    try {
      const body = await request.json()
      const {
        email,
        full_name,
        role_id,
        temporary_password,
        custom_permissions_json,
      } = body

      // Validate required fields
      if (!email || !full_name || !role_id || !temporary_password) {
        return NextResponse.json(
          { error: 'Missing required fields: email, full_name, role_id, temporary_password' },
          { status: 400 }
        )
      }

      // Check if email already exists in this business
      const { data: existing } = await supabaseAdmin
        .from('employees')
        .select('id')
        .eq('email', email)
        .eq('business_id', context.business.id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Employee with this email already exists' },
          { status: 409 }
        )
      }

      // Hash password
      const password_hash = await hashPassword(temporary_password)

      // Create employee
      const { data: employee, error } = await supabaseAdmin
        .from('employees')
        .insert({
          business_id: context.business.id,
          email,
          full_name,
          role_id,
          password_hash,
          custom_permissions_json: custom_permissions_json || {},
          is_active: true,
          invited_by: context.employee.id,
        })
        .select(`
          *,
          roles (
            id,
            name,
            permissions_json
          )
        `)
        .single()

      if (error) throw error

      // Remove password hash from response
      const { password_hash: _, ...sanitized } = employee

      return NextResponse.json({
        employee: sanitized,
        message: 'Employee invited successfully',
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to create employee', message: error.message },
        { status: 500 }
      )
    }
  })
}
