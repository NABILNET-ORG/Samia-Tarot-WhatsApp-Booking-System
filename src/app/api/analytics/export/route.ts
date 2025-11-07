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
      const startDate = request.nextUrl.searchParams.get('start_date')
      const endDate = request.nextUrl.searchParams.get('end_date')

      let data: any[] = []

      if (type === 'conversations') {
        let query = supabaseAdmin
          .from('conversations')
          .select('*, customer:customers(*), messages(count)')
          .eq('business_id', context.business.id)

        if (startDate) {
          query = query.gte('created_at', startDate)
        }
        if (endDate) {
          query = query.lte('created_at', endDate)
        }

        query = query.order('created_at', { ascending: false })
        const { data: conversations } = await query
        data = conversations || []
      } else if (type === 'bookings') {
        let query = supabaseAdmin
          .from('bookings')
          .select('*, customer:customers(*), service:services(*)')
          .eq('business_id', context.business.id)

        if (startDate) {
          query = query.gte('created_at', startDate)
        }
        if (endDate) {
          query = query.lte('created_at', endDate)
        }

        query = query.order('created_at', { ascending: false })
        const { data: bookings } = await query
        data = bookings || []
      } else if (type === 'customers') {
        let query = supabaseAdmin
          .from('customers')
          .select('*')
          .eq('business_id', context.business.id)

        if (startDate) {
          query = query.gte('created_at', startDate)
        }
        if (endDate) {
          query = query.lte('created_at', endDate)
        }

        query = query.order('created_at', { ascending: false })
        const { data: customers } = await query
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
