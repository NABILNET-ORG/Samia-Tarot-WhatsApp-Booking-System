/**
 * 🤖 Automation Workflows API
 * Manage conversation automation workflows
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext, requirePermission } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

// Validation schema
const createWorkflowSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  trigger_type: z.enum(['new_conversation', 'keyword', 'schedule']).default('new_conversation'),
  is_default: z.boolean().default(false),
})

/**
 * GET /api/workflows - List all workflows for business
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { data: workflows, error } = await supabaseAdmin
        .from('automation_workflows')
        .select('*')
        .eq('business_id', context.business.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get step count for each workflow
      const workflowsWithCounts = await Promise.all(
        (workflows || []).map(async (workflow: any) => {
          const { count } = await supabaseAdmin
            .from('workflow_steps')
            .select('*', { count: 'exact', head: true })
            .eq('workflow_id', workflow.id)

          return {
            ...workflow,
            step_count: count || 0
          }
        })
      )

      return NextResponse.json({ workflows: workflowsWithCounts })
    } catch (error: any) {
      console.error('Failed to fetch workflows:', error)
      return NextResponse.json(
        { error: 'Failed to fetch workflows', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/workflows - Create new workflow
 */
export async function POST(request: NextRequest) {
  return requirePermission(request, 'businesses', 'update', async (context) => {
    try {
      const body = await request.json()

      // Validate input
      const validation = createWorkflowSchema.safeParse(body)
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

      // If setting as default, deactivate other defaults
      if (validatedData.is_default) {
        await supabaseAdmin
          .from('automation_workflows')
          .update({ is_default: false })
          .eq('business_id', context.business.id)
      }

      // Create workflow
      const { data: workflow, error } = await supabaseAdmin
        .from('automation_workflows')
        .insert({
          business_id: context.business.id,
          name: validatedData.name,
          description: validatedData.description,
          trigger_type: validatedData.trigger_type,
          is_default: validatedData.is_default,
          is_active: false, // Start inactive until configured
          version: 1,
          created_by: context.employee.id,
        })
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabaseAdmin.from('activity_logs').insert({
        business_id: context.business.id,
        employee_id: context.employee.id,
        action: 'workflow.create',
        action_type: 'create',
        resource_type: 'automation_workflow',
        resource_id: workflow.id,
        description: `Created workflow: ${validatedData.name}`,
      })

      return NextResponse.json({
        workflow,
        message: 'Workflow created successfully'
      }, { status: 201 })
    } catch (error: any) {
      console.error('Failed to create workflow:', error)
      return NextResponse.json(
        { error: 'Failed to create workflow', message: error.message },
        { status: 500 }
      )
    }
  })
}
