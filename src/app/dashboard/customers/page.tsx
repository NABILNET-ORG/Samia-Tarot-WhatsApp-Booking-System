/**
 * 👥 Customer Management Page
 */

'use client'

import { useEffect, useState } from 'react'
import { useBusinessContext } from '@/lib/multi-tenant/context'

export default function CustomersPage() {
  const { business } = useBusinessContext()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [search])

  async function loadCustomers() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)

      const response = await fetch(`/api/customers?${params}`)
      const data = await response.json()
      if (data.customers) setCustomers(data.customers)
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Add Customer
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {customer.name_english || customer.name_arabic || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{customer.phone}</td>
                    <td className="px-6 py-4 text-gray-600">{customer.total_bookings || 0}</td>
                    <td className="px-6 py-4 text-gray-600">${customer.total_spent || 0}</td>
                    <td className="px-6 py-4">
                      {customer.vip_status && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">VIP</span>
                      )}
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
