/**
 * 🤖 Automation Workflows Management
 * Create and manage conversation automation workflows
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

type Workflow = {
  id: string
  name: string
  description: string
  is_active: boolean
  is_default: boolean
  created_at: string
  times_executed: number
  success_count: number
  step_count: number
}

export default function WorkflowsPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    is_default: false,
  })

  useEffect(() => {
    loadWorkflows()
  }, [])

  async function loadWorkflows() {
    try {
      setLoading(true)
      const response = await fetch('/api/workflows')
      const data = await response.json()

      if (data.workflows) {
        setWorkflows(data.workflows)
      }
    } catch (error) {
      console.error('Error loading workflows:', error)
      toast.error('Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateWorkflow() {
    if (!newWorkflow.name) {
      toast.error('Workflow name is required')
      return
    }

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkflow),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Workflow created successfully')
        setShowCreateModal(false)
        setNewWorkflow({ name: '', description: '', is_default: false })
        // Navigate to editor
        router.push(`/dashboard/admin/workflows/${data.workflow.id}/edit`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create workflow')
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
      toast.error('Failed to create workflow')
    }
  }

  async function handleActivate(workflowId: string, currentlyActive: boolean) {
    if (currentlyActive) {
      if (!confirm('Deactivate this workflow? The bot will stop using it.')) return
    }

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentlyActive }),
      })

      if (response.ok) {
        toast.success(currentlyActive ? 'Workflow deactivated' : 'Workflow activated')
        loadWorkflows()
      } else {
        toast.error('Failed to update workflow')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to update workflow')
    }
  }

  async function handleDelete(workflowId: string, workflowName: string) {
    if (!confirm(`Delete workflow "${workflowName}"? This cannot be undone.`)) return

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Workflow deleted')
        loadWorkflows()
      } else {
        toast.error('Failed to delete workflow')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to delete workflow')
    }
  }

  async function handleDuplicate(workflowId: string, workflowName: string) {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/duplicate`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Duplicated "${workflowName}" with ${data.steps_copied} steps`)
        loadWorkflows()
      } else {
        toast.error('Failed to duplicate workflow')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to duplicate workflow')
    }
  }

  async function handleRestoreDefault() {
    if (!confirm('Restore default workflow? This will create a new workflow with the standard booking flow.')) return

    try {
      // Create new workflow with default steps
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Default Booking Flow (Restored)',
          description: 'Standard conversation flow: Greeting → Services → Selection → Info → Booking → Payment',
          is_default: false,
        }),
      })

      if (response.ok) {
        toast.success('Default workflow template created - Now add steps to configure it')
        loadWorkflows()
      } else {
        toast.error('Failed to create default workflow')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to restore default')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Automation Workflows
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize your conversation automation flow
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRestoreDefault}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ↺ Restore Default
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              + New Workflow
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <div className="text-blue-600 dark:text-blue-400 text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                How Workflows Work
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Create custom conversation flows by adding steps (messages, questions, conditions, actions).
                Only ONE workflow can be active at a time. Activate a workflow to use it for new conversations.
              </p>
            </div>
          </div>
        </div>

        {/* Workflows List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              No workflows yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first automation workflow to customize how your bot interacts with customers
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Create First Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition"
              >
                {/* Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {workflow.name}
                    </h3>
                    {workflow.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {workflow.description}
                      </p>
                    )}
                  </div>
                  {workflow.is_active && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                      Active
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Steps</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {workflow.step_count || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Executions</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {workflow.times_executed || 0}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/admin/workflows/${workflow.id}/edit`)}
                    className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleActivate(workflow.id, workflow.is_active)}
                    className={`px-3 py-2 text-sm rounded ${
                      workflow.is_active
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {workflow.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                  </button>
                  <button
                    onClick={() => handleDuplicate(workflow.id, workflow.name)}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    📋 Clone
                  </button>
                  <button
                    onClick={() => handleDelete(workflow.id, workflow.name)}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Create New Workflow
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g. Default Booking Flow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Describe what this workflow does..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newWorkflow.is_default}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, is_default: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Set as default workflow
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkflow}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Create & Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
