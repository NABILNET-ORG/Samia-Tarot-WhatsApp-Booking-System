/**
 * 🔴 useRealtimeMessages Hook
 * React hook for real-time message subscriptions
 */

'use client'

import { useEffect, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
  subscribeToMessages,
  subscribeToTyping,
  unsubscribeChannel,
  Message,
  TypingIndicator,
} from '@/lib/realtime/supabase-realtime'

export function useRealtimeMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!conversationId) return

    let messageChannel: RealtimeChannel | null = null
    let typingChannel: RealtimeChannel | null = null

    // Subscribe to new messages
    messageChannel = subscribeToMessages(conversationId, (newMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev
        }
        return [...prev, newMessage]
      })
    })

    // Subscribe to typing indicators
    typingChannel = subscribeToTyping(conversationId, (typing) => {
      setTypingUsers((prev) => {
        const filtered = prev.filter((t) => t.employee_id !== typing.employee_id)

        if (typing.is_typing) {
          return [...filtered, typing]
        }
        return filtered
      })

      // Auto-clear typing after 3 seconds
      if (typing.is_typing) {
        setTimeout(() => {
          setTypingUsers((prev) =>
            prev.filter((t) => t.employee_id !== typing.employee_id)
          )
        }, 3000)
      }
    })

    setIsConnected(true)

    // Cleanup on unmount
    return () => {
      if (messageChannel) {
        unsubscribeChannel(messageChannel)
      }
      if (typingChannel) {
        unsubscribeChannel(typingChannel)
      }
      setIsConnected(false)
    }
  }, [conversationId])

  return {
    messages,
    typingUsers,
    isConnected,
    setMessages, // Allow manual message updates
  }
}
