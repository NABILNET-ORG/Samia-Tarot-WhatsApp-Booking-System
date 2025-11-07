/**
 * 📅 Booking Management API
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const status = searchParams.get('status')
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = (page - 1) * limit

      let query = supabaseAdmin
        .from('bookings')
        .select('*, customers(name_english, phone), services(name_english)', { count: 'exact' })
        .eq('business_id', context.business.id)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data: bookings, error, count } = await query

      if (error) throw error

      return NextResponse.json({
        bookings: bookings || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()

      const { data: booking, error } = await supabaseAdmin
        .from('bookings')
        .insert({
          ...body,
          business_id: context.business.id,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ booking, message: 'Booking created' })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
