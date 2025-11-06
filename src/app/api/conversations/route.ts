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
      const limit = parseInt(searchParams.get('limit') || '50')

      let query = supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('business_id', context.business.id)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false })
        .limit(limit)

      if (mode && (mode === 'ai' || mode === 'human')) {
        query = query.eq('mode', mode)
      }

      const { data: conversations, error } = await query

      if (error) throw error

      return NextResponse.json({ conversations })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch conversations', message: error.message },
        { status: 500 }
      )
    }
  })
}
