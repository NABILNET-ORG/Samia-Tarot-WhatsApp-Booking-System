/**
 * ✍️ WhatsApp-Style Message Composer
 * Clean, mobile-first design with circular send button
 */

'use client'

import { useState, useRef } from 'react'
import { CannedResponsePicker } from './CannedResponsePicker'

type MessageComposerProps = {
  onSendMessage: (content: string) => Promise<void>
  disabled?: boolean
}

const EMOJI_LIST = ['😊', '👍', '❤️', '😂', '🙏', '✅', '⭐', '🎉', '💪', '🔥']

export function MessageComposer({ onSendMessage, disabled }: MessageComposerProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showCanned, setShowCanned] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || sending || disabled) return

    try {
      setSending(true)
      await onSendMessage(message.trim())
      setMessage('')
      textareaRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = message.substring(0, start) + emoji + message.substring(end)

    setMessage(newText)
    setShowEmoji(false)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

  function insertCannedResponse(text: string) {
    setMessage(text)
    setShowCanned(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="relative">
      {/* Emoji Picker */}
      {showEmoji && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <div className="grid grid-cols-5 gap-2">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Canned Response Picker */}
      {showCanned && (
        <div className="absolute bottom-full left-0 mb-2 w-full">
          <CannedResponsePicker
            onSelect={insertCannedResponse}
            onClose={() => setShowCanned(false)}
          />
        </div>
      )}

      {/* WhatsApp-Style Composer */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Left Icons Container */}
        <div className="flex gap-1 pb-2">
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Emoji"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Canned Responses Button */}
          <button
            type="button"
            onClick={() => setShowCanned(!showCanned)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Quick replies"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        </div>

        {/* Text Input - Rounded */}
        <div className="flex-1 bg-white rounded-full border border-gray-300 flex items-center px-4 py-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Type a message"
            rows={1}
            disabled={disabled || sending}
            className="w-full resize-none border-none focus:outline-none bg-transparent disabled:opacity-50"
            style={{ maxHeight: '100px' }}
          />
        </div>

        {/* Send Button - Circular with Green Background */}
        <button
          type="submit"
          disabled={!message.trim() || sending || disabled}
          className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
          title="Send"
        >
          {sending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  )
}
