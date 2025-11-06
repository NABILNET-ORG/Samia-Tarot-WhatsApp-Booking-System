/**
 * 📁 Media Management API
 * List and manage uploaded media files
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/media - List media files
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const fileType = searchParams.get('file_type')
      const usedFor = searchParams.get('used_for')
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      let query = supabaseAdmin
        .from('media_files')
        .select('*', { count: 'exact' })
        .eq('business_id', context.business.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Apply filters
      if (fileType) {
        query = query.eq('file_type', fileType)
      }

      if (usedFor) {
        query = query.eq('used_for', usedFor)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data: files, error, count } = await query

      if (error) throw error

      return NextResponse.json({
        files: files || [],
        total: count || 0,
        limit,
        offset,
      })
    } catch (error: any) {
      console.error('Media list error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch media files', message: error.message },
        { status: 500 }
      )
    }
  })
}
