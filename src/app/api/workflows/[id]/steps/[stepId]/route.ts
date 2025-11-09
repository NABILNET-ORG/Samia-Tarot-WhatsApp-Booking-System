/**
 * 🔧 Individual Workflow Step API
 * Update and delete specific steps
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

const updateStepSchema = z.object({
  step_name: z.string().min(2).max(100).optional(),
  position: z.number().int().min(0).optional(),
  config: z.record(z.string(), z.any()).optional(),
  next_step_id: z.string().uuid().optional().nullable(),
})

/**
 * PATCH /api/workflows/[id]/steps/[stepId] - Update step
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } }
) {
  return requirePermission(request, 'businesses', 'update', async (context) => {
    try {
      const body = await request.json()

      // Validate input
      const validation = updateStepSchema.safeParse(body)
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

      // Update step
      const { data: step, error } = await supabaseAdmin
        .from('workflow_steps')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.stepId)
        .eq('workflow_id', params.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        step,
        message: 'Step updated successfully'
      })
    } catch (error: any) {
      console.error('Failed to update step:', error)
      return NextResponse.json(
        { error: 'Failed to update step', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/workflows/[id]/steps/[stepId] - Delete step
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; stepId: string } }
) {
  return requirePermission(request, 'businesses', 'update', async (context) => {
    try {
      // Delete step
      const { error } = await supabaseAdmin
        .from('workflow_steps')
        .delete()
        .eq('id', params.stepId)
        .eq('workflow_id', params.id)

      if (error) throw error

      // Reorder remaining steps
      const { data: remainingSteps } = await supabaseAdmin
        .from('workflow_steps')
        .select('id, position')
        .eq('workflow_id', params.id)
        .order('position')

      if (remainingSteps) {
        for (let i = 0; i < remainingSteps.length; i++) {
          await supabaseAdmin
            .from('workflow_steps')
            .update({ position: i })
            .eq('id', remainingSteps[i].id)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Step deleted successfully'
      })
    } catch (error: any) {
      console.error('Failed to delete step:', error)
      return NextResponse.json(
        { error: 'Failed to delete step', message: error.message },
        { status: 500 }
      )
    }
  })
}
