/**
 * 💬 Main Dashboard - Chat Interface
 * WhatsApp-like 3-column layout
 */

'use client'

import { useState } from 'react'
import { ConversationList } from '@/components/chat/ConversationList'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { CustomerInfoPanel } from '@/components/chat/CustomerInfoPanel'
import { useBusinessContext } from '@/lib/multi-tenant/context'

export default function DashboardPage() {
  const { business, employee, loading } = useBusinessContext()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [showCustomerInfo, setShowCustomerInfo] = useState(true)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Authenticated</h1>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Conversation List */}
      <div className="w-full md:w-96 bg-white border-r border-gray-200 flex-shrink-0">
        <ConversationList
          businessId={business?.id || ''}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId}
            onToggleCustomerInfo={() => setShowCustomerInfo(!showCustomerInfo)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <svg
                className="mx-auto h-24 w-24 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Welcome, {employee.full_name}!
              </h2>
              <p className="mt-2 text-gray-600">
                Select a conversation from the left to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Customer Info (Desktop only) */}
      {selectedConversationId && showCustomerInfo && (
        <div className="hidden lg:block w-80 bg-white border-l border-gray-200 flex-shrink-0">
          <CustomerInfoPanel conversationId={selectedConversationId} />
        </div>
      )}
    </div>
  )
}
