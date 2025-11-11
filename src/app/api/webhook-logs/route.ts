/**
 * Webhook Logs API
 * View incoming webhook requests and responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'
import { z } from 'zod'
import { validateInput } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// Extended schema for webhook logs with date filters
const WebhookLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  status: z.string().optional(),
  source: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
}).transform(data => ({
  page: typeof data.page === 'string' ? parseInt(data.page) : data.page,
  limit: typeof data.limit === 'string' ? parseInt(data.limit) : data.limit,
  status: data.status,
  source: data.source,
  start_date: data.start_date,
  end_date: data.end_date,
}))

/**
 * GET /api/webhook-logs
 * List webhook logs with pagination
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      // Validate query parameters
      const queryParams = Object.fromEntries(request.nextUrl.searchParams)
      const validation = validateInput(WebhookLogsQuerySchema, queryParams)

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: validation.errors },
          { status: 400 }
        )
      }

      const { page, limit, status, source, start_date: startDate, end_date: endDate } = validation.data

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
