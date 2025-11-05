/**
 * 👤 Single Customer API
 * GET/PATCH/DELETE customer
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

type RouteParams = {
  params: { id: string }
}

/**
 * GET /api/customers/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { data: customer, error } = await supabaseAdmin
        .from('customers')
        .select('*, bookings(*)')
        .eq('id', params.id)
        .eq('business_id', context.business.id)
        .single()

      if (error || !customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      return NextResponse.json({ customer })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

/**
 * PATCH /api/customers/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()

      const { data: customer, error } = await supabaseAdmin
        .from('customers')
        .update(body)
        .eq('id', params.id)
        .eq('business_id', context.business.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ customer, message: 'Customer updated' })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

/**
 * DELETE /api/customers/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { error } = await supabaseAdmin
        .from('customers')
        .delete()
        .eq('id', params.id)
        .eq('business_id', context.business.id)

      if (error) throw error

      return NextResponse.json({ message: 'Customer deleted' })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
