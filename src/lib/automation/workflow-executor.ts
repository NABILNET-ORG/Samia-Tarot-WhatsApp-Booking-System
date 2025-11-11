/**
 * 🤖 Workflow Execution Engine
 * Executes automation workflows step by step
 */

import { supabaseAdmin } from '@/lib/supabase/client'

export type WorkflowStep = {
  id: string
  step_key: string
  step_name: string
  step_type: 'message' | 'question' | 'condition' | 'action' | 'ai_response'
  position: number
  config: Record<string, any>
  next_step_id: string | null
}

export type WorkflowExecution = {
  id: string
  workflow_id: string
  conversation_id: string
  current_step_id: string | null
  current_step_key: string | null
  variables: Record<string, any>
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned'
}

/**
 * Start a new workflow execution for a conversation
 */
export async function startWorkflowExecution(
  businessId: string,
  conversationId: string
): Promise<WorkflowExecution | null> {
  try {
    // Find active workflow for business
    const { data: workflow } = await supabaseAdmin
      .from('automation_workflows')
      .select('id')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single()

    if (!workflow) {
      console.log('No active workflow found for business:', businessId)
      return null
    }

    // Get first step
    const { data: firstStep } = await supabaseAdmin
      .from('workflow_steps')
      .select('id, step_key')
      .eq('workflow_id', workflow.id)
      .order('position')
      .limit(1)
      .single()

    if (!firstStep) {
      console.log('No steps found in workflow:', workflow.id)
      return null
    }

    // Create execution record
    const { data: execution, error } = await supabaseAdmin
      .from('workflow_executions')
      .insert({
        workflow_id: workflow.id,
        conversation_id: conversationId,
        business_id: businessId,
        current_step_id: firstStep.id,
        current_step_key: firstStep.step_key,
        status: 'in_progress',
        variables: {},
        steps_history: [],
      })
      .select()
      .single()

    if (error) throw error

    return execution as WorkflowExecution
  } catch (error) {
    console.error('Failed to start workflow execution:', error)
    return null
  }
}

/**
 * Get current execution for a conversation
 */
export async function getWorkflowExecution(
  conversationId: string
): Promise<WorkflowExecution | null> {
  const { data } = await supabaseAdmin
    .from('workflow_executions')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('status', 'in_progress')
    .single()

  return data as WorkflowExecution | null
}

/**
 * Get current step for an execution
 */
export async function getCurrentStep(
  execution: WorkflowExecution
): Promise<WorkflowStep | null> {
  if (!execution.current_step_id && !execution.current_step_key) return null

  let data

  if (execution.current_step_id) {
    const result = await supabaseAdmin
      .from('workflow_steps')
      .select('*')
      .eq('id', execution.current_step_id)
      .single()
    data = result.data
  } else if (execution.current_step_key) {
    // Fallback to finding by step_key
    const result = await supabaseAdmin
      .from('workflow_steps')
      .select('*')
      .eq('workflow_id', execution.workflow_id)
      .eq('step_key', execution.current_step_key)
      .single()
    data = result.data
  }

  return data as WorkflowStep | null
}

/**
 * Resolve step_key to actual step ID
 */
async function resolveStepKey(workflowId: string, stepKey: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('workflow_steps')
    .select('id')
    .eq('workflow_id', workflowId)
    .eq('step_key', stepKey)
    .single()

  return data?.id || null
}

/**
 * Get next step ID (handles both direct ID and step_key resolution)
 */
async function getNextStepId(
  execution: WorkflowExecution,
  step: WorkflowStep,
  nextStepKey?: string
): Promise<string | null> {
  // Priority: direct next_step_id > step_key from config > sequential by position
  if (step.next_step_id) {
    return step.next_step_id
  }

  if (nextStepKey) {
    return await resolveStepKey(execution.workflow_id, nextStepKey)
  }

  // Get next step by position
  const { data } = await supabaseAdmin
    .from('workflow_steps')
    .select('id')
    .eq('workflow_id', execution.workflow_id)
    .gt('position', step.position)
    .order('position')
    .limit(1)
    .single()

  return data?.id || null
}

/**
 * Execute a workflow step
 */
