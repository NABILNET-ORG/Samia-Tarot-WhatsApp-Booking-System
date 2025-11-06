/**
 * 👥 Customer Management API - Single Customer Operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

const updateCustomerSchema = z.object({
  phone: z.string().min(1).max(20).optional(),
  name_english: z.string().max(100).optional(),
  name_arabic: z.string().max(100).optional(),
  email: z.string().email().optional().nullable(),
  preferred_language: z.enum(['en', 'ar']).optional(),
  country_code: z.string().max(5).optional(),
  vip_status: z.boolean().optional(),
  notes: z.string().max(1000).optional().nullable(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return requireBusinessContext(request, async (context) => {
    const { id } = params
    const { data: customer, error } = await supabaseAdmin.from('customers').select('*').eq('id', id).eq('business_id', context.business.id).single()
    if (error || !customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    return NextResponse.json({ customer })
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return requireBusinessContext(request, async (context) => {
    const { id } = params
    const body = await request.json()
    const validation = updateCustomerSchema.safeParse(body)
    if (!validation.success) return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 })
    const { data: customer, error } = await supabaseAdmin.from('customers').update({ ...validation.data, updated_at: new Date().toISOString() }).eq('id', id).eq('business_id', context.business.id).select().single()
    if (error) throw error
    return NextResponse.json({ customer, message: 'Customer updated successfully' })
  })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return requireBusinessContext(request, async (context) => {
    const { id } = params
    const { error } = await supabaseAdmin.from('customers').delete().eq('id', id).eq('business_id', context.business.id)
    if (error) throw error
    return NextResponse.json({ message: 'Customer deleted successfully' })
  })
}
