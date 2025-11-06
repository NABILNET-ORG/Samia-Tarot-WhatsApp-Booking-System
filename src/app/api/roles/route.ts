/**
 * 🔐 Roles Management API
 * System and custom roles
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext, requirePermission } from '@/lib/multi-tenant/middleware'
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

const createRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  display_name: z.string().min(1, 'Display name is required').max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
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
  }),
})

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

      // Validate input with Zod
      const validation = createRoleSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        )
      }

      const { name, display_name, description, color, permissions_json } = validation.data

      // Check if role name already exists in this business
      const { data: existing } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', name)
        .eq('business_id', context.business.id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Role with this name already exists in your business' },
          { status: 409 }
        )
      }

      // Create custom role
      const { data: role, error } = await supabaseAdmin
        .from('roles')
        .insert({
          business_id: context.business.id,
          name,
          display_name,
          description: description || null,
          color: color || '#6B46C1',
          permissions_json,
          is_system_role: false,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        role,
        message: 'Role created successfully',
      })
    } catch (error: any) {
      console.error('Role creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create role', message: error.message },
        { status: 500 }
      )
    }
  })
}