export async function executeStep(
  execution: WorkflowExecution,
  step: WorkflowStep,
  customerResponse?: string
): Promise<{
  message?: string
  nextStepId?: string | null
  completed?: boolean
  variables?: Record<string, any>
  useAI?: boolean
}> {
  const result: any = {}

  switch (step.step_type) {
    case 'message':
      // Send message to customer
      result.message = step.config.text || step.config.message
      result.nextStepId = await getNextStepId(execution, step)
      break

    case 'question':
      // Ask question and wait for response
      if (!customerResponse) {
        // First time - send the question
        result.message = step.config.text || step.config.question
        // Don't advance step yet - wait for customer response
        result.nextStepId = step.id // Stay on same step
      } else {
        // Customer responded - validate and save
        const variableName = step.config.variable || step.config.variable_name
        const validation = step.config.validation || {}

        // Basic validation
        if (validation.required && !customerResponse) {
          result.message = step.config.retry_message || 'Please provide a valid response'
          result.nextStepId = step.id // Stay on same step
        } else {
          // Save variable
          result.variables = {
            ...execution.variables,
            [variableName]: customerResponse
          }
          result.nextStepId = await getNextStepId(execution, step)
        }
      }
      break

    case 'condition':
      // Evaluate condition and branch
      const variable = execution.variables[step.config.variable]
      const operator = step.config.operator
      const value = step.config.value

      let conditionMet = false

      switch (operator) {
        case 'equals':
          conditionMet = variable === value
          break
        case 'contains':
          conditionMet = String(variable).includes(String(value))
          break
        case 'greater_than':
          conditionMet = Number(variable) > Number(value)
          break
        case 'exists':
          conditionMet = variable !== undefined && variable !== null
          break
      }

      // Resolve step keys for conditional branching
      const trueStepKey = step.config.true_step
      const falseStepKey = step.config.false_step

      if (conditionMet) {
        result.nextStepId = step.config.next_step_on_success ||
          (trueStepKey ? await resolveStepKey(execution.workflow_id, trueStepKey) : null)
      } else {
        result.nextStepId = step.config.next_step_on_failure ||
          (falseStepKey ? await resolveStepKey(execution.workflow_id, falseStepKey) : null)
      }
      break

    case 'action':
      // Execute action
      await executeAction(step.config, execution.variables)
      result.nextStepId = await getNextStepId(execution, step)
      break

    case 'ai_response':
      // Let AI handle this step
      result.message = null // AI will generate response
      result.useAI = true
      result.nextStepId = await getNextStepId(execution, step)
      break
  }

  return result
}

/**
 * Execute an action (create booking, send payment, etc.)
 */
async function executeAction(
  actionConfig: Record<string, any>,
  variables: Record<string, any>
): Promise<void> {
  const actionType = actionConfig.action || actionConfig.type

  switch (actionType) {
    case 'create_booking':
      // Create booking from collected variables
      console.log('Would create booking with:', variables)
      // Implementation: Call booking creation logic
      break

    case 'send_payment_link':
      // Send payment link
      console.log('Would send payment link')
      break

    case 'update_customer':
      // Update customer record
      console.log('Would update customer:', variables)
      break

    case 'notify_employee':
      // Notify employee
      console.log('Would notify employee')
      break
  }
}

/**
 * Move execution to next step
 */
export async function moveToNextStep(
  executionId: string,
  nextStepId: string | null,
  variables?: Record<string, any>
): Promise<void> {
  const updates: any = {
    current_step_id: nextStepId,
    last_activity_at: new Date().toISOString(),
  }

  // Also update current_step_key for better debugging
  if (nextStepId) {
    const { data: nextStep } = await supabaseAdmin
      .from('workflow_steps')
      .select('step_key')
      .eq('id', nextStepId)
      .single()

    if (nextStep) {
      updates.current_step_key = nextStep.step_key
    }
  }

  if (variables) {
    updates.variables = variables
  }

  if (!nextStepId) {
    // Workflow completed
    updates.status = 'completed'
    updates.completed_at = new Date().toISOString()
  }

  await supabaseAdmin
    .from('workflow_executions')
    .update(updates)
    .eq('id', executionId)
}

/**
 * Process customer message within workflow context
 */
export async function processWorkflowMessage(
  conversationId: string,
  customerMessage: string
): Promise<{
  shouldUseAI: boolean
  responseMessage?: string
  workflowCompleted?: boolean
}> {
  // Get current execution
  const execution = await getWorkflowExecution(conversationId)

  if (!execution) {
    // No active workflow - use default AI
    return { shouldUseAI: true }
  }

  // Get current step
  const currentStep = await getCurrentStep(execution)

  if (!currentStep) {
    // No current step - workflow might be completed
    return { shouldUseAI: true }
  }

  // Execute the step with customer response
  const result = await executeStep(execution, currentStep, customerMessage)

  // Update execution
  if (result.variables) {
    await supabaseAdmin
      .from('workflow_executions')
      .update({
        variables: result.variables,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', execution.id)
  }

  // Move to next step if needed
  if (result.nextStepId && result.nextStepId !== currentStep.id) {
    await moveToNextStep(execution.id, result.nextStepId, result.variables)

    // Get next step and execute it immediately if it's a message/action
    if (result.nextStepId) {
      const { data: nextStep } = await supabaseAdmin
        .from('workflow_steps')
        .select('*')
        .eq('id', result.nextStepId)
        .single()

      if (nextStep && (nextStep.step_type === 'message' || nextStep.step_type === 'action')) {
        const nextResult = await executeStep(execution, nextStep as WorkflowStep)
        if (nextResult.message) {
          result.message = nextResult.message
        }
        if (nextResult.nextStepId) {
          await moveToNextStep(execution.id, nextResult.nextStepId)
        }
      }
    }
  }

  return {
    shouldUseAI: result.useAI || false,
    responseMessage: result.message,
    workflowCompleted: result.completed || false,
  }
}
