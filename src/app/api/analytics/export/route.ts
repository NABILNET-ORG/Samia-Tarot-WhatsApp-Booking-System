import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const format = request.nextUrl.searchParams.get('format') || 'json'
      const type = request.nextUrl.searchParams.get('type') || 'conversations'

      let data: any[] = []
      
      if (type === 'conversations') {
        const { data: conversations } = await supabaseAdmin
          .from('conversations')
          .select('*, customer:customers(*), messages(count)')
          .eq('business_id', context.business.id)
          .order('created_at', { ascending: false })
        data = conversations || []
      } else if (type === 'bookings') {
        const { data: bookings } = await supabaseAdmin
          .from('bookings')
          .select('*, customer:customers(*), service:services(*)')
          .eq('business_id', context.business.id)
          .order('created_at', { ascending: false })
        data = bookings || []
      } else if (type === 'customers') {
        const { data: customers } = await supabaseAdmin
          .from('customers')
          .select('*')
          .eq('business_id', context.business.id)
          .order('created_at', { ascending: false })
        data = customers || []
      }

      if (format === 'csv') {
        const csv = convertToCSV(data)
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${type}-${Date.now()}.csv"`
          }
        })
      }

      return NextResponse.json({ data, total: data.length })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''
  const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object')
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
  return [headers.join(','), ...rows].join('\n')
}
