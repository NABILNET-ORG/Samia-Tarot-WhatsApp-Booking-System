/**
 * 🎛️ Admin Services API
 * Manage services from admin dashboard
 * Requires authentication - admin/owner roles only
 */

import { NextRequest, NextResponse } from 'next/server'
import { ServiceHelpers } from '@/lib/supabase/services'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { AdminServiceSchema } from '@/lib/validation/schemas'

/**
 * GET - Get all services
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      // Check if user has admin/owner role
      const allowedRoles = ['admin', 'owner']
      if (!allowedRoles.includes(context.employee.role_name.toLowerCase())) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Admin or Owner role required' },
          { status: 403 }
        )
      }

      const searchParams = request.nextUrl.searchParams
      const activeOnly = searchParams.get('active') === 'true'

      let query = supabaseAdmin
        .from('services')
        .select('*')
        .eq('business_id', context.business.id)
        .order('sort_order')

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      const { data: services, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return NextResponse.json({ services })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

/**
 * POST - Update service
 */
export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      // Check if user has admin/owner role
      const allowedRoles = ['admin', 'owner']
      if (!allowedRoles.includes(context.employee.role_name.toLowerCase())) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Admin or Owner role required' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const validationResult = AdminServiceSchema.safeParse(body)

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validationResult.data
      const { serviceId, action, data } = body

      switch (action) {
        case 'update_price':
          await supabaseAdmin
            .from('services')
            .update({ price: data.price })
            .eq('id', serviceId)
            .eq('business_id', context.business.id)
          break

        case 'toggle_active':
          await supabaseAdmin
            .from('services')
            .update({ is_active: data.isActive })
            .eq('id', serviceId)
            .eq('business_id', context.business.id)
          break

        case 'toggle_featured':
          await supabaseAdmin
            .from('services')
            .update({ is_featured: data.isFeatured })
            .eq('id', serviceId)
            .eq('business_id', context.business.id)
          break

        case 'update_sort_order':
          await supabaseAdmin
            .from('services')
            .update({ sort_order: data.sortOrder })
            .eq('id', serviceId)
            .eq('business_id', context.business.id)
          break

        case 'update_details':
          await supabaseAdmin
            .from('services')
            .update({
              name_english: data.name_english,
              name_arabic: data.name_arabic,
              price: data.price,
              description_english: data.description_english,
              description_arabic: data.description_arabic,
            })
            .eq('id', serviceId)
            .eq('business_id', context.business.id)
          break

        default:
          throw new Error('Invalid action')
      }

      return NextResponse.json({ success: true })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

/**
 * PUT - Bulk update services
 */
export async function PUT(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      // Check if user has admin/owner role
      const allowedRoles = ['admin', 'owner']
      if (!allowedRoles.includes(context.employee.role_name.toLowerCase())) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Admin or Owner role required' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const validationResult = AdminServiceSchema.safeParse(body)

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validationResult.data
      const { action, serviceIds, data } = body

      switch (action) {
        case 'disable_all':
          await supabaseAdmin
            .from('services')
            .update({ is_active: false })
            .in('id', serviceIds)
            .eq('business_id', context.business.id)
          break

        case 'enable_all':
          await supabaseAdmin
            .from('services')
            .update({ is_active: true })
            .in('id', serviceIds)
            .eq('business_id', context.business.id)
          break

        case 'discount':
          // Apply percentage discount
          const { percentage } = data
          await supabaseAdmin.rpc('apply_discount', {
            service_ids: serviceIds,
            discount_percentage: percentage,
            p_business_id: context.business.id,
          })
          break

        default:
          throw new Error('Invalid action')
      }

      return NextResponse.json({ success: true })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
