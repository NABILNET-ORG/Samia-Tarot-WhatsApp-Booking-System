/**
 * 👑 Admin Dashboard Page
 * System-wide overview for admins/owners
 */

'use client'

import { useEffect, useState } from 'react'
import { useBusinessContext } from '@/lib/multi-tenant/context'

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
        alert(`Successfully switched to ${provider.toUpperCase()}`)
        await loadDashboardData()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to switch provider')
      }
    } catch (error) {
      console.error('Failed to switch provider:', error)
      alert('Failed to switch provider')
    } finally {
      setSwitchingProvider(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  // Check if user is admin/owner
  const isAdmin = ['admin', 'owner'].includes(employee?.role_name?.toLowerCase() || '')

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need admin or owner role to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System-wide overview and settings</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Bookings</p>
                  <p className="text-3xl font-bold text-green-600">{stats.todayBookings}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Payments</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendingPayments}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Chats</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.activeConversations}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Provider Section */}
        {settings && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">WhatsApp Provider</h2>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Current Provider</p>
                <p className="text-2xl font-bold text-purple-600 uppercase">
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

            <div className="text-sm text-gray-600">
              Switch between Meta and Twilio WhatsApp API providers
            </div>
          </div>
        )}

        {/* System Status */}
        {settings && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">OpenAI API</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  settings.openai_configured
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {settings.openai_configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Meta WhatsApp</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  settings.meta_configured
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {settings.meta_configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Twilio</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  settings.twilio_configured
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {settings.twilio_configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Stripe Payments</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  settings.stripe_configured
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {settings.stripe_configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Google APIs</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  settings.google_configured
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {settings.google_configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Business</span>
                <span className="text-sm text-gray-900 font-medium">
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
