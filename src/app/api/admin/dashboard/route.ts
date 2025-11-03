/**
 * 📊 Admin Dashboard API
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin, supabaseHelpers } from '@/lib/supabase/client'

export async function GET() {
  try {
    // Get stats
    const today = new Date().toISOString().split('T')[0]

    // Total bookings
    const { data: allBookings } = await supabaseAdmin
      .from('bookings')
      .select('id, payment_status')

    // Today's bookings
    const { data: todayBookings } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .gte('created_at', today)

    // Pending payments
    const pendingPayments = allBookings?.filter((b: any) => b.payment_status === 'pending').length || 0

    // Active conversations
    const { data: activeConvos } = await supabaseAdmin
      .from('conversations')
      .select('id')
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
    })
  } catch (error: any) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
