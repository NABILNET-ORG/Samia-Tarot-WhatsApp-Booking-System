/**
 * 🛎️ Service Management API (Multi-Tenant)
 * CRUD operations for services
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext, requirePermission } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

// Validation schema for creating services
const createServiceSchema = z.object({
  name_english: z.string().min(1, 'English name is required').max(255, 'Name too long'),
  name_arabic: z.string().min(1, 'Arabic name is required').max(255, 'Name too long'),
  price: z.number().positive('Price must be positive'),
  duration_minutes: z.number().int().positive('Duration must be positive'),
  is_active: z.boolean().default(true),
})

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

      // Validate input with Zod
      const validatedData = createServiceSchema.parse(body)

      const { data: service, error } = await supabaseAdmin
        .from('services')
        .insert({
          ...validatedData,
          business_id: context.business.id,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ service, message: 'Service created' })
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
