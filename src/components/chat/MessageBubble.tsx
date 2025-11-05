/**
 * 💭 Message Bubble Component
 * Individual message display with WhatsApp-like styling
 */

'use client'

import { formatDistanceToNow } from 'date-fns'

type Message = {
  id: string
  sender_type: 'customer' | 'agent' | 'system'
  sender_name?: string
  content: string
  message_type: 'text' | 'voice' | 'image' | 'document'
  created_at: string
  is_read: boolean
}

type MessageBubbleProps = {
  message: Message
  isOwnMessage: boolean
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  // System messages (e.g., "Agent joined")
  if (message.sender_type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full text-sm">
          {message.content}
        </div>
      </div>
    )
  }

  // Customer or Agent messages
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Sender Name (for agent messages from others) */}
        {!isOwnMessage && message.sender_type === 'agent' && (
          <div className="text-xs text-gray-500 mb-1 px-3">
            {message.sender_name}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`px-4 py-2 rounded-lg shadow-sm ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-none'
              : message.sender_type === 'customer'
              ? 'bg-white text-gray-900 rounded-bl-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          }`}
        >
          {/* Message Content */}
          <p className="whitespace-pre-wrap break-words">{message.content}</p>

          {/* Timestamp & Status */}
          <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span>
              {formatDistanceToNow(new Date(message.created_at), {
                addSuffix: true,
              })}
            </span>

            {/* Read Receipt (for sent messages) */}
            {isOwnMessage && (
              <svg
                className={`h-4 w-4 ${message.is_read ? 'text-blue-200' : 'text-blue-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {message.is_read ? (
                  // Double check (read)
                  <>
                    <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                    <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" transform="translate(3, 0)" />
                  </>
                ) : (
                  // Single check (delivered)
                  <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                )}
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
