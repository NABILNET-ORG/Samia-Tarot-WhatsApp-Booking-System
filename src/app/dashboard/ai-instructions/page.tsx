/**
 * 🤖 AI Instructions & Prompts Management
 * Configure how AI responds to customers
 */

'use client'

import { useEffect, useState } from 'react'
import { useBusinessContext } from '@/lib/multi-tenant/context'

type AIInstruction = {
  id?: string
  business_id: string
  system_prompt: string
  greeting_template: string
  tone: 'professional' | 'friendly' | 'mystical' | 'casual'
  language_handling: 'auto' | 'english_only' | 'arabic_only' | 'multilingual'
  response_length: 'concise' | 'detailed' | 'balanced'
  special_instructions?: string
  updated_at?: string
}

export default function AIInstructionsPage() {
  const { business } = useBusinessContext()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [instructions, setInstructions] = useState<AIInstruction>({
    business_id: business?.id || '',
    system_prompt: '',
    greeting_template: '',
    tone: 'mystical',
    language_handling: 'auto',
    response_length: 'balanced',
    special_instructions: '',
  })
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic')

  useEffect(() => {
    if (business?.id) {
      loadInstructions()
    }
  }, [business?.id])

  async function loadInstructions() {
    try {
      setLoading(true)
      const response = await fetch('/api/ai-instructions')
      const data = await response.json()

      if (data.instructions) {
        setInstructions(data.instructions)
      }
    } catch (error) {
      console.error('Failed to load AI instructions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      const response = await fetch('/api/ai-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instructions),
      })

      if (response.ok) {
        alert('✅ AI instructions saved successfully!')
        loadInstructions()
      } else {
        const data = await response.json()
        alert(`❌ Failed to save: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to save AI instructions:', error)
      alert('❌ Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!confirm('Are you sure you want to reset to default AI instructions?')) {
      return
    }

    const defaultInstructions: AIInstruction = {
      business_id: business?.id || '',
      system_prompt: `You are an AI assistant for this business. You help customers with their inquiries and bookings.

**YOUR ROLE:**
- Answer customer questions clearly and professionally
- Guide customers through the booking/purchase process
- Provide accurate information about products/services
- Maintain a helpful and friendly tone

**RULES:**
1. Always be polite and professional
2. Stay on topic related to business services
3. Ask for clarification if customer request is unclear
4. Escalate complex issues to human support
5. Remember conversation context`,
      greeting_template: 'Hello! 👋 Welcome to our service. How can I help you today?',
      tone: 'friendly',
      language_handling: 'auto',
      response_length: 'balanced',
      special_instructions: '',
    }

    setInstructions(defaultInstructions)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Loading AI instructions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🤖 AI Instructions & Prompts</h1>
          <p className="text-gray-600 mt-2">
            Configure how your AI assistant responds to customers. These instructions will guide the AI's behavior and tone.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">How AI Instructions Work</h3>
              <p className="text-sm text-blue-800">
                The AI uses these instructions as its "personality" and guidelines. Changes take effect immediately for all new conversations.
                Be specific about your business context, desired tone, and any special handling rules.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'basic'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Basic Settings
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'advanced'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Advanced Prompts
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {activeTab === 'basic' ? (
            <div className="space-y-6">
              {/* Greeting Template */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Greeting Message
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  The first message customers see when they start a conversation.
                </p>
                <textarea
                  value={instructions.greeting_template}
                  onChange={(e) => setInstructions({ ...instructions, greeting_template: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Hello! 👋 Welcome to our service. How can I help you today?"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  AI Tone & Personality
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Choose how the AI should communicate with customers.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['professional', 'friendly', 'mystical', 'casual'] as const).map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setInstructions({ ...instructions, tone })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        instructions.tone === tone
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">
                        {tone === 'professional' && '💼'}
                        {tone === 'friendly' && '😊'}
                        {tone === 'mystical' && '🔮'}
                        {tone === 'casual' && '👋'}
                      </div>
                      <p className="font-medium text-sm capitalize">{tone}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Handling */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Language Handling
                </label>
                <select
                  value={instructions.language_handling}
                  onChange={(e) => setInstructions({ ...instructions, language_handling: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="auto">Auto-detect and respond in customer's language</option>
                  <option value="english_only">English only</option>
                  <option value="arabic_only">Arabic only</option>
                  <option value="multilingual">Support all languages</option>
                </select>
              </div>

              {/* Response Length */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Response Length
                </label>
                <select
                  value={instructions.response_length}
                  onChange={(e) => setInstructions({ ...instructions, response_length: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="concise">Concise - Short and to the point</option>
                  <option value="balanced">Balanced - Normal length responses</option>
                  <option value="detailed">Detailed - Comprehensive explanations</option>
                </select>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Special Instructions (Optional)
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Add any specific rules or behaviors you want the AI to follow.
                </p>
                <textarea
                  value={instructions.special_instructions || ''}
                  onChange={(e) => setInstructions({ ...instructions, special_instructions: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Always mention our 24-hour return policy. Never discuss competitor services. Offer discount codes for first-time customers."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* System Prompt */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  System Prompt (Advanced)
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  The core instructions that define your AI assistant's knowledge and behavior.
                  This is sent to the AI model with every conversation.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Advanced users only:</strong> Editing this requires understanding of AI prompt engineering.
                    Include information about your business, services, pricing, policies, and conversation flow.
                  </p>
                </div>
                <textarea
                  value={instructions.system_prompt}
                  onChange={(e) => setInstructions({ ...instructions, system_prompt: e.target.value })}
                  rows={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="You are an AI assistant for [Business Name]...

**ABOUT THE BUSINESS:**
- [What you do]
- [Operating hours]
- [Key information]

**YOUR ROLE:**
1. [Primary function]
2. [Secondary function]
3. [Rules and guidelines]

**RESPONSE FORMAT:**
[How AI should structure responses]"
                />
              </div>

              {/* Tips */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">💡 System Prompt Tips:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Include detailed information about your business and services</li>
                  <li>• List all products/services with accurate pricing</li>
                  <li>• Define conversation states/flows (e.g., greeting → inquiry → booking)</li>
                  <li>• Specify when to escalate to human support</li>
                  <li>• Add context about your target audience</li>
                  <li>• Include operating hours, policies, and FAQs</li>
                  <li>• Use clear structure with sections and bullet points</li>
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : 'Save Instructions'}
            </button>
          </div>
        </div>

        {/* Last Updated */}
        {instructions.updated_at && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Last updated: {new Date(instructions.updated_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}
