/**
 * 🤖 AI Instructions & Prompts Management
 * Configure how AI responds to customers
 */

'use client'

import { useEffect, useState } from 'react'
import { useBusinessContext } from '@/lib/multi-tenant/context'
import toast from 'react-hot-toast'

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
  const [fetchedKnowledge, setFetchedKnowledge] = useState<any[]>([])
  const [showKnowledgeDetails, setShowKnowledgeDetails] = useState(false)
  const [fetchMode, setFetchMode] = useState<'single' | 'entire'>('single')
  const [crawlProgress, setCrawlProgress] = useState<string>('')

  useEffect(() => {
    if (business?.id) {
      loadInstructions()
      loadSettings()
      loadFetchedKnowledge()
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

      // Load knowledge base URLs from settings
      const kbUrls = (data.settings as any)?.knowledge_base_urls || []
      if (kbUrls && Array.isArray(kbUrls)) {
        setKnowledgeUrls(kbUrls)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  async function loadFetchedKnowledge() {
    try {
      const response = await fetch('/api/knowledge-base/list')
      const data = await response.json()
      if (data.knowledge) {
        setFetchedKnowledge(data.knowledge)
      }
    } catch (error) {
      console.error('Failed to load fetched knowledge:', error)
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
        toast.error('Invalid URL format')
      }
    } else if (knowledgeUrls.length >= 20) {
      toast.error('Maximum 20 websites allowed')
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
      setCrawlProgress('')

      if (fetchMode === 'entire') {
        toast.success('Starting website crawl... This may take a few minutes')
      }

      const response = await fetch('/api/knowledge-base/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: knowledgeUrls,
          mode: fetchMode
        })
      })

      const data = await response.json()

      if (response.ok) {
        const successCount = data.successful || 0
        const totalPages = data.totalPagesCrawled || knowledgeUrls.length

        if (fetchMode === 'entire') {
          toast.success(`Knowledge base refreshed! Crawled ${totalPages} pages from ${successCount} websites`)
        } else {
          toast.success(`Knowledge base refreshed! Fetched ${successCount} pages`)
        }

        // Reload fetched knowledge to show updated data
        await loadFetchedKnowledge()
      } else {
        toast.error(data.error || 'Failed to refresh knowledge base')
      }
    } catch (error) {
      toast.error('Error refreshing knowledge base')
    } finally {
      setSaving(false)
      setCrawlProgress('')
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
        toast.success('AI instructions saved successfully')
        loadInstructions()
        loadSettings()
      } else {
        const data = await instructionsResponse.json()
        toast.error(`Failed to save: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to save AI instructions:', error)
      toast.error('Failed to save. Please try again.')
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading AI instructions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🤖 AI Instructions & Prompts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure how your AI assistant responds to customers. These instructions will guide the AI's behavior and tone.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">How AI Instructions Work</h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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
                      checked={settings.features_voice_transcription || (business as any)?.features_voice_transcription || false}
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
                      value={settings.ai_model || (business as any)?.ai_model || 'gpt-4o'}
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
                      value={settings.ai_temperature || (business as any)?.ai_temperature || 0.7}
                      onChange={(e) => setSettings({...settings, ai_temperature: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Higher = more creative, Lower = more focused</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens per Response</label>
                    <input
                      type="number"
                      value={settings.ai_max_tokens || (business as any)?.ai_max_tokens || 700}
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
                      value={settings.ai_conversation_memory || (business as any)?.ai_conversation_memory || 10}
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Add up to 20 website URLs. The AI will fetch content from these websites to answer business-specific questions.</p>

                {/* Fetch Mode Selection */}
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Fetch Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFetchMode('single')}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        fetchMode === 'single'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium text-gray-900 dark:text-white">Single Page</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Fetch only the exact URL you provide. Fast and focused.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFetchMode('entire')}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        fetchMode === 'entire'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <span className="font-medium text-gray-900 dark:text-white">Entire Website</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Crawl all pages, sublinks, and services. More comprehensive (slower).
                      </p>
                    </button>
                  </div>

                  {fetchMode === 'entire' && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">Crawling entire websites</p>
                          <p className="text-xs text-yellow-800 dark:text-yellow-300 mt-1">
                            • May take 2-5 minutes per website<br />
                            • Crawls up to 50 pages per domain<br />
                            • Stays within the same domain<br />
                            • Respects robots.txt
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{knowledgeUrls.length} / 20 websites added</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {fetchMode === 'entire' ? 'Will crawl entire websites including all pages' : 'Will fetch only the exact URLs'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={refreshKnowledgeBase}
                          disabled={saving}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm whitespace-nowrap flex items-center gap-2"
                        >
                          {saving && (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          {saving ? (fetchMode === 'entire' ? 'Crawling...' : 'Fetching...') : 'Refresh Knowledge'}
                        </button>
                      </div>

                      {/* Crawl Progress */}
                      {saving && crawlProgress && (
                        <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300">
                          {crawlProgress}
                        </div>
                      )}
                    </div>

                    {/* Fetched Knowledge Display */}
                    {fetchedKnowledge.length > 0 && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setShowKnowledgeDetails(!showKnowledgeDetails)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-left">
                              <h3 className="font-medium text-gray-900 dark:text-white">Fetched Knowledge ({fetchedKnowledge.length})</h3>
                              <p className="text-xs text-gray-600 dark:text-gray-400">AI is using this content to answer questions</p>
                            </div>
                          </div>
                          <svg
                            className={`h-5 w-5 text-gray-500 transition-transform ${showKnowledgeDetails ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {showKnowledgeDetails && (
                          <div className="p-4 space-y-3 max-h-96 overflow-y-auto bg-white dark:bg-gray-900">
                            {fetchedKnowledge.map((kb: any, index: number) => (
                              <div key={kb.id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white truncate">{kb.title}</h4>
                                    <a
                                      href={kb.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline truncate block"
                                    >
                                      {kb.source_url}
                                    </a>
                                  </div>
                                  {kb.is_active ? (
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full whitespace-nowrap">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs rounded-full whitespace-nowrap">
                                      Error
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                                  <div>
                                    <span className="font-medium">Characters:</span> {kb.content?.length || 0}
                                  </div>
                                  <div>
                                    <span className="font-medium">Last updated:</span>{' '}
                                    {kb.last_updated ? new Date(kb.last_updated).toLocaleDateString() : 'Never'}
                                  </div>
                                </div>

                                {kb.fetch_error && (
                                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                                    <span className="font-medium">Error:</span> {kb.fetch_error}
                                  </div>
                                )}

                                {kb.content && kb.is_active && (
                                  <details className="mt-2">
                                    <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
                                      View content preview
                                    </summary>
                                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300 max-h-40 overflow-y-auto font-mono whitespace-pre-wrap">
                                      {kb.content.substring(0, 500)}
                                      {kb.content.length > 500 && '...'}
                                    </div>
                                  </details>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
