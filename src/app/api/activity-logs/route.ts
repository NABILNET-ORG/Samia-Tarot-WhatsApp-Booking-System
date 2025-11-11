/**
 * Activity Logs API
 * View audit trail of all actions
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'
import { z } from 'zod'
import { validateInput } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// Extended schema for activity logs with date filters
const ActivityLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  action: z.string().optional(),
  employee_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

/**
 * GET /api/activity-logs
 * List activity logs with pagination
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      // Validate query parameters
      const queryParams = Object.fromEntries(request.nextUrl.searchParams)
      const validation = validateInput(ActivityLogsQuerySchema, queryParams)

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: validation.errors },
          { status: 400 }
        )
      }

      const { page, limit, action, employee_id: employeeId, start_date: startDate, end_date: endDate } = validation.data

      const offset = (page - 1) * limit

      // Build query
      let query = supabaseAdmin
        .from('activity_logs')
        .select(`
          *,
          employee:employees(id, full_name, email)
        `, { count: 'exact' })
        .eq('business_id', context.business.id)

      // Apply filters
      if (action) {
        query = query.eq('action', action)
      }

      if (employeeId) {
        query = query.eq('employee_id', employeeId)
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
      console.error('Activity logs error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activity logs', message: error.message },
        { status: 500 }
      )
    }
  })
}
