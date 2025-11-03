'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentProvider, setCurrentProvider] = useState<'meta' | 'twilio'>('meta')
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    pendingPayments: 0,
    activeConversations: 0,
  })

  useEffect(() => {
    checkAuth()
    loadDashboardData()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth/check')
      if (res.ok) {
        setIsAuthenticated(true)
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setCurrentProvider(data.provider)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const switchProvider = async (provider: 'meta' | 'twilio') => {
    try {
      const res = await fetch('/api/admin/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })

      if (res.ok) {
        setCurrentProvider(provider)
        alert(`✅ Switched to ${provider === 'meta' ? 'Meta WhatsApp Business' : 'Twilio'}!`)

        // Reload dashboard data to sync
        loadDashboardData()

        // Reload page to update all components
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (error) {
      console.error('Failed to switch provider:', error)
      alert('❌ Failed to switch provider')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen p-4 md:p-8 safe-top safe-bottom">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-purple-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">Manage Samia Tarot booking system</p>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Bookings" value={stats.totalBookings} icon="📊" />
        <StatCard title="Today" value={stats.todayBookings} icon="📅" />
        <StatCard title="Pending Payments" value={stats.pendingPayments} icon="💳" />
        <StatCard title="Active Chats" value={stats.activeConversations} icon="💬" />
      </div>

      {/* WhatsApp Provider Selector */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="card">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">
            WhatsApp Provider
          </h2>
          <p className="text-gray-600 mb-6">
            Choose between Meta WhatsApp Business API or Twilio
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Meta Option */}
            <button
              onClick={() => switchProvider('meta')}
              className={`p-6 rounded-xl border-2 transition-all ${
                currentProvider === 'meta'
                  ? 'border-purple-500 bg-purple-50 mystical-glow'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📱</div>
                {currentProvider === 'meta' && (
                  <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm">
                    Active
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">Meta WhatsApp Business</h3>
              <p className="text-sm text-gray-600">
                Official Meta platform with advanced features
              </p>
              <ul className="mt-4 text-sm text-left space-y-2">
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
              </ul>
            </button>

            {/* Twilio Option */}
            <button
              onClick={() => switchProvider('twilio')}
              className={`p-6 rounded-xl border-2 transition-all ${
                currentProvider === 'twilio'
                  ? 'border-purple-500 bg-purple-50 mystical-glow'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📞</div>
                {currentProvider === 'twilio' && (
                  <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm">
                    Active
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">Twilio</h3>
              <p className="text-sm text-gray-600">
                Easy setup with developer-friendly tools
              </p>
              <ul className="mt-4 text-sm text-left space-y-2">
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
              </ul>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-4">
        <ActionCard
          title="View Bookings"
          icon="📖"
          href="/admin/bookings"
          description="Manage all customer bookings"
        />
        <ActionCard
          title="Conversations"
          icon="💬"
          href="/admin/conversations"
          description="View active customer chats"
        />
        <ActionCard
          title="Settings"
          icon="⚙️"
          href="/admin/settings"
          description="Configure system settings"
        />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold text-purple-600">{value}</span>
      </div>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  )
}

function ActionCard({
  title,
  icon,
  href,
  description,
}: {
  title: string
  icon: string
  href: string
  description: string
}) {
  return (
    <a href={href} className="card hover:shadow-xl transition-all cursor-pointer">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
  )
}
