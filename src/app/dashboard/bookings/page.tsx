/**
 * 📅 Booking Management Page
 */

'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadBookings()
  }, [filter])

  async function loadBookings() {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const response = await fetch(`/api/bookings${params}`)
      const data = await response.json()
      if (data.bookings) setBookings(data.bookings)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">Bookings</h1>

        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                filter === status ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto" />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Customer</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Service</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase hidden sm:table-cell">Amount</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 dark:text-white">{booking.customers?.name_english || booking.phone}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 dark:text-white">{booking.services?.name_english || booking.service_name}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 dark:text-white hidden sm:table-cell">${booking.amount}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'completed' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' :
                        booking.status === 'confirmed' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' :
                        booking.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' :
                        'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                      {booking.scheduled_date ? new Date(booking.scheduled_date).toLocaleDateString() : 'Not scheduled'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
