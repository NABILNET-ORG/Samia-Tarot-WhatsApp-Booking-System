/**
 * 👑 Admin Dashboard Page
 * System-wide overview for admins/owners
 */

'use client'

import { useEffect, useState } from 'react'
import { useBusinessContext } from '@/lib/multi-tenant/context'
import toast from 'react-hot-toast'

type DashboardStats = {
  totalBookings: number
  todayBookings: number
  pendingPayments: number
  activeConversations: number
}

type SystemSettings = {
  whatsapp_provider: string
  openai_configured: boolean
  meta_configured: boolean
  twilio_configured: boolean
  stripe_configured: boolean
  google_configured: boolean
}

export default function AdminDashboardPage() {
  const { business, employee } = useBusinessContext()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [switchingProvider, setSwitchingProvider] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)

      // Load stats
      const statsResponse = await fetch('/api/admin/dashboard')
      const statsData = await statsResponse.json()

      if (statsData.stats) {
        setStats(statsData.stats)
      }

      // Load settings
      const settingsResponse = await fetch('/api/admin/settings')
      const settingsData = await settingsResponse.json()

      if (settingsData.env_status) {
        setSettings({
          whatsapp_provider: statsData.provider || 'meta',
          ...settingsData.env_status,
        })
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSwitchProvider(provider: 'meta' | 'twilio') {
    if (!confirm(`Switch WhatsApp provider to ${provider.toUpperCase()}?`)) {
      return
    }

    setSwitchingProvider(true)
    try {
      const response = await fetch('/api/admin/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })

      if (response.ok) {
        toast.success(`Successfully switched to ${provider.toUpperCase()}`)
        await loadDashboardData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to switch provider')
      }
    } catch (error) {
      console.error('Failed to switch provider:', error)
      toast.error('Failed to switch provider')
    } finally {
      setSwitchingProvider(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  // Check if user is admin/owner
  const isAdmin = ['admin', 'owner'].includes(employee?.role_name?.toLowerCase() || '')

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300">You need admin or owner role to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">System-wide overview and settings</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today's Bookings</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.todayBookings}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payments</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingPayments}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Chats</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.activeConversations}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Provider Section */}
        {settings && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">WhatsApp Provider</h2>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Provider</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 uppercase">
                  {settings.whatsapp_provider}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSwitchProvider('meta')}
                  disabled={switchingProvider || settings.whatsapp_provider === 'meta'}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    settings.whatsapp_provider === 'meta'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50`}
                >
                  Meta
                </button>
                <button
                  onClick={() => handleSwitchProvider('twilio')}
                  disabled={switchingProvider || settings.whatsapp_provider === 'twilio'}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    settings.whatsapp_provider === 'twilio'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50`}
                >
                  Twilio
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Switch between Meta and Twilio WhatsApp API providers
            </div>
          </div>
        )}

        {/* Quick Links to Admin Tools */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Admin Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="/dashboard/settings" className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">
              <div className="text-2xl mb-1">⚙️</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Settings</div>
            </a>
            <a href="/dashboard/employees" className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">
              <div className="text-2xl mb-1">👨‍💼</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Team</div>
            </a>
            <a href="/dashboard/roles" className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">
              <div className="text-2xl mb-1">🔐</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Roles</div>
            </a>
            <a href="/dashboard/templates" className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">
              <div className="text-2xl mb-1">📝</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Templates</div>
            </a>
            <a href="/dashboard/ai-instructions" className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">
              <div className="text-2xl mb-1">🤖</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">AI Config</div>
            </a>
            <a href="/dashboard/analytics" className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Analytics</div>
            </a>
            <a href="/dashboard/notes" className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">
              <div className="text-2xl mb-1">📝</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Notes</div>
            </a>
            <a href="/dashboard/media" className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">
              <div className="text-2xl mb-1">📁</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Media</div>
            </a>
            <a href="/dashboard/sessions" className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">
              <div className="text-2xl mb-1">🔐</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Sessions</div>
            </a>
            <a href="/dashboard/logs/activity" className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">
              <div className="text-2xl mb-1">📋</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Activity Logs</div>
            </a>
            <a href="/dashboard/logs/webhooks" className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">
              <div className="text-2xl mb-1">🔗</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Webhook Logs</div>
            </a>
            <a href="/dashboard/voice" className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">
              <div className="text-2xl mb-1">🎤</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Voice</div>
            </a>
          </div>
        </div>

        {/* System Status */}
        {settings && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">System Status</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">OpenAI API</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  settings.openai_configured
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                }`}>
                  {settings.openai_configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Meta WhatsApp</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  settings.meta_configured
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                }`}>
                  {settings.meta_configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Twilio</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  settings.twilio_configured
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                }`}>
                  {settings.twilio_configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stripe Payments</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  settings.stripe_configured
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                }`}>
                  {settings.stripe_configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Google APIs</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  settings.google_configured
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                }`}>
                  {settings.google_configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Business</span>
                <span className="text-sm text-gray-900 dark:text-white font-medium">
                  {business?.name || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
