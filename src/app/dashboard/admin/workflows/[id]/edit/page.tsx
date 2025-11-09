/**
 * 🤖 Workflow Editor
 * Visual builder for automation workflows
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'

type WorkflowStep = {
  id?: string
  step_key: string
  step_name: string
  step_type: 'message' | 'question' | 'condition' | 'action' | 'ai_response'
  position: number
  config: Record<string, any>
  next_step_id?: string | null
}

type Workflow = {
  id: string
  name: string
  description: string
  is_active: boolean
  steps: WorkflowStep[]
}

export default function WorkflowEditorPage() {
  const router = useRouter()
  const params = useParams()
  const workflowId = params.id as string

  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddStep, setShowAddStep] = useState(false)
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null)

  useEffect(() => {
    loadWorkflow()
  }, [workflowId])

  async function loadWorkflow() {
    try {
      setLoading(true)
      const response = await fetch(`/api/workflows/${workflowId}`)
      const data = await response.json()

      if (data.workflow) {
        setWorkflow(data.workflow)
      }
    } catch (error) {
      console.error('Error loading workflow:', error)
      toast.error('Failed to load workflow')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveStep(step: WorkflowStep) {
    try {
      const url = step.id
        ? `/api/workflows/${workflowId}/steps/${step.id}`
        : `/api/workflows/${workflowId}/steps`

      const method = step.id ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(step),
      })

      if (response.ok) {
        toast.success(step.id ? 'Step updated' : 'Step added')
        setShowAddStep(false)
        setEditingStep(null)
        loadWorkflow()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save step')
      }
    } catch (error) {
      console.error('Error saving step:', error)
      toast.error('Failed to save step')
    }
  }

  async function handleDeleteStep(stepId: string) {
    if (!confirm('Delete this step?')) return

    try {
      const response = await fetch(`/api/workflows/${workflowId}/steps/${stepId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Step deleted')
        loadWorkflow()
      } else {
        toast.error('Failed to delete step')
      }
    } catch (error) {
      console.error('Error deleting step:', error)
      toast.error('Failed to delete step')
    }
  }

  async function handleReorderSteps(steps: WorkflowStep[]) {
    try {
      const reorderedSteps = steps.map((step, index) => ({
        id: step.id,
        position: index,
      }))

      const response = await fetch(`/api/workflows/${workflowId}/steps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: reorderedSteps }),
      })

      if (response.ok) {
        toast.success('Steps reordered')
        loadWorkflow()
      } else {
        toast.error('Failed to reorder steps')
      }
    } catch (error) {
      console.error('Error reordering steps:', error)
      toast.error('Failed to reorder steps')
    }
  }

  async function handleActivate() {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !workflow?.is_active }),
      })

      if (response.ok) {
        toast.success(workflow?.is_active ? 'Workflow deactivated' : 'Workflow activated')
        loadWorkflow()
      } else {
        toast.error('Failed to update workflow')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to update workflow')
    }
  }

  function moveStepUp(index: number) {
    if (!workflow || index === 0) return
    const newSteps = [...workflow.steps]
    ;[newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]]
    handleReorderSteps(newSteps)
  }

  function moveStepDown(index: number) {
    if (!workflow || index === workflow.steps.length - 1) return
    const newSteps = [...workflow.steps]
    ;[newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]]
    handleReorderSteps(newSteps)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflow not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/admin/workflows')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {workflow.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{workflow.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleActivate}
              className={`px-4 py-2 rounded-lg font-medium ${
                workflow.is_active
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {workflow.is_active ? '● Active' : 'Activate'}
            </button>
          </div>
        </div>

        {/* Steps List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Workflow Steps ({workflow.steps?.length || 0})
            </h2>
            <button
              onClick={() => setShowAddStep(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              + Add Step
            </button>
          </div>

          {!workflow.steps || workflow.steps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No steps yet. Add your first step to start building the automation flow.
              </p>
              <button
                onClick={() => setShowAddStep(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Add First Step
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {workflow.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  {/* Position */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveStepUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ▲
                    </button>
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </span>
                    <button
                      onClick={() => moveStepDown(index)}
                      disabled={index === workflow.steps.length - 1}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Step Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                        {step.step_type}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {step.step_name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.step_type === 'message' && `Message: "${step.config.text}"`}
                      {step.step_type === 'question' && `Asks: "${step.config.text}" → Saves to: ${step.config.variable}`}
                      {step.step_type === 'condition' && `If ${step.config.variable} ${step.config.operator} ${step.config.value}`}
                      {step.step_type === 'action' && `Action: ${step.config.action}`}
                      {step.step_type === 'ai_response' && `AI handles this step`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingStep(step)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteStep(step.id!)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Step Modal */}
        {(showAddStep || editingStep) && (
          <StepModal
            step={editingStep}
            position={workflow.steps?.length || 0}
            onSave={handleSaveStep}
            onClose={() => {
              setShowAddStep(false)
              setEditingStep(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

// Step Modal Component
function StepModal({
  step,
  position,
  onSave,
  onClose,
}: {
  step: WorkflowStep | null
  position: number
  onSave: (step: WorkflowStep) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<WorkflowStep>(
    step || {
      step_key: '',
      step_name: '',
      step_type: 'message',
      position,
      config: {},
    }
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate
    if (!formData.step_name || !formData.step_key) {
      toast.error('Step name and key are required')
      return
    }

    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {step ? 'Edit Step' : 'Add New Step'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Step Type *
            </label>
            <select
              value={formData.step_type}
              onChange={(e) => setFormData({ ...formData, step_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="message">📤 Send Message</option>
              <option value="question">❓ Ask Question</option>
              <option value="condition">🔀 Condition (If/Then)</option>
              <option value="action">⚡ Action</option>
              <option value="ai_response">🤖 AI Response</option>
            </select>
          </div>

          {/* Step Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Step Name *
            </label>
            <input
              type="text"
              value={formData.step_name}
              onChange={(e) => setFormData({ ...formData, step_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g. Send greeting message"
            />
          </div>

          {/* Step Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Step Key * (unique identifier)
            </label>
            <input
              type="text"
              value={formData.step_key}
              onChange={(e) => setFormData({ ...formData, step_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
              placeholder="e.g. greeting_message"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Lowercase letters, numbers, underscores only
            </p>
          </div>

          {/* Configuration based on step type */}
          {formData.step_type === 'message' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message Text *
              </label>
              <textarea
                value={formData.config.text || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, text: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={4}
                placeholder="Enter the message to send to the customer..."
              />
            </div>
          )}

          {formData.step_type === 'question' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Question Text *
                </label>
                <textarea
                  value={formData.config.text || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, text: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="What would you like to ask the customer?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Save Response To Variable *
                </label>
                <input
                  type="text"
                  value={formData.config.variable || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, variable: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  placeholder="e.g. customer_name"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This variable can be used in later steps
                </p>
              </div>
            </>
          )}

          {formData.step_type === 'action' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Action Type *
              </label>
              <select
                value={formData.config.action || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, action: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select an action...</option>
                <option value="create_booking">Create Booking</option>
                <option value="send_payment_link">Send Payment Link</option>
                <option value="list_services">Show Services List</option>
                <option value="update_customer">Update Customer Info</option>
                <option value="notify_employee">Notify Employee</option>
              </select>
            </div>
          )}

          {formData.step_type === 'ai_response' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                AI Prompt
              </label>
              <textarea
                value={formData.config.prompt || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, prompt: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Instruct the AI on how to handle this step..."
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {step ? 'Update Step' : 'Add Step'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
