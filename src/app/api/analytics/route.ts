import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      // Get overview stats
      const [conversationsResult, bookingsResult, customersResult, revenueResult] = await Promise.all([
        supabaseAdmin.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', context.business.id),
        supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true }).eq('business_id', context.business.id),
        supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }).eq('business_id', context.business.id),
        supabaseAdmin.from('bookings').select('amount').eq('business_id', context.business.id).eq('payment_status', 'completed'),
      ])

      const totalRevenue = revenueResult.data?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0

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
