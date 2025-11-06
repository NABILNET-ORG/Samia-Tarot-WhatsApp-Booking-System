/**
 * 📝 AI Templates Page
 * Manage AI prompt templates and canned responses
 */

'use client'

import { useEffect, useState } from 'react'
import { useBusinessContext } from '@/lib/multi-tenant/context'

type Template = {
  id: string
  name: string
  description?: string
  prompt_text: string
  category: string
  usage_count: number
  is_active: boolean
}

type CannedResponse = {
  id: string
  title: string
  content: string
  category: string
  shortcut?: string
  usage_count: number
}

export default function TemplatesPage() {
  const { business } = useBusinessContext()
  const [activeTab, setActiveTab] = useState<'prompts' | 'canned'>('prompts')
  const [templates, setTemplates] = useState<Template[]>([])
  const [responses, setResponses] = useState<CannedResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt_text: '',
    category: 'general',
    title: '',
    content: '',
    shortcut: '',
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    try {
      setLoading(true)

      if (activeTab === 'prompts') {
        const response = await fetch('/api/templates')
        const data = await response.json()
        if (data.templates) setTemplates(data.templates)
      } else {
        const response = await fetch('/api/canned-responses')
        const data = await response.json()
        if (data.responses) setResponses(data.responses)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    try {
      const endpoint = activeTab === 'prompts' ? '/api/templates' : '/api/canned-responses'
      const payload = activeTab === 'prompts'
        ? {
            name: formData.name,
            description: formData.description,
            prompt_text: formData.prompt_text,
            category: formData.category,
          }
        : {
            title: formData.title,
            content: formData.content,
            category: formData.category,
            shortcut: formData.shortcut,
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        alert('✅ Created successfully!')
        setShowCreateModal(false)
        setFormData({
          name: '',
          description: '',
          prompt_text: '',
          category: 'general',
          title: '',
          content: '',
          shortcut: '',
        })
        loadData()
      } else {
        const data = await response.json()
        alert(`❌ Failed to create: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to create:', error)
      alert('❌ Failed to create. Please try again.')
    }
  }

  function handleEditClick(item: any) {
    setSelectedItem(item)
    if (activeTab === 'prompts') {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        prompt_text: item.prompt_text || '',
        category: item.category || 'general',
        title: '',
        content: '',
        shortcut: '',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        prompt_text: '',
        category: item.category || 'general',
        title: item.title || '',
        content: item.content || '',
        shortcut: item.shortcut || '',
      })
    }
    setShowEditModal(true)
  }

  async function handleUpdate() {
    if (!selectedItem) return

    try {
      const endpoint = activeTab === 'prompts'
        ? `/api/templates/${selectedItem.id}`
        : `/api/canned-responses/${selectedItem.id}`

      const payload = activeTab === 'prompts'
        ? {
            name: formData.name,
            description: formData.description,
            prompt_text: formData.prompt_text,
            category: formData.category,
          }
        : {
            title: formData.title,
            content: formData.content,
            category: formData.category,
            shortcut: formData.shortcut,
          }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        alert('✅ Updated successfully!')
        setShowEditModal(false)
        setSelectedItem(null)
        setFormData({
          name: '',
          description: '',
          prompt_text: '',
          category: 'general',
          title: '',
          content: '',
          shortcut: '',
        })
        loadData()
      } else {
        const data = await response.json()
        alert(`❌ Failed to update: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to update:', error)
      alert('❌ Failed to update. Please try again.')
    }
  }

  function handleDeleteClick(item: any) {
    setSelectedItem(item)
    setShowDeleteModal(true)
  }

  async function handleDelete() {
    if (!selectedItem) return

    try {
      const endpoint = activeTab === 'prompts'
        ? `/api/templates/${selectedItem.id}`
        : `/api/canned-responses/${selectedItem.id}`

      const response = await fetch(endpoint, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('✅ Deleted successfully!')
        setShowDeleteModal(false)
        setSelectedItem(null)
        loadData()
      } else {
        const data = await response.json()
        alert(`❌ Failed to delete: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('❌ Failed to delete. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Templates</h1>
          <p className="text-gray-600 mt-1">Customize AI prompts and quick reply templates</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'prompts'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            AI Prompts
          </button>
          <button
            onClick={() => setActiveTab('canned')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'canned'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Quick Replies
          </button>
        </div>

        {/* Content */}
        {activeTab === 'prompts' ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">AI Prompt Templates</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Create Template
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-gray-600">No templates yet. Create your first AI prompt template!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {template.category}
                          </span>
                          {!template.is_active && (
                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          Used {template.usage_count} times
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(template)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(template)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Quick Reply Templates</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Create Response
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {responses.map((response) => (
                  <div key={response.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{response.title}</h3>
                        <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
                          {response.category}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(response)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(response)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{response.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      {response.shortcut && (
                        <code className="bg-gray-100 px-2 py-1 rounded">{response.shortcut}</code>
                      )}
                      <span>Used {response.usage_count} times</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'prompts' ? 'Create AI Prompt Template' : 'Create Quick Reply'}
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {activeTab === 'prompts' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Greeting Template"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="general">General</option>
                        <option value="greeting">Greeting</option>
                        <option value="booking">Booking</option>
                        <option value="payment">Payment</option>
                        <option value="support">Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brief description of this template"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Text *</label>
                      <textarea
                        value={formData.prompt_text}
                        onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter the AI prompt template text..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Thank You Message"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="general">General</option>
                        <option value="greeting">Greeting</option>
                        <option value="booking">Booking</option>
                        <option value="payment">Payment</option>
                        <option value="support">Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Shortcut (Optional)</label>
                      <input
                        type="text"
                        value={formData.shortcut}
                        onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., /thanks"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter the quick reply message..."
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'prompts' ? 'Edit AI Prompt Template' : 'Edit Quick Reply'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedItem(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {activeTab === 'prompts' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Greeting Template"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="general">General</option>
                        <option value="greeting">Greeting</option>
                        <option value="booking">Booking</option>
                        <option value="payment">Payment</option>
                        <option value="support">Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brief description of this template"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Text *</label>
                      <textarea
                        value={formData.prompt_text}
                        onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter the AI prompt template text..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Thank You Message"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="general">General</option>
                        <option value="greeting">Greeting</option>
                        <option value="booking">Booking</option>
                        <option value="payment">Payment</option>
                        <option value="support">Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Shortcut (Optional)</label>
                      <input
                        type="text"
                        value={formData.shortcut}
                        onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., /thanks"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter the quick reply message..."
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedItem(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="rounded-full bg-red-100 p-3">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Confirm Deletion
                </h2>
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to delete{' '}
                  <strong>
                    {activeTab === 'prompts' ? selectedItem.name : selectedItem.title}
                  </strong>
                  ? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setSelectedItem(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
