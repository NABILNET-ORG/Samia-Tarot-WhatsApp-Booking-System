import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'

type RouteParams = { params: { id: string } }

export async function GET(request: NextRequest, { params }: RouteParams) {
  return requirePermission(request, 'services', 'read', async (context) => {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('id', params.id)
      .eq('business_id', context.business.id)
      .single()

    if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ service: data })
  })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return requirePermission(request, 'services', 'update', async (context) => {
    const body = await request.json()
    const { data, error } = await supabaseAdmin
      .from('services')
      .update(body)
      .eq('id', params.id)
      .eq('business_id', context.business.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ service: data, message: 'Service updated' })
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return requirePermission(request, 'services', 'delete', async (context) => {
    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', params.id)
      .eq('business_id', context.business.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: 'Service deleted' })
  })
}
