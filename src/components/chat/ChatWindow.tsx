/**
 * 💬 Chat Window Component
 * Main chat area with messages and composer
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { MessageComposer } from './MessageComposer'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { useBusinessContext } from '@/lib/multi-tenant/context'

type ChatWindowProps = {
  conversationId: string
  onToggleCustomerInfo: () => void
  onBack?: () => void
  isMobile?: boolean
}

type Message = {
  id: string
  sender_type: 'customer' | 'agent' | 'system'
  sender_name?: string
  content: string
  message_type: 'text' | 'voice' | 'image' | 'document'
  created_at: string
  is_read: boolean
}

type Conversation = {
  id: string
  mode: 'ai' | 'human' | 'hybrid'
  assigned_employee_name?: string
  phone: string
}

export function ChatWindow({ conversationId, onToggleCustomerInfo, onBack, isMobile }: ChatWindowProps) {
  const { employee } = useBusinessContext()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages: realtimeMessages, typingUsers, isConnected } = useRealtimeMessages(conversationId)

  // Load initial data
  useEffect(() => {
    loadMessages()
    loadConversation()
  }, [conversationId])

  // Append realtime messages
  useEffect(() => {
    if (realtimeMessages.length > 0) {
      setMessages((prev) => {
        const newMsgs = realtimeMessages.filter(
          (rm) => !prev.some((m) => m.id === rm.id)
        ).map((rm: any) => ({ ...rm, is_read: rm.is_read || false }))
        return [...prev, ...newMsgs]
      })
    }
  }, [realtimeMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    try {
      setLoading(true)
      const response = await fetch(`/api/messages?conversation_id=${conversationId}`)
      const data = await response.json()

      if (data.messages) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadConversation() {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      const data = await response.json()

      if (data.conversation) {
        setConversation(data.conversation)
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  async function handleSendMessage(content: string) {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        content,
        message_type: 'text',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }
  }

  function handleTakeOver() {
    loadConversation() // Reload to show updated mode
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header - WhatsApp Style - STICKY */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back Button (Mobile Only) */}
          {isMobile && onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full -ml-2"
            >
              <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Customer Avatar & Name (Clickable on mobile) */}
          <button
            onClick={onToggleCustomerInfo}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 -ml-2 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {conversation?.phone?.[0] || 'C'}
            </div>
            <div className="text-left">
              <h2 className="font-semibold text-gray-900">{conversation?.phone || 'Customer'}</h2>
              <p className="text-xs text-gray-500">
                {isConnected ? (
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 bg-green-500 rounded-full" />
                    Online
                  </span>
                ) : (
                  'Connecting...'
                )}
              </p>
            </div>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Take Over Button - In Header */}
          {conversation && conversation.mode === 'ai' && (
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`/api/conversations/takeover`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ conversation_id: conversationId })
                  })
                  if (response.ok) {
                    handleTakeOver()
                  }
                } catch (error) {
                  console.error('Failed to take over:', error)
                }
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              title="Take over from AI"
            >
              Take Over
            </button>
          )}

          {/* Give Back to AI Button - In Header */}
          {conversation && conversation.mode === 'human' && (
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`/api/conversations/givebacktoai`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ conversation_id: conversationId })
                  })
                  if (response.ok) {
                    handleTakeOver() // Reload conversation
                  }
                } catch (error) {
                  console.error('Failed to give back to AI:', error)
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              title="Give back to AI"
            >
              Give to AI
            </button>
          )}

          {/* Search Button */}
          {!isMobile && (
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Search in conversation"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}

          {/* Menu Button */}
          {!isMobile && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="More options"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {/* Menu Dropdown */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      onToggleCustomerInfo()
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Contact Info
                  </button>
                  <button
                    onClick={() => {
                      setShowSearch(true)
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Search Messages
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/conversations/${conversationId}/export?format=text`)
                        const text = await response.text()
                        const blob = new Blob([text], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `conversation-${conversation?.phone}-${Date.now()}.txt`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      } catch (error) {
                        alert('Failed to export chat')
                      }
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export Chat
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to clear this conversation? All messages will be deleted.')) {
                        try {
                          const response = await fetch(`/api/conversations/${conversationId}/clear`, {
                            method: 'DELETE'
                          })
                          if (response.ok) {
                            setMessages([])
                            alert('Conversation cleared successfully!')
                            loadConversation()
                          } else {
                            alert('Failed to clear conversation')
                          }
                        } catch (error) {
                          alert('Error clearing conversation')
                        }
                      }
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50"
                  >
                    Clear Messages
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this conversation? This will archive it and it will no longer appear in your list.')) {
                        try {
                          const response = await fetch(`/api/conversations/${conversationId}`, {
                            method: 'DELETE'
                          })
                          if (response.ok) {
                            alert('Conversation deleted successfully!')
                            if (onBack) {
                              onBack() // Go back to conversation list
                            }
                          } else {
                            alert('Failed to delete conversation')
                          }
                        } catch (error) {
                          alert('Error deleting conversation')
                        }
                      }
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete Conversation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar (appears when search is active) */}
      {showSearch && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in messages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <span className="text-sm text-gray-600">
                {messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())).length} results
              </span>
            )}
            <button
              onClick={() => {
                setShowSearch(false)
                setSearchQuery('')
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages
            .filter((message) => {
              if (!searchQuery) return true
              return message.content.toLowerCase().includes(searchQuery.toLowerCase())
            })
            .map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.sender_type === 'agent' && message.sender_name === employee?.full_name}
              />
            ))
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex gap-1">
              <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>{typingUsers[0].employee_name} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <div className="bg-white border-t border-gray-200 p-4">
        <MessageComposer onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}
