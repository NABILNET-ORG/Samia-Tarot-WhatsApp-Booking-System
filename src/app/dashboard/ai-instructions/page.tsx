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
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'model'>('basic')
  const [settings, setSettings] = useState<any>({})
  const [knowledgeUrls, setKnowledgeUrls] = useState<string[]>([])
  const [newUrl, setNewUrl] = useState('')

  useEffect(() => {
    if (business?.id) {
      loadInstructions()
      loadSettings()
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

  async function loadSettings() {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      if (data.settings) setSettings(data.settings)

      // Load knowledge base URLs
      if (business?.knowledge_base_urls) {
        setKnowledgeUrls(business.knowledge_base_urls)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  function addKnowledgeUrl() {
    if (newUrl && knowledgeUrls.length < 20) {
      try {
        new URL(newUrl) // Validate URL format
        setKnowledgeUrls([...knowledgeUrls, newUrl])
        setNewUrl('')
        setSettings({...settings, knowledge_base_urls: [...knowledgeUrls, newUrl]})
      } catch {
        alert('Invalid URL format')
      }
    } else if (knowledgeUrls.length >= 20) {
      alert('Maximum 20 websites allowed')
    }
  }

  function removeKnowledgeUrl(index: number) {
    const updated = knowledgeUrls.filter((_, i) => i !== index)
    setKnowledgeUrls(updated)
    setSettings({...settings, knowledge_base_urls: updated})
  }

  async function refreshKnowledgeBase() {
    try {
      setSaving(true)
      const response = await fetch('/api/knowledge-base/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: knowledgeUrls })
      })
      if (response.ok) {
        alert('Knowledge base refreshed successfully!')
      } else {
        alert('Failed to refresh knowledge base')
      }
    } catch (error) {
      alert('Error refreshing knowledge base')
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)

      // Save AI instructions
      const instructionsResponse = await fetch('/api/ai-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instructions),
      })

      // Save settings (including model & knowledge base)
      const settingsResponse = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (instructionsResponse.ok && settingsResponse.ok) {
        alert('✅ AI instructions saved successfully!')
        loadInstructions()
        loadSettings()
      } else {
        const data = await instructionsResponse.json()
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
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Basic Settings
          </button>
          <button
            onClick={() => setActiveTab('model')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'model'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Model & Knowledge
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'advanced'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Advanced Prompts
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {activeTab === 'basic' && (
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
          )}

          {activeTab === 'model' && (
            <div className="space-y-6">
              {/* Features */}
              <div>
                <h2 className="text-xl font-bold mb-4">Features</h2>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Voice Notes</h3>
                    <p className="text-sm text-gray-600">Allow bot to send voice note responses</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.features_voice_transcription || business?.features_voice_transcription || false}
                      onChange={(e) => setSettings({...settings, features_voice_transcription: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              {/* AI Model Settings */}
              <div>
                <h2 className="text-xl font-bold mb-4">AI Model Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AI Model</label>
                    <select
                      value={settings.ai_model || business?.ai_model || 'gpt-4o'}
                      onChange={(e) => setSettings({...settings, ai_model: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="gpt-4o">GPT-4o (Best quality)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo (Faster)</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Cheaper)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (0-1)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={settings.ai_temperature || business?.ai_temperature || 0.7}
                      onChange={(e) => setSettings({...settings, ai_temperature: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Higher = more creative, Lower = more focused</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens per Response</label>
                    <input
                      type="number"
                      value={settings.ai_max_tokens || business?.ai_max_tokens || 700}
                      onChange={(e) => setSettings({...settings, ai_max_tokens: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conversation Memory (messages)</label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={settings.ai_conversation_memory || business?.ai_conversation_memory || 10}
                      onChange={(e) => setSettings({...settings, ai_conversation_memory: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of previous messages AI remembers</p>
                  </div>
                </div>
              </div>

              {/* Knowledge Base */}
              <div>
                <h2 className="text-xl font-bold mb-4">Knowledge Base (RAG)</h2>
                <p className="text-sm text-gray-600 mb-4">Add up to 20 website URLs. The AI will fetch content from these websites to answer business-specific questions.</p>

                {/* Add URL Input */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://yourrestaurant.com/menu"
                    className="flex-1 px-4 py-2 border rounded-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addKnowledgeUrl()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addKnowledgeUrl}
                    disabled={!newUrl || knowledgeUrls.length >= 20}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    Add URL
                  </button>
                </div>

                {/* URL List */}
                <div className="space-y-2 mb-4">
                  {knowledgeUrls.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700 truncate flex-1">{url}</span>
                      <button
                        type="button"
                        onClick={() => removeKnowledgeUrl(index)}
                        className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {knowledgeUrls.length === 0 && (
                  <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                    No websites added yet. Add URLs above to teach the AI about your business.
                  </div>
                )}

                {knowledgeUrls.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-900">{knowledgeUrls.length} / 20 websites added</p>
                      <p className="text-xs text-blue-700">Click "Refresh Knowledge" to fetch latest content from websites</p>
                    </div>
                    <button
                      type="button"
                      onClick={refreshKnowledgeBase}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {saving ? 'Fetching...' : 'Refresh Knowledge'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
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
