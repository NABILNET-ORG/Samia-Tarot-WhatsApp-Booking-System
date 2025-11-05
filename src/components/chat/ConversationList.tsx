/**
 * 📋 Conversation List Component
 * Left sidebar showing all conversations
 */

'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

type Conversation = {
  id: string
  customer_name?: string
  phone: string
  last_message_at: string
  mode: 'ai' | 'human' | 'hybrid'
  assigned_employee_name?: string
  unread_count?: number
}

type ConversationListProps = {
  businessId: string
  selectedConversationId: string | null
  onSelectConversation: (id: string) => void
}

export function ConversationList({
  businessId,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'ai' | 'human'>('all')

  useEffect(() => {
    fetchConversations()
  }, [businessId, filter])

  async function fetchConversations() {
    try {
      setLoading(true)
      const params = new URLSearchParams({ business_id: businessId })
      if (filter !== 'all') {
        params.append('mode', filter)
      }

      const response = await fetch(`/api/conversations?${params}`)
      const data = await response.json()

      if (data.conversations) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      conv.customer_name?.toLowerCase().includes(query) ||
      conv.phone.includes(query)
    )
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Conversations</h1>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('ai')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'ai'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            AI
          </button>
          <button
            onClick={() => setFilter('human')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'human'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Human
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500">No conversations found</p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                selectedConversationId === conv.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {conv.customer_name || conv.phone}
                    </h3>
                    {conv.mode === 'ai' ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                        AI
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Human
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {conv.phone}
                  </p>
                  {conv.assigned_employee_name && (
                    <p className="text-xs text-gray-500 mt-1">
                      Assigned to: {conv.assigned_employee_name}
                    </p>
                  )}
                </div>
                <div className="ml-2 flex flex-col items-end">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(conv.last_message_at), {
                      addSuffix: true,
                    })}
                  </span>
                  {conv.unread_count && conv.unread_count > 0 && (
                    <span className="mt-1 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
