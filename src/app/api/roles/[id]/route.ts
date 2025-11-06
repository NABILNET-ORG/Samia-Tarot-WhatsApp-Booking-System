/**
 * 🔐 Roles Management API - Single Role Operations
 * Update and delete specific roles
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

// Permission schema validation
const permissionSchema = z.object({
  view: z.boolean().optional(),
  create: z.boolean().optional(),
  edit: z.boolean().optional(),
  delete: z.boolean().optional(),
  takeover: z.boolean().optional(),
  send_message: z.boolean().optional(),
  assign: z.boolean().optional(),
  export: z.boolean().optional(),
  refund: z.boolean().optional(),
  view_revenue: z.boolean().optional(),
  invite: z.boolean().optional(),
  whatsapp: z.boolean().optional(),
  billing: z.boolean().optional(),
  test: z.boolean().optional(),
})

const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  display_name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  permissions_json: z.object({
    conversations: permissionSchema.optional(),
    bookings: permissionSchema.optional(),
    customers: permissionSchema.optional(),
    services: permissionSchema.optional(),
    analytics: permissionSchema.optional(),
    employees: permissionSchema.optional(),
    settings: permissionSchema.optional(),
    prompts: permissionSchema.optional(),
    templates: permissionSchema.optional(),
    roles: permissionSchema.optional(),
  }).optional(),
})

/**
 * PATCH /api/roles/[id] - Update role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requirePermission(request, 'roles', 'edit', async (context) => {
    try {
      const { id } = params
      const body = await request.json()

      // Validate input
      const validation = updateRoleSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        )
      }

      // Check if role exists and get its details
      const { data: role, error: fetchError } = await supabaseAdmin
        .from('roles')
        .select('id, is_system_role, business_id, name')
        .eq('id', id)
        .single()

      if (fetchError || !role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        )
      }

      // Cannot modify system roles
      if (role.is_system_role) {
        return NextResponse.json(
          { error: 'Cannot modify system roles' },
          { status: 403 }
        )
      }

      // Must belong to same business
      if (role.business_id !== context.business.id) {
        return NextResponse.json(
          { error: 'Unauthorized to modify this role' },
          { status: 403 }
        )
      }

      // Check for duplicate name if name is being changed
      if (validation.data.name && validation.data.name !== role.name) {
        const { data: duplicate } = await supabaseAdmin
          .from('roles')
          .select('id')
          .eq('name', validation.data.name)
          .eq('business_id', context.business.id)
          .neq('id', id)
          .single()

        if (duplicate) {
          return NextResponse.json(
            { error: 'Role with this name already exists in your business' },
            { status: 400 }
          )
        }
      }

      // Update role
      const { data: updated, error } = await supabaseAdmin
        .from('roles')
        .update({
          ...validation.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        role: updated,
        message: 'Role updated successfully',
      })
    } catch (error: any) {
      console.error('Role update error:', error)
      return NextResponse.json(
        { error: 'Failed to update role', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/roles/[id] - Delete custom role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requirePermission(request, 'roles', 'delete', async (context) => {
    try {
      const { id } = params

      // Check if role exists and get its details
      const { data: role, error: fetchError } = await supabaseAdmin
        .from('roles')
        .select('id, is_system_role, business_id, name')
        .eq('id', id)
        .single()

      if (fetchError || !role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        )
      }

      // Cannot delete system roles
      if (role.is_system_role) {
        return NextResponse.json(
          { error: 'Cannot delete system roles. System roles (Owner, Manager, Agent, Viewer) are protected.' },
          { status: 403 }
        )
      }

      // Must belong to same business
      if (role.business_id !== context.business.id) {
        return NextResponse.json(
          { error: 'Unauthorized to delete this role' },
          { status: 403 }
        )
      }

      // Check if role is assigned to any employees
      const { data: employees, error: employeeError } = await supabaseAdmin
        .from('employees')
        .select('id, full_name')
        .eq('role_id', id)
        .eq('business_id', context.business.id)
        .limit(5)

      if (employeeError) throw employeeError

      if (employees && employees.length > 0) {
        const employeeNames = employees.map(e => e.full_name).join(', ')
        return NextResponse.json(
          {
            error: `Cannot delete role "${role.name}" because it is assigned to ${employees.length} employee(s): ${employeeNames}${employees.length > 5 ? ' and others' : ''}`,
            assigned_count: employees.length
          },
          { status: 400 }
        )
      }

      // Delete role
      const { error } = await supabaseAdmin
        .from('roles')
        .delete()
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({
        message: `Role "${role.name}" deleted successfully`
      })
    } catch (error: any) {
      console.error('Role deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete role', message: error.message },
        { status: 500 }
      )
    }
  })
}
