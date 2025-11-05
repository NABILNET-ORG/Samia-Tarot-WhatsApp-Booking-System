/**
 * 👤 Single Employee API  
 * GET/PATCH/DELETE specific employee
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'
import { hashPassword } from '@/lib/auth/session'

type RouteParams = {
  params: { id: string }
}

/**
 * GET /api/employees/[id] - Get employee by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return requirePermission(request, 'employees', 'read', async (context) => {
    try {
      const { id } = params

      const { data: employee, error } = await supabaseAdmin
        .from('employees')
        .select(`
          *,
          roles (
            id,
            name,
            permissions_json
          )
        `)
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (error || !employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }

      // Remove password hash
      const { password_hash, ...sanitized } = employee

      return NextResponse.json({ employee: sanitized })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch employee', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * PATCH /api/employees/[id] - Update employee
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return requirePermission(request, 'employees', 'update', async (context) => {
    try {
      const { id } = params
      const body = await request.json()

      const updates: any = {}

      // Handle allowed fields
      const allowedFields = [
        'full_name', 'role_id', 'custom_permissions_json',
        'is_active', 'avatar_url'
      ]

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field]
        }
      }

      // Handle password change
      if (body.new_password) {
        updates.password_hash = await hashPassword(body.new_password)
        updates.must_change_password = false
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
      }

      const { data: employee, error } = await supabaseAdmin
        .from('employees')
        .update(updates)
        .eq('id', id)
        .eq('business_id', context.business.id)
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

      // Remove password hash
      const { password_hash, ...sanitized } = employee

      return NextResponse.json({
        employee: sanitized,
        message: 'Employee updated successfully',
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to update employee', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/employees/[id] - Deactivate employee
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return requirePermission(request, 'employees', 'delete', async (context) => {
    try {
      const { id } = params

      // Prevent self-deletion
      if (id === context.employee.id) {
        return NextResponse.json(
          { error: 'Cannot delete your own account' },
          { status: 400 }
        )
      }

      // Soft delete (deactivate)
      const { error } = await supabaseAdmin
        .from('employees')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('business_id', context.business.id)

      if (error) throw error

      return NextResponse.json({ message: 'Employee deactivated successfully' })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to delete employee', message: error.message },
        { status: 500 }
      )
    }
  })
}
