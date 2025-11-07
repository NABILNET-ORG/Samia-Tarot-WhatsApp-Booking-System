/**
 * 📊 Admin Dashboard API
 * Requires authentication - admin/owner roles only
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseHelpers } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      // Check if user has admin/owner role
      const allowedRoles = ['admin', 'owner']
      if (!allowedRoles.includes(context.employee.role_name.toLowerCase())) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Admin or Owner role required' },
          { status: 403 }
        )
      }

      // Get stats for this business only
      const businessId = context.business.id
      const today = new Date().toISOString().split('T')[0]

      // Total bookings for this business
      const { data: allBookings } = await supabaseAdmin
        .from('bookings')
        .select('id, payment_status')
        .eq('business_id', businessId)

      // Today's bookings
      const { data: todayBookings } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('business_id', businessId)
        .gte('created_at', today)

      // Pending payments
      const pendingPayments = allBookings?.filter((b: any) => b.payment_status === 'pending').length || 0

      // Active conversations
      const { data: activeConvos } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('business_id', businessId)
        .eq('is_active', true)

      // Get current provider from database
      const provider = await supabaseHelpers.getSetting('whatsapp_provider') || 'meta'

      return NextResponse.json({
        stats: {
          totalBookings: allBookings?.length || 0,
          todayBookings: todayBookings?.length || 0,
          pendingPayments,
          activeConversations: activeConvos?.length || 0,
        },
        provider,
        business: {
          id: context.business.id,
          name: context.business.name,
        },
      })
    } catch (error: any) {
      console.error('Dashboard API error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
