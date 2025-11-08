/**
 * 📅 Booking Management API
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

// Validation schema for creating bookings
const createBookingSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  service_id: z.string().uuid('Invalid service ID'),
  scheduled_at: z.string().datetime('Invalid datetime format'),
  duration_minutes: z.number().int().positive('Duration must be positive'),
  price: z.number().positive('Price must be positive'),
  payment_method: z.enum(['stripe', 'western_union', 'cash', 'other']).optional(),
  payment_status: z.enum(['pending', 'paid', 'refunded']).default('pending'),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']).default('pending'),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

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

      // Validate input with Zod
      const validatedData = createBookingSchema.parse(body)

      const { data: booking, error } = await supabaseAdmin
        .from('bookings')
        .insert({
          ...validatedData,
          business_id: context.business.id,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ booking, message: 'Booking created' })
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
