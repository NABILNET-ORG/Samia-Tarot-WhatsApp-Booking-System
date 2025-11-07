/**
 * 👤 Customer Info Panel
 * Right sidebar with customer details and history
 */

'use client'

import { useEffect, useState } from 'react'

type CustomerInfo = {
  name?: string
  phone: string
  email?: string
  total_bookings?: number
  total_spent?: number
  vip_status?: boolean
  created_at: string
}

type CustomerInfoPanelProps = {
  conversationId: string
}

export function CustomerInfoPanel({ conversationId }: CustomerInfoPanelProps) {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCustomerInfo()
  }, [conversationId])

  async function loadCustomerInfo() {
    try {
      setLoading(true)
      const response = await fetch(`/api/conversations/${conversationId}/customer`)
      const data = await response.json()

      if (data.customer) {
        setCustomer(data.customer)
      }
    } catch (error) {
      console.error('Failed to load customer info:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
        Customer information not available
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center">
          <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-3">
            {customer.name?.[0] || customer.phone[0]}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {customer.name || 'Unknown'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{customer.phone}</p>
          {customer.vip_status && (
            <span className="mt-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 text-xs font-semibold rounded-full">
              VIP Customer
            </span>
          )}
        </div>
      </div>

      {/* Customer Details */}
      <div className="p-6 space-y-6">
        {/* Contact Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{customer.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{customer.total_bookings || 0}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${customer.total_spent?.toFixed(0) || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Since */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Customer Since</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {new Date(customer.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors">
            Block Customer
          </button>
        </div>
      </div>
    </div>
  )
}
