/**
 * 📅 Bookings Management API - Single Booking Operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

const updateBookingSchema = z.object({
  booking_date: z.string().datetime().optional(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  payment_status: z.enum(['pending', 'paid', 'refunded']).optional(),
  notes: z.string().max(1000).optional().nullable(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return requireBusinessContext(request, async (context) => {
    const { id } = params
    const { data: booking, error } = await supabaseAdmin.from('bookings').select('*, customer:customers(*), service:services(*)').eq('id', id).eq('business_id', context.business.id).single()
    if (error || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    return NextResponse.json({ booking })
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return requireBusinessContext(request, async (context) => {
    const { id } = params
    const body = await request.json()
    const validation = updateBookingSchema.safeParse(body)
    if (!validation.success) return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 })
    const { data: booking, error } = await supabaseAdmin.from('bookings').update({ ...validation.data, updated_at: new Date().toISOString() }).eq('id', id).eq('business_id', context.business.id).select().single()
    if (error) throw error
    return NextResponse.json({ booking, message: 'Booking updated successfully' })
  })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return requireBusinessContext(request, async (context) => {
    const { id } = params
    const { error } = await supabaseAdmin.from('bookings').delete().eq('id', id).eq('business_id', context.business.id)
    if (error) throw error
    return NextResponse.json({ message: 'Booking cancelled successfully' })
  })
}
