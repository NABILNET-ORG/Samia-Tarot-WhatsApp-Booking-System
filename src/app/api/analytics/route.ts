import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { AnalyticsQuerySchema, validateInput } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      // Validate query parameters
      const queryParams = Object.fromEntries(request.nextUrl.searchParams)
      const validation = validateInput(AnalyticsQuerySchema, queryParams)

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: validation.errors },
          { status: 400 }
        )
      }

      // Get overview stats
      const [conversationsResult, bookingsResult, customersResult, revenueResult] = await Promise.all([
        supabaseAdmin.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', context.business.id),
        supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true }).eq('business_id', context.business.id),
        supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }).eq('business_id', context.business.id),
        supabaseAdmin.from('bookings').select('amount').eq('business_id', context.business.id).eq('payment_status', 'completed'),
      ])

      const totalRevenue = revenueResult.data?.reduce((sum: number, b: any) => sum + (b.amount || 0), 0) || 0

      return NextResponse.json({
        analytics: {
          total_conversations: conversationsResult.count || 0,
          total_bookings: bookingsResult.count || 0,
          total_customers: customersResult.count || 0,
          total_revenue: totalRevenue,
        },
      })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
