/**
 * ⚙️ Business Settings Page - Complete v1+v2 Merge
 * Includes System Status, Provider Switcher, Secrets Management
 */

'use client'

import { useEffect, useState } from 'react'
import { useBusinessContext } from '@/lib/multi-tenant/context'

type Tab = 'overview' | 'general' | 'secrets' | 'integrations'

export default function SettingsPage() {
  const { business: businessData, employee, refetch } = useBusinessContext()
  const business = businessData as any // Type assertion for encrypted fields
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [settings, setSettings] = useState<any>({})
  const [secrets, setSecrets] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [systemStatus, setSystemStatus] = useState({
    openai: false,
    meta: false,
    twilio: false,
    stripe: false,
    google: false,
    supabase: false
  })
  const [currentProvider, setCurrentProvider] = useState<'meta' | 'twilio'>('meta')
  const [knowledgeUrls, setKnowledgeUrls] = useState<string[]>([])
  const [newUrl, setNewUrl] = useState('')

  // Check if current user is Admin
  const isAdmin = employee?.role_name === 'Admin' || employee?.role_name === 'Owner'

  useEffect(() => {
    if (business) {
      loadSettings()
      loadSecrets()
      checkSystemStatus()
    }
  }, [business])

  async function checkSystemStatus() {
    setSystemStatus({
      openai: !!business?.openai_api_key_encrypted,
      meta: !!business?.whatsapp_phone_number_id || !!business?.meta_phone_id,
      twilio: !!business?.twilio_phone_number,
      stripe: !!business?.stripe_secret_key_encrypted,
      google: !!business?.google_client_id_encrypted,
      supabase: true
    })
    setCurrentProvider(business?.whatsapp_provider || 'meta')
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
      console.error(error)
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

  async function loadSecrets() {
    if (!isAdmin) return
    try {
      const response = await fetch('/api/businesses/' + business?.id + '/secrets')
      const data = await response.json()
      if (data.secrets) setSecrets(data.secrets)
    } catch (error) {
      console.error(error)
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (response.ok) {
        alert('Settings saved successfully!')
        refetch()
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveSecrets(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('/api/businesses/' + business?.id + '/secrets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secrets),
      })
      if (response.ok) {
        alert('Secrets saved successfully!')
        refetch()
        checkSystemStatus()
      } else {
        alert('Failed to save secrets')
      }
    } catch (error) {
      alert('Error saving secrets')
    } finally {
      setSaving(false)
    }
  }

  async function switchProvider(provider: 'meta' | 'twilio') {
    try {
      const response = await fetch('/api/admin/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      if (response.ok) {
        setCurrentProvider(provider)
        alert(`✅ Switched to ${provider === 'meta' ? 'Meta WhatsApp' : 'Twilio'}!`)
        refetch()
      } else {
        alert('Failed to switch provider')
      }
    } catch (error) {
      console.error(error)
      alert('Error switching provider')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Business Settings</h1>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              🔍 Overview
            </TabButton>
            <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
              ⚙️ General
            </TabButton>
            {isAdmin && (
              <TabButton active={activeTab === 'secrets'} onClick={() => setActiveTab('secrets')}>
                🔐 Secrets
              </TabButton>
            )}
            <TabButton active={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')}>
              🔌 Integrations
            </TabButton>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* System Status */}
            <div>
              <h2 className="text-2xl font-bold mb-4">🔍 System Status</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatusCard name="OpenAI (GPT-4)" status={systemStatus.openai} description="Required for AI conversations" />
                <StatusCard name="Meta WhatsApp" status={systemStatus.meta} description="Official WhatsApp Business API" />
                <StatusCard name="Twilio" status={systemStatus.twilio} description="Twilio WhatsApp API" />
                <StatusCard name="Stripe" status={systemStatus.stripe} description="Payment processing" />
                <StatusCard name="Google APIs" status={systemStatus.google} description="Calendar & Contacts" />
                <StatusCard name="Supabase" status={systemStatus.supabase} description="Database (always configured)" />
              </div>
            </div>

            {/* WhatsApp Provider Switcher */}
            <div>
              <h2 className="text-2xl font-bold mb-4">📱 WhatsApp Provider</h2>
              <p className="text-gray-600 mb-4">Choose between Meta WhatsApp Business API or Twilio. You can switch anytime!</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProviderCard
                  name="Meta WhatsApp Business"
                  icon="📱"
                  active={currentProvider === 'meta'}
                  description="Official Meta platform with advanced features"
                  features={['Interactive messages', 'Message templates', 'Business verification', 'Free tier available']}
                  onClick={() => switchProvider('meta')}
                />
                <ProviderCard
                  name="Twilio"
                  icon="📞"
                  active={currentProvider === 'twilio'}
                  description="Easy setup with developer-friendly tools"
                  features={['Quick integration', 'Simple pricing', 'Great documentation', 'Instant sandbox']}
                  onClick={() => switchProvider('twilio')}
                />
              </div>
            </div>
          </div>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">Business Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={settings.name || business?.name || ''}
                    onChange={(e) => setSettings({...settings, name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select
                    value={settings.industry || business?.industry || 'other'}
                    onChange={(e) => setSettings({...settings, industry: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="tarot">Tarot & Spiritual</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="clinic">Medical Clinic</option>
                    <option value="salon">Beauty Salon</option>
                    <option value="consultant">Consultant</option>
                    <option value="fitness">Fitness</option>
                    <option value="education">Education</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    value={settings.timezone || business?.timezone || 'UTC'}
                    onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Asia/Beirut">Beirut (Lebanon)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                    <input
                      type="email"
                      value={settings.support_email || business?.support_email || ''}
                      onChange={(e) => setSettings({...settings, support_email: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="support@yourbusiness.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                    <input
                      type="tel"
                      value={settings.support_phone || business?.support_phone || ''}
                      onChange={(e) => setSettings({...settings, support_phone: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">Branding</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <input
                    type="color"
                    value={settings.primary_color || business?.primary_color || '#6B46C1'}
                    onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                    className="w-full h-12 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                  <input
                    type="url"
                    value={settings.logo_url || business?.logo_url || ''}
                    onChange={(e) => setSettings({...settings, logo_url: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save General Settings'}
            </button>
          </form>
        )}

        {/* Secrets Tab - Admin Only */}
        {activeTab === 'secrets' && isAdmin && (
          <form onSubmit={handleSaveSecrets} className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Admin Only:</strong> These credentials are encrypted in the database. Only Admin and Owner roles can view and edit secrets.
              </p>
            </div>

            {/* OpenAI */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">🤖 OpenAI Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OpenAI API Key
                    <a href="https://platform.openai.com/api-keys" target="_blank" className="ml-2 text-blue-500 text-xs">Get Key →</a>
                  </label>
                  <input
                    type="password"
                    value={secrets.openai_api_key || ''}
                    onChange={(e) => setSecrets({...secrets, openai_api_key: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="sk-proj-..."
                  />
                </div>
              </div>
            </div>

            {/* Meta WhatsApp */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">📱 Meta WhatsApp Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number ID
                    <a href="https://developers.facebook.com" target="_blank" className="ml-2 text-blue-500 text-xs">Get from Meta →</a>
                  </label>
                  <input
                    type="text"
                    value={secrets.meta_phone_id || ''}
                    onChange={(e) => setSecrets({...secrets, meta_phone_id: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="123456789012345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Token (Permanent)</label>
                  <input
                    type="password"
                    value={secrets.meta_access_token || ''}
                    onChange={(e) => setSecrets({...secrets, meta_access_token: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="EAAK..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">App Secret</label>
                  <input
                    type="password"
                    value={secrets.meta_app_secret || ''}
                    onChange={(e) => setSecrets({...secrets, meta_app_secret: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="abc123def456..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Verify Token</label>
                  <input
                    type="text"
                    value={secrets.meta_verify_token || ''}
                    onChange={(e) => setSecrets({...secrets, meta_verify_token: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="your_secret_verify_token"
                  />
                </div>
              </div>
            </div>

            {/* Twilio */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">📞 Twilio Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account SID
                    <a href="https://console.twilio.com" target="_blank" className="ml-2 text-blue-500 text-xs">Get from Twilio →</a>
                  </label>
                  <input
                    type="text"
                    value={secrets.twilio_account_sid || ''}
                    onChange={(e) => setSecrets({...secrets, twilio_account_sid: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="AC..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
                  <input
                    type="password"
                    value={secrets.twilio_auth_token || ''}
                    onChange={(e) => setSecrets({...secrets, twilio_auth_token: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="abc123..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Phone Number</label>
                  <input
                    type="tel"
                    value={secrets.twilio_whatsapp_number || ''}
                    onChange={(e) => setSecrets({...secrets, twilio_whatsapp_number: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="+14155238886"
                  />
                </div>
              </div>
            </div>

            {/* Stripe */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">💳 Stripe Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secret Key
                    <a href="https://dashboard.stripe.com/apikeys" target="_blank" className="ml-2 text-blue-500 text-xs">Get from Stripe →</a>
                  </label>
                  <input
                    type="password"
                    value={secrets.stripe_secret_key || ''}
                    onChange={(e) => setSecrets({...secrets, stripe_secret_key: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="sk_live_..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
                  <input
                    type="text"
                    value={secrets.stripe_publishable_key || ''}
                    onChange={(e) => setSecrets({...secrets, stripe_publishable_key: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="pk_live_..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
                  <input
                    type="password"
                    value={secrets.stripe_webhook_secret || ''}
                    onChange={(e) => setSecrets({...secrets, stripe_webhook_secret: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="whsec_..."
                  />
                </div>
              </div>
            </div>

            {/* Google APIs */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">📅 Google APIs Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client ID
                    <a href="https://console.cloud.google.com" target="_blank" className="ml-2 text-blue-500 text-xs">Get from Google Cloud →</a>
                  </label>
                  <input
                    type="text"
                    value={secrets.google_client_id || ''}
                    onChange={(e) => setSecrets({...secrets, google_client_id: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="123456789-abc.apps.googleusercontent.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                  <input
                    type="password"
                    value={secrets.google_client_secret || ''}
                    onChange={(e) => setSecrets({...secrets, google_client_secret: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="GOCSPX-..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refresh Token</label>
                  <input
                    type="password"
                    value={secrets.google_refresh_token || ''}
                    onChange={(e) => setSecrets({...secrets, google_refresh_token: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="1//..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calendar ID (Email)</label>
                  <input
                    type="email"
                    value={secrets.google_calendar_id || ''}
                    onChange={(e) => setSecrets({...secrets, google_calendar_id: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="youremail@gmail.com"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold"
            >
              {saving ? 'Saving Secrets...' : '🔐 Save Secrets (Encrypted)'}
            </button>
          </form>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">📋 Integration Status</h2>
              <div className="space-y-3">
                <IntegrationRow name="OpenAI GPT-4" status={systemStatus.openai} />
                <IntegrationRow name="Meta WhatsApp" status={systemStatus.meta} />
                <IntegrationRow name="Twilio WhatsApp" status={systemStatus.twilio} />
                <IntegrationRow name="Stripe Payments" status={systemStatus.stripe} />
                <IntegrationRow name="Google Calendar" status={systemStatus.google} />
                <IntegrationRow name="Supabase Database" status={systemStatus.supabase} />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Configure API credentials in the Secrets tab (Admin only) to enable integrations.
              </p>
            </div>
          </div>
        )}

        {/* Show message if user tries to access Secrets without permission */}
        {activeTab === 'secrets' && !isAdmin && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-900 mb-2">🔐 Access Denied</h2>
            <p className="text-red-700">Only Admin and Owner roles can access the Secrets tab.</p>
            <p className="text-sm text-red-600 mt-2">Your role: {employee?.role_name}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Tab Button Component
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium border-b-2 transition-colors ${
        active
          ? 'border-purple-600 text-purple-600'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

// Status Card Component
function StatusCard({ name, status, description }: { name: string; status: boolean; description: string }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{name}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {status ? '✓ Ready' : 'Not Set'}
        </span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

// Provider Card Component
function ProviderCard({
  name,
  icon,
  active,
  description,
  features,
  onClick
}: {
  name: string
  icon: string
  active: boolean
  description: string
  features: string[]
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`relative bg-white border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${
        active ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
      }`}
    >
      {active && (
        <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
          ✓ Active
        </div>
      )}
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-green-500">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Integration Row Component
function IntegrationRow({ name, status }: { name: string; status: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="font-medium text-gray-700">{name}</span>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
        {status ? '✓ Connected' : 'Not Configured'}
      </span>
    </div>
  )
}
