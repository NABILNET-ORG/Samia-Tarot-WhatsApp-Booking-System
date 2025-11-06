/**
 * 💬 Canned Responses API - Single Response Operations
 * Update and delete specific canned responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

// Validation schema
const updateCannedResponseSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(2000).optional(),
  category: z.string().max(50).optional(),
  shortcut: z.string().max(20).optional().nullable(),
  is_active: z.boolean().optional(),
})

/**
 * PATCH /api/canned-responses/[id] - Update canned response
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params
      const body = await request.json()

      // Validate input
      const validation = updateCannedResponseSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        )
      }

      // Check if canned response exists and belongs to this business
      const { data: existingResponse, error: fetchError } = await supabaseAdmin
        .from('canned_responses')
        .select('id, business_id')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (fetchError || !existingResponse) {
        return NextResponse.json(
          { error: 'Quick reply not found or unauthorized' },
          { status: 404 }
        )
      }

      // If shortcut is provided, check for duplicates within the same business
      if (validation.data.shortcut) {
        const { data: duplicate } = await supabaseAdmin
          .from('canned_responses')
          .select('id')
          .eq('business_id', context.business.id)
          .eq('shortcut', validation.data.shortcut)
          .neq('id', id)
          .single()

        if (duplicate) {
          return NextResponse.json(
            { error: 'Shortcut already exists in your business' },
            { status: 400 }
          )
        }
      }

      // Update canned response
      const { data: response, error } = await supabaseAdmin
        .from('canned_responses')
        .update({
          ...validation.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('business_id', context.business.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        response,
        message: 'Quick reply updated successfully'
      })
    } catch (error: any) {
      console.error('Canned response update error:', error)
      return NextResponse.json(
        { error: 'Failed to update quick reply', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/canned-responses/[id] - Delete canned response
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params

      // Check if canned response exists and belongs to this business
      const { data: existingResponse, error: fetchError } = await supabaseAdmin
        .from('canned_responses')
        .select('id, business_id')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (fetchError || !existingResponse) {
        return NextResponse.json(
          { error: 'Quick reply not found or unauthorized' },
          { status: 404 }
        )
      }

      // Soft delete by setting is_active to false
      const { error } = await supabaseAdmin
        .from('canned_responses')
        .update({ is_active: false })
        .eq('id', id)
        .eq('business_id', context.business.id)

      if (error) throw error

      return NextResponse.json({
        message: 'Quick reply deleted successfully'
      })
    } catch (error: any) {
      console.error('Canned response deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete quick reply', message: error.message },
        { status: 500 }
      )
    }
  })
}
