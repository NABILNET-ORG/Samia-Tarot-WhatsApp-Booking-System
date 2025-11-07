/**
 * 💬 Conversations API
 * List and manage conversations
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/conversations - List conversations for business
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const mode = searchParams.get('mode') // 'ai', 'human', or null for all
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = (page - 1) * limit

      let query = supabaseAdmin
        .from('conversations')
        .select('*', { count: 'exact' })
        .eq('business_id', context.business.id)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false })

      if (mode && (mode === 'ai' || mode === 'human')) {
        query = query.eq('mode', mode)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data: conversations, error, count } = await query

      if (error) throw error

      return NextResponse.json({
        conversations: conversations || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch conversations', message: error.message },
        { status: 500 }
      )
    }
  })
}
