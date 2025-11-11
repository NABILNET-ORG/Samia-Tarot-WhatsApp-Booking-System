/**
 * 📚 Knowledge Base List API
 * Lists fetched knowledge base content for a business
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { data: knowledge, error } = await supabaseAdmin
        .from('knowledge_base_content')
        .select('*')
        .eq('business_id', context.business.id)
        .order('last_updated', { ascending: false })

      if (error) {
        console.error('Error fetching knowledge base:', error)
        return NextResponse.json({ error: 'Failed to fetch knowledge base' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        knowledge: knowledge || [],
        total: knowledge?.length || 0
      })
    } catch (error: any) {
      console.error('Error in knowledge-base/list:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
