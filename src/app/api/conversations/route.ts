/**
 * 💬 Conversations API
 * List and manage conversations
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { ConversationSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/conversations - Create new conversation manually
 */
export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()

      // Validate input with Zod
      const validation = ConversationSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validation.error.format()
          },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Check if conversation already exists for this phone
      const { data: existingConv } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('business_id', context.business.id)
        .eq('phone', validatedData.phone)
        .eq('is_active', true)
        .single()

      if (existingConv) {
        return NextResponse.json(
          { error: 'Active conversation already exists for this phone' },
          { status: 409 }
        )
      }

      // Create new conversation
      const { data: conversation, error } = await supabaseAdmin
        .from('conversations')
        .insert({
          business_id: context.business.id,
          customer_id: validatedData.customer_id,
          phone: validatedData.phone,
          mode: validatedData.mode || 'ai',
          current_state: 'GREETING',
          message_history: [],
          context_data: {},
          is_active: true,
          assigned_to: validatedData.assigned_employee_id,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabaseAdmin.from('activity_logs').insert({
        business_id: context.business.id,
        employee_id: context.employee.id,
        action: 'conversation.create',
        action_type: 'create',
        resource_type: 'conversation',
        resource_id: conversation.id,
        description: `Created conversation with ${validatedData.phone}`,
      })

      return NextResponse.json({
        conversation,
        message: 'Conversation created successfully'
      }, { status: 201 })
    } catch (error: any) {
      console.error('Failed to create conversation:', error)
      return NextResponse.json(
        { error: 'Failed to create conversation', message: error.message },
        { status: 500 }
      )
    }
  })
}

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
