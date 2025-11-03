'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (
            name_english,
            name_arabic,
            phone,
            vip_status
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Failed to load bookings:', error)
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
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-purple-900 mb-2">
          📖 All Bookings
        </h1>
        <p className="text-gray-600">View and manage all customer bookings</p>
      </div>

      <div className="max-w-7xl mx-auto">
        {bookings.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">No bookings yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Bookings will appear here once customers complete payments
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="card">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">
                        {booking.customers?.name_english || booking.phone}
                      </h3>
                      {booking.customers?.vip_status && (
                        <span className="text-yellow-500">👑</span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{booking.service_name}</p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {booking.service_type}
                      </span>
                      <span
                        className={`px-2 py-1 rounded ${
                          booking.payment_status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {booking.payment_status}
                      </span>
                      <span
                        className={`px-2 py-1 rounded ${
                          booking.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-bold text-purple-600">${booking.amount}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {booking.scheduled_date && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      📅 Scheduled: {new Date(booking.scheduled_date).toLocaleString()}
                    </p>
                  </div>
                )}

                {booking.google_meet_link && (
                  <div className="mt-2">
                    <a
                      href={booking.google_meet_link}
                      target="_blank"
                      className="text-sm text-purple-600 hover:underline"
                    >
                      📞 Google Meet Link
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
