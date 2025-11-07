/**
 * Activity Logs API
 * View audit trail of all actions
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/activity-logs
 * List activity logs with pagination
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const action = searchParams.get('action')
      const employeeId = searchParams.get('employee_id')
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')

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
