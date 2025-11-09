/**
 * 🔧 Workflow Steps API
 * Manage individual steps in a workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

const createStepSchema = z.object({
  step_key: z.string().min(2).max(50).regex(/^[a-z0-9_]+$/),
  step_name: z.string().min(2).max(100),
  step_type: z.enum(['message', 'question', 'condition', 'action', 'ai_response']),
  position: z.number().int().min(0),
  config: z.record(z.string(), z.any()),
  next_step_id: z.string().uuid().optional().nullable(),
})

/**
 * POST /api/workflows/[id]/steps - Add step to workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requirePermission(request, 'businesses', 'update', async (context) => {
    try {
      const body = await request.json()

      // Validate input
      const validation = createStepSchema.safeParse(body)
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

      // Verify workflow belongs to business
      const { data: workflow } = await supabaseAdmin
        .from('automation_workflows')
        .select('id, business_id')
        .eq('id', params.id)
        .eq('business_id', context.business.id)
        .single()

      if (!workflow) {
        return NextResponse.json(
          { error: 'Workflow not found' },
          { status: 404 }
        )
      }

      // Create step
      const { data: step, error } = await supabaseAdmin
        .from('workflow_steps')
        .insert({
          workflow_id: params.id,
          step_key: validatedData.step_key,
          step_name: validatedData.step_name,
          step_type: validatedData.step_type,
          position: validatedData.position,
          config: validatedData.config,
          next_step_id: validatedData.next_step_id,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        step,
        message: 'Step added successfully'
      }, { status: 201 })
    } catch (error: any) {
      console.error('Failed to create step:', error)
      return NextResponse.json(
        { error: 'Failed to create step', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * PATCH /api/workflows/[id]/steps - Update multiple steps (reorder)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requirePermission(request, 'businesses', 'update', async (context) => {
    try {
      const body = await request.json()
      const { steps } = body

      if (!Array.isArray(steps)) {
        return NextResponse.json(
          { error: 'Steps must be an array' },
          { status: 400 }
        )
      }

      // Update each step's position
      for (const step of steps) {
        await supabaseAdmin
          .from('workflow_steps')
          .update({ position: step.position })
          .eq('id', step.id)
          .eq('workflow_id', params.id)
      }

      return NextResponse.json({
        success: true,
        message: 'Steps reordered successfully'
      })
    } catch (error: any) {
      console.error('Failed to reorder steps:', error)
      return NextResponse.json(
        { error: 'Failed to reorder steps', message: error.message },
        { status: 500 }
      )
    }
  })
}
