/**
 * 🔔 Notification Management API
 * Individual notification operations (PATCH, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

/**
 * PATCH /api/notifications/[id] - Mark notification as read/unread
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params
      const body = await request.json()
      const { is_read } = body

      // Update notification
      const { data: notification, error } = await supabaseAdmin
        .from('notifications')
        .update({
          is_read: is_read !== undefined ? is_read : true,
          read_at: is_read !== false ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .eq('business_id', context.business.id)
        .select()
        .single()

      if (error) throw error

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        notification,
      })
    } catch (error: any) {
      console.error('Failed to update notification:', error)
      return NextResponse.json(
        { error: 'Failed to update notification', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/notifications/[id] - Delete notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params

      // Delete notification
      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('business_id', context.business.id)

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: 'Notification deleted successfully',
      })
    } catch (error: any) {
      console.error('Failed to delete notification:', error)
      return NextResponse.json(
        { error: 'Failed to delete notification', message: error.message },
        { status: 500 }
      )
    }
  })
}
