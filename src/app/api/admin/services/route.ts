/**
 * 🎛️ Admin Services API
 * Manage services from admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { ServiceHelpers } from '@/lib/supabase/services'
import { supabaseAdmin } from '@/lib/supabase/client'

/**
 * GET - Get all services
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('active') === 'true'

    let query = supabaseAdmin.from('services').select('*').order('sort_order')

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
}

/**
 * POST - Update service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId, action, data } = body

    switch (action) {
      case 'update_price':
        await supabaseAdmin
          .from('services')
          .update({ price: data.price })
          .eq('id', serviceId)
        break

      case 'toggle_active':
        await supabaseAdmin
          .from('services')
          .update({ is_active: data.isActive })
          .eq('id', serviceId)
        break

      case 'toggle_featured':
        await supabaseAdmin
          .from('services')
          .update({ is_featured: data.isFeatured })
          .eq('id', serviceId)
        break

      case 'update_sort_order':
        await supabaseAdmin
          .from('services')
          .update({ sort_order: data.sortOrder })
          .eq('id', serviceId)
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
        break

      default:
        throw new Error('Invalid action')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT - Bulk update services
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, serviceIds, data } = body

    switch (action) {
      case 'disable_all':
        await supabaseAdmin
          .from('services')
          .update({ is_active: false })
          .in('id', serviceIds)
        break

      case 'enable_all':
        await supabaseAdmin
          .from('services')
          .update({ is_active: true })
          .in('id', serviceIds)
        break

      case 'discount':
        // Apply percentage discount
        const { percentage } = data
        await supabaseAdmin.rpc('apply_discount', {
          service_ids: serviceIds,
          discount_percentage: percentage,
        })
        break

      default:
        throw new Error('Invalid action')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
