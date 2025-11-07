/**
 * 📊 Analytics Dashboard
 */

'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ConversationTrend {
  date: string
  count: number
}

interface RevenueTrend {
  date: string
  revenue: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [conversationTrend, setConversationTrend] = useState<ConversationTrend[]>([])
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([])

  useEffect(() => {
    loadAnalytics()
    loadTrends()
  }, [])

  async function loadAnalytics() {
    try {
      const response = await fetch('/api/analytics')
      const data = await response.json()
      if (data.analytics) setAnalytics(data.analytics)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function loadTrends() {
    try {
      // Fetch conversation trends (last 30 days)
      const conversationsRes = await fetch('/api/conversations?limit=1000')
      const conversationsData = await conversationsRes.json()

      if (conversationsData.conversations) {
        // Group by date
        const conversationsByDate: Record<string, number> = {}
        conversationsData.conversations.forEach((conv: any) => {
          const date = new Date(conv.created_at).toLocaleDateString()
          conversationsByDate[date] = (conversationsByDate[date] || 0) + 1
        })

        const conversationTrendData = Object.entries(conversationsByDate)
          .map(([date, count]) => ({ date, count }))
          .slice(0, 30)
          .reverse()

        setConversationTrend(conversationTrendData)
      }

      // Fetch revenue trends
      const bookingsRes = await fetch('/api/bookings?status=completed')
      const bookingsData = await bookingsRes.json()

      if (bookingsData.bookings) {
        const revenueByDate: Record<string, number> = {}
        bookingsData.bookings.forEach((booking: any) => {
          const date = new Date(booking.booking_date).toLocaleDateString()
          revenueByDate[date] = (revenueByDate[date] || 0) + (booking.price || 0)
        })

        const revenueTrendData = Object.entries(revenueByDate)
          .map(([date, revenue]) => ({ date, revenue }))
          .slice(0, 30)
          .reverse()

        setRevenueTrend(revenueTrendData)
      }
    } catch (error) {
      console.error('Error loading trends:', error)
    }
  }

  const handleExport = (type: string, format: string) => {
    const url = `/api/analytics/export?type=${type}&format=${format}`
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('conversations', 'csv')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleExport('conversations', 'json')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
            >
              Export JSON
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg border p-6">
                <p className="text-gray-600 text-sm mb-2">Total Conversations</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.total_conversations || 0}</p>
              </div>
              <div className="bg-white rounded-lg border p-6">
                <p className="text-gray-600 text-sm mb-2">Total Bookings</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.total_bookings || 0}</p>
              </div>
              <div className="bg-white rounded-lg border p-6">
                <p className="text-gray-600 text-sm mb-2">Total Customers</p>
                <p className="text-3xl font-bold text-green-600">{analytics.total_customers || 0}</p>
              </div>
              <div className="bg-white rounded-lg border p-6">
                <p className="text-gray-600 text-sm mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-purple-600">${analytics.total_revenue || 0}</p>
              </div>
            </div>

            {/* Conversation Trend Chart */}
            {conversationTrend.length > 0 && (
              <div className="bg-white rounded-lg border p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Conversation Trend (Last 30 Days)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={conversationTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Conversations"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Revenue Trend Chart */}
            {revenueTrend.length > 0 && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-bold mb-4">Revenue Trend (Last 30 Days)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
