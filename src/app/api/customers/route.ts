/**
 * 👥 Customer Management API
 * Complete CRUD for customers
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

/**
 * GET /api/customers - List customers
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const search = searchParams.get('search')
      const vipOnly = searchParams.get('vip') === 'true'
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      let query = supabaseAdmin
        .from('customers')
        .select('*, bookings(count)', { count: 'exact' })
        .eq('business_id', context.business.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) {
        query = query.or(`name_english.ilike.%${search}%,name_arabic.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
      }

      if (vipOnly) {
        query = query.eq('vip_status', true)
      }

      const { data: customers, error, count } = await query

      if (error) throw error

      return NextResponse.json({ customers, total: count })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch customers', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/customers - Create customer
 */
export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()
      const {
        phone,
        name_english,
        name_arabic,
        email,
        preferred_language,
        country_code,
        vip_status,
        notes,
      } = body

      if (!phone) {
        return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
      }

      // Check if customer already exists
      const { data: existing } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('business_id', context.business.id)
        .eq('phone', phone)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Customer with this phone already exists' },
          { status: 409 }
        )
      }

      const { data: customer, error } = await supabaseAdmin
        .from('customers')
        .insert({
          business_id: context.business.id,
          phone,
          name_english,
          name_arabic,
          email,
          preferred_language: preferred_language || 'en',
          country_code,
          vip_status: vip_status || false,
          notes,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ customer, message: 'Customer created successfully' })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to create customer', message: error.message },
        { status: 500 }
      )
    }
  })
}
