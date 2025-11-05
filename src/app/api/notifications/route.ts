/**
 * 🔔 Notifications API
 * Get and manage notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { sendPushNotification } from '@/lib/notifications/web-push'

/**
 * GET /api/notifications - List notifications for employee
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const unreadOnly = searchParams.get('unread') === 'true'
      const limit = parseInt(searchParams.get('limit') || '50')

      let query = supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('employee_id', context.employee.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      const { data: notifications, error } = await query

      if (error) throw error

      return NextResponse.json({ notifications })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch notifications', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/notifications - Create and send notification
 */
export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()
      const { employee_id, type, title, body: notifBody, related_conversation_id } = body

      if (!employee_id || !type || !title || !notifBody) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      // Create notification in database
      const { data: notification, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          business_id: context.business.id,
          employee_id,
          type,
          title,
          body: notifBody,
          related_conversation_id,
        })
        .select()
        .single()

      if (error) throw error

      // Get employee's push subscriptions
      const { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('endpoint, p256dh_key, auth_key')
        .eq('employee_id', employee_id)
        .eq('is_active', true)

      // Send push notifications
      if (subscriptions && subscriptions.length > 0) {
        const pushPromises = subscriptions.map((sub: any) =>
          sendPushNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh_key,
                auth: sub.auth_key,
              },
            },
            {
              title,
              body: notifBody,
              icon: '/icon-192.png',
              badge: '/badge-72.png',
              tag: notification.id,
              data: {
                conversation_id: related_conversation_id,
                notification_id: notification.id,
              },
            }
          )
        )

        await Promise.allSettled(pushPromises)
      }

      return NextResponse.json({
        notification,
        message: 'Notification sent',
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to send notification', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * PATCH /api/notifications - Mark as read
 */
export async function PATCH(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()
      const { notification_ids } = body

      if (!notification_ids || !Array.isArray(notification_ids)) {
        return NextResponse.json(
          { error: 'notification_ids array is required' },
          { status: 400 }
        )
      }

      const { error } = await supabaseAdmin
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .in('id', notification_ids)
        .eq('employee_id', context.employee.id)

      if (error) throw error

      return NextResponse.json({ message: 'Notifications marked as read' })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to mark as read', message: error.message },
        { status: 500 }
      )
    }
  })
}
