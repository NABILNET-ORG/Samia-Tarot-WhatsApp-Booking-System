/**
 * 🤖 Individual Workflow API
 * Get, update, delete, activate workflows
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

const updateWorkflowSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
})

/**
 * GET /api/workflows/[id] - Get workflow with steps
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requirePermission(request, 'businesses', 'read', async (context) => {
    try {
      // Get workflow
      const { data: workflow, error: workflowError } = await supabaseAdmin
        .from('automation_workflows')
        .select('*')
        .eq('id', params.id)
        .eq('business_id', context.business.id)
        .single()

      if (workflowError) throw workflowError

      // Get steps
      const { data: steps, error: stepsError } = await supabaseAdmin
        .from('workflow_steps')
        .select('*')
        .eq('workflow_id', params.id)
        .order('position', { ascending: true })

      if (stepsError) throw stepsError

      return NextResponse.json({
        workflow: {
          ...workflow,
          steps: steps || []
        }
      })
    } catch (error: any) {
      console.error('Failed to fetch workflow:', error)
      return NextResponse.json(
        { error: 'Failed to fetch workflow', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * PATCH /api/workflows/[id] - Update workflow
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requirePermission(request, 'businesses', 'update', async (context) => {
    try {
      const body = await request.json()

      // Validate input
      const validation = updateWorkflowSchema.safeParse(body)
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

      // If activating, deactivate other workflows
      if (validatedData.is_active) {
        await supabaseAdmin
          .from('automation_workflows')
          .update({ is_active: false })
          .eq('business_id', context.business.id)
          .neq('id', params.id)
      }

      // Update workflow
      const { data: workflow, error } = await supabaseAdmin
        .from('automation_workflows')
        .update({
          ...validatedData,
          updated_by: context.employee.id,
          updated_at: new Date().toISOString(),
          activated_at: validatedData.is_active ? new Date().toISOString() : undefined,
        })
        .eq('id', params.id)
        .eq('business_id', context.business.id)
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabaseAdmin.from('activity_logs').insert({
        business_id: context.business.id,
        employee_id: context.employee.id,
        action: 'workflow.update',
        action_type: 'update',
        resource_type: 'automation_workflow',
        resource_id: params.id,
      })

      return NextResponse.json({
        workflow,
        message: 'Workflow updated successfully'
      })
    } catch (error: any) {
      console.error('Failed to update workflow:', error)
      return NextResponse.json(
        { error: 'Failed to update workflow', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/workflows/[id] - Delete workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requirePermission(request, 'businesses', 'update', async (context) => {
    try {
      // Delete workflow (cascade deletes steps and executions)
      const { error } = await supabaseAdmin
        .from('automation_workflows')
        .delete()
        .eq('id', params.id)
        .eq('business_id', context.business.id)

      if (error) throw error

      // Log activity
      await supabaseAdmin.from('activity_logs').insert({
        business_id: context.business.id,
        employee_id: context.employee.id,
        action: 'workflow.delete',
        action_type: 'delete',
        resource_type: 'automation_workflow',
        resource_id: params.id,
      })

      return NextResponse.json({
        success: true,
        message: 'Workflow deleted successfully'
      })
    } catch (error: any) {
      console.error('Failed to delete workflow:', error)
      return NextResponse.json(
        { error: 'Failed to delete workflow', message: error.message },
        { status: 500 }
      )
    }
  })
}
