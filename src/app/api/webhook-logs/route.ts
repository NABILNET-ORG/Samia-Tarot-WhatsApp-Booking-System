/**
 * Webhook Logs API
 * View incoming webhook requests and responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/webhook-logs
 * List webhook logs with pagination
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const status = searchParams.get('status')
      const source = searchParams.get('source')
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')

      const offset = (page - 1) * limit

      // Build query
      let query = supabaseAdmin
        .from('webhook_logs')
        .select('*', { count: 'exact' })
        .eq('business_id', context.business.id)

      // Apply filters
      if (status) {
        query = query.eq('status', status)
      }

      if (source) {
        query = query.eq('source', source)
      }

      if (startDate) {
        query = query.gte('created_at', startDate)
      }

      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      // Apply pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data: logs, error, count } = await query

      if (error) throw error

      return NextResponse.json({
        logs: logs || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      })
    } catch (error: any) {
      console.error('Webhook logs error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch webhook logs', message: error.message },
        { status: 500 }
      )
    }
  })
}
