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
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
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
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Edit
                      </button>
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
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
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
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
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
      </div>
    </div>
  )
}
