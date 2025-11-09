/**
 * 📝 AI Templates API - Single Template Operations
 * Update and delete specific templates
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { UpdateTemplateSchema } from '@/lib/validation/schemas'

/**
 * PATCH /api/templates/[id] - Update template
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
      const validation = UpdateTemplateSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        )
      }

      // Check if template exists and belongs to this business
      const { data: existingTemplate, error: fetchError } = await supabaseAdmin
        .from('prompt_templates')
        .select('id, business_id')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (fetchError || !existingTemplate) {
        return NextResponse.json(
          { error: 'Template not found or unauthorized' },
          { status: 404 }
        )
      }

      const validatedData = validation.data

      // Update template
      const { data: template, error } = await supabaseAdmin
        .from('prompt_templates')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('business_id', context.business.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        template,
        message: 'Template updated successfully'
      })
    } catch (error: any) {
      console.error('Template update error:', error)
      return NextResponse.json(
        { error: 'Failed to update template', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/templates/[id] - Delete template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params

      // Check if template exists and belongs to this business
      const { data: existingTemplate, error: fetchError } = await supabaseAdmin
        .from('prompt_templates')
        .select('id, business_id')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (fetchError || !existingTemplate) {
        return NextResponse.json(
          { error: 'Template not found or unauthorized' },
          { status: 404 }
        )
      }

      // Delete template
      const { error } = await supabaseAdmin
        .from('prompt_templates')
        .delete()
        .eq('id', id)
        .eq('business_id', context.business.id)

      if (error) throw error

      return NextResponse.json({
        message: 'Template deleted successfully'
      })
    } catch (error: any) {
      console.error('Template deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete template', message: error.message },
        { status: 500 }
      )
    }
  })
}
