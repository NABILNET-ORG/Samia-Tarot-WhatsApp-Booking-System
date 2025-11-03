'use client'

import { useEffect, useState } from 'react'

type EnvStatus = {
  openai_configured: boolean
  meta_configured: boolean
  twilio_configured: boolean
  stripe_configured: boolean
  google_configured: boolean
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>({})
  const [envStatus, setEnvStatus] = useState<EnvStatus>({
    openai_configured: false,
    meta_configured: false,
    twilio_configured: false,
    stripe_configured: false,
    google_configured: false,
  })
  const [currentProvider, setCurrentProvider] = useState<'meta' | 'twilio'>('meta')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      setSettings(data.settings)
      setEnvStatus(data.env_status)
      setCurrentProvider(data.settings.whatsapp_provider?.value || 'meta')
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function switchProvider(provider: 'meta' | 'twilio') {
    try {
      setSaving(true)

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'whatsapp_provider',
          value: provider,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setCurrentProvider(provider)
        alert(`✅ Switched to ${provider === 'meta' ? 'Meta WhatsApp Business' : 'Twilio'}!`)
        loadSettings()
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (error: any) {
      alert(`❌ Failed to switch provider: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function updateSetting(key: string, value: string) {
    try {
      setSaving(true)

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })

      if (response.ok) {
        alert('✅ Setting updated!')
        loadSettings()
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error: any) {
      alert(`❌ Failed: ${error.message}`)
    } finally {
      setSaving(false)
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
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-purple-900 mb-2">
          ⚙️ System Settings
        </h1>
        <p className="text-gray-600">Manage all system configuration</p>
      </div>

      {/* System Status */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">🔍 System Status</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <StatusCard
              title="OpenAI (GPT-4)"
              configured={envStatus.openai_configured}
              icon="🤖"
              description="Required for AI conversations"
            />
            <StatusCard
              title="Meta WhatsApp"
              configured={envStatus.meta_configured}
              icon="📱"
              description="Official WhatsApp Business API"
            />
            <StatusCard
              title="Twilio"
              configured={envStatus.twilio_configured}
              icon="📞"
              description="Twilio WhatsApp API"
            />
            <StatusCard
              title="Stripe"
              configured={envStatus.stripe_configured}
              icon="💳"
              description="Payment processing"
            />
            <StatusCard
              title="Google APIs"
              configured={envStatus.google_configured}
              icon="📅"
              description="Calendar & Contacts"
            />
            <StatusCard
              title="Supabase"
              configured={true}
              icon="💾"
              description="Database (always configured)"
            />
          </div>
        </div>
      </div>

      {/* WhatsApp Provider Selection */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">📱 WhatsApp Provider</h2>
          <p className="text-gray-600 mb-6">
            Choose between Meta WhatsApp Business API or Twilio. You can switch anytime!
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Meta Option */}
            <button
              onClick={() => switchProvider('meta')}
              disabled={saving || !envStatus.meta_configured}
              className={`p-6 rounded-xl border-2 transition-all ${
                currentProvider === 'meta'
                  ? 'border-purple-500 bg-purple-50 mystical-glow'
                  : 'border-gray-200 hover:border-purple-300'
              } ${!envStatus.meta_configured ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📱</div>
                {currentProvider === 'meta' && (
                  <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    ✅ Active
                  </div>
                )}
                {!envStatus.meta_configured && (
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                    Not Configured
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold mb-2">Meta WhatsApp Business</h3>
              <p className="text-sm text-gray-600 mb-4">
                Official Meta platform with advanced features
              </p>

              <ul className="text-sm text-left space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Interactive messages
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Message templates
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Business verification
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Free tier available
                </li>
              </ul>

              {!envStatus.meta_configured && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
                  <p className="font-bold">⚠️ Not Configured</p>
                  <p className="text-gray-600">Add Meta credentials to .env file</p>
                </div>
              )}
            </button>

            {/* Twilio Option */}
            <button
              onClick={() => switchProvider('twilio')}
              disabled={saving || !envStatus.twilio_configured}
              className={`p-6 rounded-xl border-2 transition-all ${
                currentProvider === 'twilio'
                  ? 'border-purple-500 bg-purple-50 mystical-glow'
                  : 'border-gray-200 hover:border-purple-300'
              } ${!envStatus.twilio_configured ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📞</div>
                {currentProvider === 'twilio' && (
                  <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    ✅ Active
                  </div>
                )}
                {!envStatus.twilio_configured && (
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                    Not Configured
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold mb-2">Twilio</h3>
              <p className="text-sm text-gray-600 mb-4">
                Easy setup with developer-friendly tools
              </p>

              <ul className="text-sm text-left space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Quick integration
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Simple pricing
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Great documentation
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Instant sandbox
                </li>
              </ul>

              {!envStatus.twilio_configured && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
                  <p className="font-bold">⚠️ Not Configured</p>
                  <p className="text-gray-600">Add Twilio credentials to .env file</p>
                </div>
              )}
            </button>
          </div>

          {saving && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2">
                <div className="spinner"></div>
                <span>Switching provider...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Business Settings */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">🏢 Business Settings</h2>

          <div className="space-y-4">
            <SettingRow
              label="Admin Phone Number"
              value={settings.admin_phone?.value || '+9613620860'}
              onSave={(value) => updateSetting('admin_phone', value)}
              description="Phone number for admin notifications"
            />

            <SettingRow
              label="Business Timezone"
              value={settings.business_timezone?.value || 'Asia/Beirut'}
              onSave={(value) => updateSetting('business_timezone', value)}
              description="Timezone for scheduling"
            />

            <SettingRow
              label="Call Hours Start"
              value={settings.call_hours_start?.value || '12'}
              type="number"
              onSave={(value) => updateSetting('call_hours_start', value)}
              description="Call availability start hour (24h format)"
            />

            <SettingRow
              label="Call Hours End"
              value={settings.call_hours_end?.value || '20'}
              type="number"
              onSave={(value) => updateSetting('call_hours_end', value)}
              description="Call availability end hour (24h format)"
            />

            <SettingRow
              label="Call Buffer Minutes"
              value={settings.call_buffer_minutes?.value || '30'}
              type="number"
              onSave={(value) => updateSetting('call_buffer_minutes', value)}
              description="Minutes between appointments"
            />

            <SettingRow
              label="VIP Threshold ($)"
              value={settings.auto_vip_threshold?.value || '500'}
              type="number"
              onSave={(value) => updateSetting('auto_vip_threshold', value)}
              description="Total spend to become VIP"
            />
          </div>
        </div>
      </div>

      {/* Configuration Guide */}
      <div className="max-w-7xl mx-auto">
        <div className="card bg-blue-50 border-blue-200">
          <h2 className="text-2xl font-bold mb-4">📖 How to Configure</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">1️⃣ Edit .env File</h3>
              <p className="text-sm text-gray-700 mb-2">
                Open <code className="bg-white px-2 py-1 rounded">.env</code> file in project root
              </p>
              <pre className="bg-white p-4 rounded text-xs overflow-x-auto">
                {`# Example .env configuration:
OPENAI_API_KEY="sk-proj-YOUR_KEY_HERE"
WHATSAPP_PROVIDER="twilio"
TWILIO_ACCOUNT_SID="ACxxx..."
TWILIO_AUTH_TOKEN="xxx..."`}
              </pre>
            </div>

            <div>
              <h3 className="font-bold mb-2">2️⃣ Get API Keys</h3>
              <ul className="text-sm space-y-2">
                <li>
                  <span className="font-bold">OpenAI:</span>{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    className="text-purple-600 hover:underline"
                  >
                    platform.openai.com/api-keys
                  </a>
                </li>
                <li>
                  <span className="font-bold">Twilio:</span>{' '}
                  <a
                    href="https://console.twilio.com"
                    target="_blank"
                    className="text-purple-600 hover:underline"
                  >
                    console.twilio.com
                  </a>
                </li>
                <li>
                  <span className="font-bold">Meta:</span>{' '}
                  <a
                    href="https://developers.facebook.com"
                    target="_blank"
                    className="text-purple-600 hover:underline"
                  >
                    developers.facebook.com
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-2">3️⃣ Restart Server</h3>
              <p className="text-sm text-gray-700">
                After editing .env, restart the development server:
              </p>
              <pre className="bg-white p-4 rounded text-xs mt-2">npm run dev</pre>
            </div>

            <div>
              <h3 className="font-bold mb-2">4️⃣ Switch Provider Here</h3>
              <p className="text-sm text-gray-700">
                Once credentials are in .env, use the buttons above to switch providers!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusCard({
  title,
  configured,
  icon,
  description,
}: {
  title: string
  configured: boolean
  icon: string
  description: string
}) {
  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        configured ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-bold">{title}</h3>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-bold ${
            configured ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {configured ? '✅ Ready' : '❌ Not Set'}
        </div>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

function SettingRow({
  label,
  value,
  type = 'text',
  onSave,
  description,
}: {
  label: string
  value: string
  type?: string
  onSave: (value: string) => void
  description: string
}) {
  const [editing, setEditing] = useState(false)
  const [newValue, setNewValue] = useState(value)

  return (
    <div className="border-b pb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-bold">{label}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>

        {editing ? (
          <div className="flex gap-2">
            <input
              type={type}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="input w-48"
            />
            <button
              onClick={() => {
                onSave(newValue)
                setEditing(false)
              }}
              className="btn btn-primary"
            >
              ✓
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setNewValue(value)
              }}
              className="btn btn-secondary"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-mono text-purple-600">{value}</span>
            <button onClick={() => setEditing(true)} className="btn btn-secondary">
              ✏️ Edit
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
