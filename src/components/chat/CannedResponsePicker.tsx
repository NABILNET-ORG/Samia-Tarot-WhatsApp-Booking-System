/**
 * 💬 Canned Response Picker
 * Quick reply templates for common messages
 */

'use client'

import { useState, useEffect } from 'react'

type CannedResponse = {
  id: string
  title: string
  content: string
  category: string
  shortcut?: string
}

type CannedResponsePickerProps = {
  onSelect: (content: string) => void
  onClose: () => void
}

export function CannedResponsePicker({ onSelect, onClose }: CannedResponsePickerProps) {
  const [responses, setResponses] = useState<CannedResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadResponses()
  }, [])

  async function loadResponses() {
    try {
      const response = await fetch('/api/canned-responses')
      const data = await response.json()
      if (data.responses) {
        setResponses(data.responses)
      }
    } catch (error) {
      console.error('Failed to load canned responses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredResponses = responses.filter((response) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      response.title.toLowerCase().includes(query) ||
      response.content.toLowerCase().includes(query) ||
      response.category.toLowerCase().includes(query)
    )
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Quick Replies</h3>
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search quick replies..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </div>

      {/* Response List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white" />
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
            No quick replies found
          </div>
        ) : (
          filteredResponses.map((response) => (
            <button
              key={response.id}
              onClick={() => onSelect(response.content)}
              className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">{response.title}</h4>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                      {response.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{response.content}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
