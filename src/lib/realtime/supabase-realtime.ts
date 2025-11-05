/**
 * 🔴 Supabase Realtime Utilities
 * Real-time messaging using Supabase Realtime (WebSocket replacement)
 */

import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export type Message = {
  id: string
  conversation_id: string
  sender_type: 'customer' | 'agent' | 'system'
  sender_id?: string
  content: string
  message_type: 'text' | 'voice' | 'image' | 'document'
  metadata?: any
  created_at: string
}

export type TypingIndicator = {
  conversation_id: string
  employee_id: string
  employee_name: string
  is_typing: boolean
}

export type PresenceState = {
  employee_id: string
  employee_name: string
  is_online: boolean
  last_seen: string
}

/**
 * Subscribe to new messages in a conversation
 */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload: any) => {
        onMessage(payload.new as Message)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to typing indicators
 */
export function subscribeToTyping(
  conversationId: string,
  onTyping: (typing: TypingIndicator) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`typing:${conversationId}`)
    .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
      onTyping(payload as TypingIndicator)
    })
    .subscribe()

  return channel
}

/**
 * Broadcast typing indicator
 */
export async function broadcastTyping(
  conversationId: string,
  employeeId: string,
  employeeName: string,
  isTyping: boolean
): Promise<void> {
  const channel = supabase.channel(`typing:${conversationId}`)

  await channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: {
      conversation_id: conversationId,
      employee_id: employeeId,
      employee_name: employeeName,
      is_typing: isTyping,
    },
  })
}

/**
 * Subscribe to employee presence (online/offline)
 */
export function subscribeToPresence(
  businessId: string,
  onPresenceChange: (presences: PresenceState[]) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`presence:business:${businessId}`)
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const presences = Object.values(state)
        .flat()
        .map((p: any) => p as PresenceState)
      onPresenceChange(presences)
    })
    .on('presence', { event: 'join' }, ({ newPresences }: any) => {
      console.log('Employee joined:', newPresences)
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
      console.log('Employee left:', leftPresences)
    })
    .subscribe()

  return channel
}

/**
 * Track employee presence
 */
export async function trackPresence(
  businessId: string,
  employeeId: string,
  employeeName: string
): Promise<RealtimeChannel> {
  const channel = supabase.channel(`presence:business:${businessId}`)

  await channel.subscribe(async (status: string) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        employee_id: employeeId,
        employee_name: employeeName,
        is_online: true,
        last_seen: new Date().toISOString(),
      })
    }
  })

  return channel
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribeChannel(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel)
}

/**
 * Subscribe to conversation updates (status changes, assignments)
 */
export function subscribeToConversationUpdates(
  businessId: string,
  onUpdate: (conversation: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`conversations:business:${businessId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `business_id=eq.${businessId}`,
      },
      (payload: any) => {
        onUpdate(payload.new)
      }
    )
    .subscribe()

  return channel
}
