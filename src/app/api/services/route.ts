/**
 * 🛎️ Service Management API (Multi-Tenant)
 * CRUD operations for services
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext, requirePermission } from '@/lib/multi-tenant/middleware'

export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const activeOnly = searchParams.get('active') === 'true'

      let query = supabaseAdmin
        .from('services')
        .select('*')
        .eq('business_id', context.business.id)
        .order('sort_order')

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      const { data: services, error } = await query

      if (error) throw error

      return NextResponse.json({ services })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return requirePermission(request, 'services', 'create', async (context) => {
    try {
      const body = await request.json()

      const { data: service, error } = await supabaseAdmin
        .from('services')
        .insert({
          ...body,
          business_id: context.business.id,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ service, message: 'Service created' })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
