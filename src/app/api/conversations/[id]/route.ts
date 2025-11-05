/**
 * 💬 Single Conversation API
 * Get conversation details
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

type RouteParams = {
  params: { id: string }
}

/**
 * GET /api/conversations/[id] - Get conversation details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params

      const { data: conversation, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (error || !conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      return NextResponse.json({ conversation })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch conversation', message: error.message },
        { status: 500 }
      )
    }
  })
}
