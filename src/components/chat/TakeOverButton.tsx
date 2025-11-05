/**
 * 🔄 Take Over Button Component
 * Switch conversation from AI → Human mode
 */

'use client'

import { useState } from 'react'

type TakeOverButtonProps = {
  conversationId: string
  currentMode: 'ai' | 'human' | 'hybrid'
  assignedTo?: string
  onTakeOver: () => void
}

export function TakeOverButton({
  conversationId,
  currentMode,
  assignedTo,
  onTakeOver,
}: TakeOverButtonProps) {
  const [taking, setTaking] = useState(false)

  async function handleTakeOver() {
    if (taking) return

    try {
      setTaking(true)

      const response = await fetch('/api/conversations/takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId }),
      })

      if (response.ok) {
        onTakeOver()
        alert('✅ You are now handling this conversation')
      } else {
        const data = await response.json()
        alert(`Failed to take over: ${data.error}`)
      }
    } catch (error) {
      console.error('Takeover error:', error)
      alert('Failed to take over conversation')
    } finally {
      setTaking(false)
    }
  }

  // Already in human mode
  if (currentMode === 'human') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">Human Mode</p>
            <p className="text-xs text-green-700">
              {assignedTo ? `Assigned to: ${assignedTo}` : 'You are handling this conversation'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // AI mode - show take over button
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-purple-900">AI Mode</p>
            <p className="text-xs text-purple-700">AI is handling this conversation</p>
          </div>
        </div>
        <button
          onClick={handleTakeOver}
          disabled={taking}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {taking ? 'Taking Over...' : 'Take Over'}
        </button>
      </div>
    </div>
  )
}
