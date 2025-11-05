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

  useEffect(() => {
    if (business) {
      loadSettings()
    }
  }, [business])

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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Business Settings</h1>

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
