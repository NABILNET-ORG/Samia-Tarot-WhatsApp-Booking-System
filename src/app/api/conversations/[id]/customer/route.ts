/**
 * 👤 Customer Info API
 * Get customer details for a conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

type RouteParams = {
  params: { id: string }
}

/**
 * GET /api/conversations/[id]/customer - Get customer info
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params

      // Get conversation
      const { data: conversation, error: convError } = await supabaseAdmin
        .from('conversations')
        .select('customer_id, phone')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (convError || !conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      // Get customer if exists
      if (conversation.customer_id) {
        const { data: customer, error: custError } = await supabaseAdmin
          .from('customers')
          .select('*')
          .eq('id', conversation.customer_id)
          .single()

        if (!custError && customer) {
          return NextResponse.json({ customer })
        }
      }

      // Return minimal info if no customer record
      return NextResponse.json({
        customer: {
          phone: conversation.phone,
          created_at: new Date().toISOString(),
        },
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch customer', message: error.message },
        { status: 500 }
      )
    }
  })
}
