/**
 * 📊 Analytics Dashboard
 */

'use client'

import { useEffect, useState } from 'react'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Analytics</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        )}
      </div>
    </div>
  )
}
