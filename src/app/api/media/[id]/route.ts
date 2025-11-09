/**
 * 📁 Media Management API - Single File Operations
 * Delete specific media files
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { UpdateMediaSchema } from '@/lib/validation/schemas'

/**
 * DELETE /api/media/[id] - Delete media file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params

      // Get media file details
      const { data: mediaFile, error: fetchError } = await supabaseAdmin
        .from('media_files')
        .select('id, business_id, file_url, file_name')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .is('deleted_at', null)
        .single()

      if (fetchError || !mediaFile) {
        return NextResponse.json(
          { error: 'Media file not found or already deleted' },
          { status: 404 }
        )
      }

      // Extract file path from URL
      // URL format: https://{project}.supabase.co/storage/v1/object/public/media-files/{path}
      const urlParts = mediaFile.file_url.split('/media-files/')
      const filePath = urlParts[1] || ''

      if (!filePath) {
        console.error('Could not extract file path from URL:', mediaFile.file_url)
      }

      // Soft delete in database (mark as deleted)
      const { error: updateError } = await supabaseAdmin
        .from('media_files')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError

      // Try to delete from storage (optional - soft delete allows recovery)
      if (filePath) {
        const { error: storageError } = await supabaseAdmin.storage
          .from('media-files')
          .remove([filePath])

        if (storageError) {
          console.error('Storage deletion error (non-critical):', storageError)
          // Don't fail the request if storage deletion fails
          // The file is still marked as deleted in the database
        }
      }

      return NextResponse.json({
        message: 'Media file deleted successfully',
      })
    } catch (error: any) {
      console.error('Media deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete media file', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * PATCH /api/media/[id] - Update media file metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()

      // Validate input with Zod
      const validation = UpdateMediaSchema.safeParse(body)
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
      const { id } = params

      // Verify media file belongs to this business
      const { data: mediaFile, error: fetchError } = await supabaseAdmin
        .from('media_files')
        .select('id, business_id')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .is('deleted_at', null)
        .single()

      if (fetchError || !mediaFile) {
        return NextResponse.json(
          { error: 'Media file not found' },
          { status: 404 }
        )
      }

      // Update media file
      const { data: updatedMedia, error: updateError } = await supabaseAdmin
        .from('media_files')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      return NextResponse.json({
        file: updatedMedia,
        message: 'Media file updated successfully'
      })
    } catch (error: any) {
      console.error('Media update error:', error)
      return NextResponse.json(
        { error: 'Failed to update media file', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * GET /api/media/[id] - Get single media file details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params

      const { data: mediaFile, error } = await supabaseAdmin
        .from('media_files')
        .select('*')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .is('deleted_at', null)
        .single()

      if (error || !mediaFile) {
        return NextResponse.json(
          { error: 'Media file not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ file: mediaFile })
    } catch (error: any) {
      console.error('Media fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch media file', message: error.message },
        { status: 500 }
      )
    }
  })
}
