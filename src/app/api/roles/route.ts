/**
 * 🔐 Roles Management API
 * System and custom roles
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext, requirePermission } from '@/lib/multi-tenant/middleware'

/**
 * GET /api/roles - List all roles
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const systemOnly = searchParams.get('system') === 'true'

      let query = supabaseAdmin
        .from('roles')
        .select('*')
        .order('name')

      // Filter by business or system roles
      if (systemOnly) {
        query = query.is('business_id', null)
      } else {
        query = query.or(`business_id.is.null,business_id.eq.${context.business.id}`)
      }

      const { data: roles, error } = await query

      if (error) throw error

      return NextResponse.json({ roles })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch roles', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/roles - Create custom role
 */
export async function POST(request: NextRequest) {
  return requirePermission(request, 'roles', 'create', async (context) => {
    try {
      const body = await request.json()
      const { name, description, permissions_json } = body

      // Validate required fields
      if (!name || !permissions_json) {
        return NextResponse.json(
          { error: 'Missing required fields: name, permissions_json' },
          { status: 400 }
        )
      }

      // Check if role name already exists in this business
      const { data: existing } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', name)
        .eq('business_id', context.business.id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Role with this name already exists' },
          { status: 409 }
        )
      }

      // Create custom role
      const { data: role, error } = await supabaseAdmin
        .from('roles')
        .insert({
          business_id: context.business.id,
          name,
          description,
          permissions_json,
          is_system: false,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        role,
        message: 'Role created successfully',
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to create role', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * PATCH /api/roles - Update role
 */
export async function PATCH(request: NextRequest) {
  return requirePermission(request, 'roles', 'update', async (context) => {
    try {
      const body = await request.json()
      const { role_id, name, description, permissions_json } = body

      if (!role_id) {
        return NextResponse.json({ error: 'Missing role_id' }, { status: 400 })
      }

      // Check if role is system role
      const { data: role } = await supabaseAdmin
        .from('roles')
        .select('is_system, business_id')
        .eq('id', role_id)
        .single()

      if (!role) {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 })
      }

      if (role.is_system) {
        return NextResponse.json(
          { error: 'Cannot modify system roles' },
          { status: 403 }
        )
      }

      if (role.business_id !== context.business.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Update role
      const updates: any = {}
      if (name) updates.name = name
      if (description !== undefined) updates.description = description
      if (permissions_json) updates.permissions_json = permissions_json

      const { data: updated, error } = await supabaseAdmin
        .from('roles')
        .update(updates)
        .eq('id', role_id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        role: updated,
        message: 'Role updated successfully',
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to update role', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/roles - Delete custom role
 */
export async function DELETE(request: NextRequest) {
  return requirePermission(request, 'roles', 'delete', async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const role_id = searchParams.get('role_id')

      if (!role_id) {
        return NextResponse.json({ error: 'Missing role_id' }, { status: 400 })
      }

      // Check if role is system role
      const { data: role } = await supabaseAdmin
        .from('roles')
        .select('is_system, business_id')
        .eq('id', role_id)
        .single()

      if (!role) {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 })
      }

      if (role.is_system) {
        return NextResponse.json(
          { error: 'Cannot delete system roles' },
          { status: 403 }
        )
      }

      if (role.business_id !== context.business.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Check if role is assigned to any employees
      const { data: employees } = await supabaseAdmin
        .from('employees')
        .select('id')
        .eq('role_id', role_id)
        .limit(1)

      if (employees && employees.length > 0) {
        return NextResponse.json(
          { error: 'Cannot delete role that is assigned to employees' },
          { status: 400 }
        )
      }

      // Delete role
      const { error } = await supabaseAdmin
        .from('roles')
        .delete()
        .eq('id', role_id)

      if (error) throw error

      return NextResponse.json({ message: 'Role deleted successfully' })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to delete role', message: error.message },
        { status: 500 }
      )
    }
  })
}
