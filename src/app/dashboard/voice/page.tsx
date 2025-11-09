/**
 * Voice Messages Page
 * View all voice messages received
 */

'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { VoicePlayer } from '@/components/chat/VoicePlayer'

interface VoiceMessage {
  id: string
  content: string
  media_url: string
  media_type: string
  transcription?: string
  direction: string
  created_at: string
  conversation: {
    customer: {
      name: string
      phone_number: string
    }
  }
}

export default function VoiceMessagesPage() {
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadMessages()
  }, [page, filter])

  const loadMessages = async () => {
    try {
      setLoading(true)
      let url = `/api/voice-messages?page=${page}&limit=50`
      if (filter === 'transcribed') url += '&transcribed=true'
      if (filter === 'not-transcribed') url += '&transcribed=false'

      const response = await fetch(url)
      const data = await response.json()

      if (data.messages) {
        setMessages(data.messages)
        setTotalPages(data.pagination.total_pages)
      }
    } catch (error) {
      console.error('Error loading voice messages:', error)
      toast.error('Failed to load voice messages')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Voice Messages</h1>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Messages</option>
            <option value="transcribed">Transcribed</option>
            <option value="not-transcribed">Not Transcribed</option>
          </select>
        </div>

        {loading && page === 1 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-6xl mb-4">🎤</div>
            <h3 className="text-xl font-semibold mb-2">No voice messages yet</h3>
            <p className="text-gray-600">Voice messages from customers will appear here</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {messages.map((message) => (
                <div key={message.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg dark:hover:shadow-gray-700 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {message.conversation?.customer?.name || 'Unknown Customer'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {message.conversation?.customer?.phone_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{formatDate(message.created_at)}</div>
                      {message.transcription ? (
                        <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Transcribed
                        </span>
                      ) : (
                        <span className="inline-block mt-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Not Transcribed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Voice Player */}
                  <div className="mb-4">
                    <VoicePlayer audioUrl={message.media_url} />
                  </div>

                  {/* Transcription */}
                  {message.transcription && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-purple-900 mb-2">Transcription:</h4>
                      <p className="text-sm text-gray-700">{message.transcription}</p>
                    </div>
                  )}

                  {/* Message Content (if any text) */}
                  {message.content && message.content !== message.transcription && (
                    <div className="mt-3 text-sm text-gray-600">
                      <strong>Message:</strong> {message.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
