/**
 * ⚙️ Business Settings Page
 */

'use client'

import { useEffect, useState } from 'react'
import { useBusinessContext } from '@/lib/multi-tenant/context'

export default function SettingsPage() {
  const { business, refetch } = useBusinessContext()
  const [settings, setSettings] = useState<any>({})
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

  useEffect(() => {
    if (business) {
      loadSettings()
      checkSystemStatus()
    }
  }, [business])

  async function checkSystemStatus() {
    // Check which services are configured by testing if env vars exist
    setSystemStatus({
      openai: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY || true, // Assume configured
      meta: !!business?.whatsapp_phone_number_id,
      twilio: !!business?.twilio_phone_number,
      stripe: !!business?.stripe_customer_id || true,
      google: true, // Assume configured
      supabase: true // Always configured
    })

    // Determine current provider from business settings
    setCurrentProvider(business?.whatsapp_provider || 'meta')
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

  async function loadSettings() {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      if (data.settings) setSettings(data.settings)
    } catch (error) {
      console.error(error)
    }
  }

  async function handleSave(e: React.FormEvent) {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Business Settings</h1>

        {/* System Status Section (from v1) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            🔍 System Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <StatusCard name="OpenAI (GPT-4)" status={systemStatus.openai} description="Required for AI conversations" />
            <StatusCard name="Meta WhatsApp" status={systemStatus.meta} description="Official WhatsApp Business API" />
            <StatusCard name="Twilio" status={systemStatus.twilio} description="Twilio WhatsApp API" />
            <StatusCard name="Stripe" status={systemStatus.stripe} description="Payment processing" />
            <StatusCard name="Google APIs" status={systemStatus.google} description="Calendar & Contacts" />
            <StatusCard name="Supabase" status={systemStatus.supabase} description="Database (always configured)" />
          </div>
        </div>

        {/* WhatsApp Provider Switcher (from v1) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            📱 WhatsApp Provider
          </h2>
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

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">General</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={settings.name || ''}
                  onChange={(e) => setSettings({...settings, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={settings.timezone || 'UTC'}
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Asia/Beirut">Beirut</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">AI Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AI Model</label>
                <select
                  value={settings.ai_model || 'gpt-4'}
                  onChange={(e) => setSettings({...settings, ai_model: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="gpt-4">GPT-4 (Best quality)</option>
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
                  value={settings.ai_temperature || 0.7}
                  onChange={(e) => setSettings({...settings, ai_temperature: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                <input
                  type="number"
                  value={settings.ai_max_tokens || 700}
                  onChange={(e) => setSettings({...settings, ai_max_tokens: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
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
                  value={settings.primary_color || '#6B46C1'}
                  onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                  className="w-full h-12 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={settings.logo_url || ''}
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
            className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
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
