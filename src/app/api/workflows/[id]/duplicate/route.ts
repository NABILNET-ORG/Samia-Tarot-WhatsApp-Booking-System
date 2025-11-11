/**
 * 🔄 Duplicate Workflow
 * Clone an existing workflow with all its steps
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'

/**
 * POST /api/workflows/[id]/duplicate - Duplicate workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requirePermission(request, 'businesses', 'update', async (context) => {
    try {
      // Get original workflow
      const { data: originalWorkflow, error: workflowError } = await supabaseAdmin
        .from('automation_workflows')
        .select('*')
        .eq('id', params.id)
        .eq('business_id', context.business.id)
        .single()

      if (workflowError) throw workflowError

      // Get original steps
      const { data: originalSteps, error: stepsError } = await supabaseAdmin
        .from('workflow_steps')
        .select('*')
        .eq('workflow_id', params.id)
        .order('position')

      if (stepsError) throw stepsError

      // Create new workflow (copy)
      const { data: newWorkflow, error: createError } = await supabaseAdmin
        .from('automation_workflows')
        .insert({
          business_id: context.business.id,
          name: `${originalWorkflow.name} (Copy)`,
          description: originalWorkflow.description,
          trigger_type: originalWorkflow.trigger_type,
          is_active: false, // Start inactive
          is_default: false,
          version: 1,
          created_by: context.employee.id,
          config_json: originalWorkflow.config_json,
        })
        .select()
        .single()

      if (createError) throw createError

      // Clone all steps
      if (originalSteps && originalSteps.length > 0) {
        const newSteps = originalSteps.map((step: any) => ({
          workflow_id: newWorkflow.id,
          step_key: step.step_key,
          step_name: step.step_name,
          step_type: step.step_type,
          position: step.position,
          config: step.config,
          // Note: next_step_id references will be recreated if needed
        }))

        await supabaseAdmin
          .from('workflow_steps')
          .insert(newSteps)
      }

      // Log activity
      await supabaseAdmin.from('activity_logs').insert({
        business_id: context.business.id,
        employee_id: context.employee.id,
        action: 'workflow.duplicate',
        action_type: 'create',
        resource_type: 'automation_workflow',
        resource_id: newWorkflow.id,
        description: `Duplicated workflow: ${originalWorkflow.name}`,
      })

      return NextResponse.json({
        workflow: newWorkflow,
        message: 'Workflow duplicated successfully',
        steps_copied: originalSteps?.length || 0
      }, { status: 201 })
    } catch (error: any) {
      console.error('Failed to duplicate workflow:', error)
      return NextResponse.json(
        { error: 'Failed to duplicate workflow', message: error.message },
        { status: 500 }
      )
    }
  })
}
