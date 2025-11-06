/**
 * 💼 Services Management API - Single Service Operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

const updateServiceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  duration_minutes: z.number().int().min(5).max(480).optional(),
  price_amount: z.number().min(0).optional(),
  price_currency: z.string().length(3).optional(),
  is_active: z.boolean().optional(),
  max_bookings_per_day: z.number().int().min(0).optional().nullable(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return requireBusinessContext(request, async (context) => {
    const { id } = params
    const { data: service, error } = await supabaseAdmin.from('services').select('*').eq('id', id).eq('business_id', context.business.id).single()
    if (error || !service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    return NextResponse.json({ service })
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return requireBusinessContext(request, async (context) => {
    const { id } = params
    const body = await request.json()
    const validation = updateServiceSchema.safeParse(body)
    if (!validation.success) return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 })
    const { data: service, error } = await supabaseAdmin.from('services').update({ ...validation.data, updated_at: new Date().toISOString() }).eq('id', id).eq('business_id', context.business.id).select().single()
    if (error) throw error
    return NextResponse.json({ service, message: 'Service updated successfully' })
  })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return requireBusinessContext(request, async (context) => {
    const { id } = params
    const { error } = await supabaseAdmin.from('services').delete().eq('id', id).eq('business_id', context.business.id)
    if (error) throw error
    return NextResponse.json({ message: 'Service deleted successfully' })
  })
}
