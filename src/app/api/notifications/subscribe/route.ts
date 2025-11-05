/**
 * 🔔 Push Subscription API
 * Subscribe to push notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

/**
 * POST /api/notifications/subscribe - Subscribe to push
 */
export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()
      const { endpoint, keys, userAgent } = body

      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return NextResponse.json(
          { error: 'Invalid subscription data' },
          { status: 400 }
        )
      }

      // Save subscription
      const { data: subscription, error } = await supabaseAdmin
        .from('push_subscriptions')
        .insert({
          business_id: context.business.id,
          employee_id: context.employee.id,
          endpoint,
          p256dh_key: keys.p256dh,
          auth_key: keys.auth,
          user_agent: userAgent,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        subscription,
        message: 'Subscribed to push notifications',
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Subscription failed', message: error.message },
        { status: 500 }
      )
    }
  })
}
