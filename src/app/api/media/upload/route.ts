/**
 * 📁 Media Upload API
 * Handle file uploads to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * POST /api/media/upload - Upload file to Supabase Storage
 */
export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File
      const fileType = formData.get('file_type') as string
      const usedFor = formData.get('used_for') as string | null

      // Validate file exists
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        )
      }

      // Validate file type parameter
      const validFileTypes = ['image', 'document', 'logo', 'avatar', 'attachment', 'voice']
      if (!fileType || !validFileTypes.includes(fileType)) {
        return NextResponse.json(
          { error: 'Invalid file_type. Must be one of: image, document, logo, avatar, attachment, voice' },
          { status: 400 }
        )
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        )
      }

      // Validate MIME type
      const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_AUDIO_TYPES]
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} not allowed. Allowed types: images, PDFs, Word docs, audio files` },
          { status: 400 }
        )
      }

      // Generate unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${context.business.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const bucketName = 'media-files'

      // Upload to Supabase Storage
      const fileBuffer = await file.arrayBuffer()
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload file to storage', message: uploadError.message },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      // Get image dimensions if it's an image
      let width: number | null = null
      let height: number | null = null

      if (ALLOWED_IMAGE_TYPES.includes(file.type) && typeof Image !== 'undefined') {
        // Note: In a real implementation, you might want to use a library like 'sharp'
        // to get image dimensions on the server side
        // For now, we'll leave dimensions as null and let the client provide them
      }

      // Save metadata to database
      const { data: mediaFile, error: dbError } = await supabaseAdmin
        .from('media_files')
        .insert({
          business_id: context.business.id,
          file_name: file.name,
          file_url: publicUrl,
          file_type: fileType,
          mime_type: file.type,
          file_size_bytes: file.size,
          width,
          height,
          used_for: usedFor || null,
          uploaded_by: context.employee.id,
          cdn_url: publicUrl, // Same as file_url for now
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        // Try to clean up the uploaded file
        await supabaseAdmin.storage.from(bucketName).remove([fileName])
        return NextResponse.json(
          { error: 'Failed to save file metadata', message: dbError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        file: mediaFile,
        message: 'File uploaded successfully',
      })
    } catch (error: any) {
      console.error('Media upload error:', error)
      return NextResponse.json(
        { error: 'Failed to upload file', message: error.message },
        { status: 500 }
      )
    }
  })
}
