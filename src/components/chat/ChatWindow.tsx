/**
 * 💬 Chat Window Component
 * Main chat area with messages and composer
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { MessageComposer } from './MessageComposer'
import { TakeOverButton } from './TakeOverButton'
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
      {/* Header - WhatsApp Style */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
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

        {/* Right Actions (Desktop Only) */}
        {!isMobile && (
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Take Over Button */}
        {conversation && (
          <TakeOverButton
            conversationId={conversationId}
            currentMode={conversation.mode}
            assignedTo={conversation.assigned_employee_name}
            onTakeOver={handleTakeOver}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
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
