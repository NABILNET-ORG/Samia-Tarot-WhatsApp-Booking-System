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
      const limit = parseInt(searchParams.get('limit') || '50')

      let query = supabaseAdmin
        .from('bookings')
        .select('*, customers(name_english, phone), services(name_english)')
        .eq('business_id', context.business.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      const { data: bookings, error } = await query

      if (error) throw error

      return NextResponse.json({ bookings })
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
