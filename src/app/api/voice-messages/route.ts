/**
 * Voice Messages API
 * List all voice messages received
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/voice-messages
 * List voice messages with pagination
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const transcribed = searchParams.get('transcribed')

      const offset = (page - 1) * limit

      // Build query - get messages with media_type = 'voice'
      let query = supabaseAdmin
        .from('messages')
        .select(`
          *,
          conversation:conversations(
            id,
            customer:customers(
              id,
              name,
              phone_number
            )
          )
        `, { count: 'exact' })
        .eq('business_id', context.business.id)
        .eq('media_type', 'voice')

      // Filter by transcription status
      if (transcribed === 'true') {
        query = query.not('transcription', 'is', null)
      } else if (transcribed === 'false') {
        query = query.is('transcription', null)
      }

      // Apply pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data: messages, error, count } = await query

      if (error) throw error

      return NextResponse.json({
        messages: messages || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      })
    } catch (error: any) {
      console.error('Voice messages error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch voice messages', message: error.message },
        { status: 500 }
      )
    }
  })
}
