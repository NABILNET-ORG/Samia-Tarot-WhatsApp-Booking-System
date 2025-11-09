/**
 * 🔔 Push Subscription API
 * Subscribe to push notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { PushSubscriptionSchema } from '@/lib/validation/schemas'

/**
 * POST /api/notifications/subscribe - Subscribe to push
 */
export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()

      // Transform incoming data to match schema
      const transformedData = {
        endpoint: body.endpoint,
        p256dh_key: body.keys?.p256dh,
        auth_key: body.keys?.auth,
        device_type: body.device_type,
        browser: body.browser,
        os: body.os,
      }

      const validatedData = PushSubscriptionSchema.parse(transformedData)

      // Save subscription
      const { data: subscription, error } = await supabaseAdmin
        .from('push_subscriptions')
        .insert({
          business_id: context.business.id,
          employee_id: context.employee.id,
          endpoint: validatedData.endpoint,
          p256dh_key: validatedData.p256dh_key,
          auth_key: validatedData.auth_key,
          user_agent: body.userAgent,
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
