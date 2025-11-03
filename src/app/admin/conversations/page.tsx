'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, [])

  async function loadConversations() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          customers (
            name_english,
            name_arabic,
            phone,
            vip_status
          )
        `)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 safe-top safe-bottom">
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-purple-900 mb-2">
          💬 Active Conversations
        </h1>
        <p className="text-gray-600">Monitor ongoing customer chats</p>
      </div>

      <div className="max-w-7xl mx-auto">
        {conversations.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">No active conversations</p>
            <p className="text-gray-400 text-sm mt-2">
              Active chats will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv) => (
              <div key={conv.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold">
                        {conv.customers?.name_english || conv.phone}
                      </h3>
                      {conv.customers?.vip_status && (
                        <span className="text-yellow-500">👑</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{conv.phone}</p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        conv.current_state === 'PAYMENT'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {conv.current_state}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Language:</p>
                    <p className="font-bold">
                      {conv.language === 'ar' ? '🇱🇧 Arabic' : '🇬🇧 English'}
                    </p>
                  </div>

                  {conv.service_name && (
                    <div>
                      <p className="text-sm text-gray-600">Selected Service:</p>
                      <p className="font-bold">{conv.service_name}</p>
                    </div>
                  )}

                  {conv.full_name && (
                    <div>
                      <p className="text-sm text-gray-600">Name:</p>
                      <p className="font-bold">{conv.full_name}</p>
                    </div>
                  )}

                  {conv.email && (
                    <div>
                      <p className="text-sm text-gray-600">Email:</p>
                      <p className="font-bold">{conv.email}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    💬 Messages: {conv.message_history?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    Last message: {new Date(conv.last_message_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
