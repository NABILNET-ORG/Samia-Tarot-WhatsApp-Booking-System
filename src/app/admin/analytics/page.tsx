'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState({
    today: 0,
    week: 0,
    month: 0,
    allTime: 0,
  })
  const [topServices, setTopServices] = useState<any[]>([])
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    vip: 0,
    active: 0,
  })

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    try {
      setLoading(true)

      // Today's revenue
      const today = new Date().toISOString().split('T')[0]
      const { data: todayBookings } = await supabase
        .from('bookings')
        .select('amount')
        .gte('created_at', today)
        .eq('payment_status', 'completed')

      const todayRevenue = todayBookings?.reduce((sum, b) => sum + Number(b.amount), 0) || 0

      // This week's revenue
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const { data: weekBookings } = await supabase
        .from('bookings')
        .select('amount')
        .gte('created_at', weekStart.toISOString())
        .eq('payment_status', 'completed')

      const weekRevenue = weekBookings?.reduce((sum, b) => sum + Number(b.amount), 0) || 0

      // This month's revenue
      const monthStart = new Date()
      monthStart.setDate(1)
      const { data: monthBookings } = await supabase
        .from('bookings')
        .select('amount')
        .gte('created_at', monthStart.toISOString())
        .eq('payment_status', 'completed')

      const monthRevenue = monthBookings?.reduce((sum, b) => sum + Number(b.amount), 0) || 0

      // All-time revenue
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('amount')
        .eq('payment_status', 'completed')

      const allTimeRevenue = allBookings?.reduce((sum, b) => sum + Number(b.amount), 0) || 0

      setRevenue({
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
        allTime: allTimeRevenue,
      })

      // Top services (from view)
      const { data: popularServices } = await supabase
        .from('service_popularity')
        .select('*')
        .eq('is_active', true)
        .order('total_bookings', { ascending: false })
        .limit(5)

      setTopServices(popularServices || [])

      // Customer stats
      const { data: customers } = await supabase.from('customers').select('vip_status, total_bookings')

      const vipCount = customers?.filter((c) => c.vip_status).length || 0
      const activeCount = customers?.filter((c) => c.total_bookings > 0).length || 0

      setCustomerStats({
        total: customers?.length || 0,
        vip: vipCount,
        active: activeCount,
      })
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
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
          📊 Analytics Dashboard
        </h1>
        <p className="text-gray-600">Track your business performance</p>
      </div>

      {/* Revenue Stats */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-xl font-bold mb-4">💰 Revenue</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RevenueCard title="Today" amount={revenue.today} icon="📅" />
          <RevenueCard title="This Week" amount={revenue.week} icon="📆" />
          <RevenueCard title="This Month" amount={revenue.month} icon="📊" />
          <RevenueCard title="All Time" amount={revenue.allTime} icon="💎" />
        </div>
      </div>

      {/* Customer Stats */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-xl font-bold mb-4">👥 Customers</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Customers" value={customerStats.total} icon="👤" />
          <StatCard title="Active" value={customerStats.active} icon="✅" color="green" />
          <StatCard title="VIP" value={customerStats.vip} icon="👑" color="purple" />
        </div>
      </div>

      {/* Top Services */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-xl font-bold mb-4">🔥 Top Services</h2>
        <div className="card">
          {topServices.length > 0 ? (
            <div className="space-y-4">
              {topServices.map((service, idx) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 bg-purple-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-purple-300">#{idx + 1}</span>
                    <div>
                      <p className="font-bold">{service.name_english}</p>
                      <p className="text-sm text-gray-600">
                        {service.total_bookings} bookings • ${service.total_revenue || 0} revenue
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">${service.price}</p>
                    {service.avg_rating && (
                      <p className="text-sm text-yellow-600">
                        ⭐ {service.avg_rating.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No bookings yet</p>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="max-w-7xl mx-auto text-center">
        <button onClick={loadAnalytics} className="btn btn-primary">
          🔄 Refresh Analytics
        </button>
      </div>
    </div>
  )
}

function RevenueCard({ title, amount, icon }: { title: string; amount: number; icon: string }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl md:text-3xl font-bold text-green-600">
          ${amount.toFixed(0)}
        </span>
      </div>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color = 'purple',
}: {
  title: string
  value: number
  icon: string
  color?: string
}) {
  const colorClasses = {
    purple: 'text-purple-600',
    green: 'text-green-600',
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-3xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
          {value}
        </span>
      </div>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  )
}
