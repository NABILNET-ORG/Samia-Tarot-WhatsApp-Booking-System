import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'

type RouteParams = { params: { id: string } }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return requirePermission(request, 'bookings', 'update', async (context) => {
    const body = await request.json()
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(body)
      .eq('id', params.id)
      .eq('business_id', context.business.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ booking: data })
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return requirePermission(request, 'bookings', 'delete', async (context) => {
    const { error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('business_id', context.business.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: 'Booking cancelled' })
  })
}
