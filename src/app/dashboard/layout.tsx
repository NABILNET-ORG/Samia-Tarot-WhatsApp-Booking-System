/**
 * 📱 Dashboard Layout
 * Wraps dashboard with BusinessProvider and navigation
 */

'use client'

import { BusinessProvider } from '@/lib/multi-tenant/context'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BusinessProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-gray-900">WhatsApp AI Platform</h1>
              <div className="flex gap-4">
                <a
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Chat
                </a>
                <a
                  href="/dashboard/employees"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Team
                </a>
                <a
                  href="/dashboard/templates"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Templates
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NotificationCenter />
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' })
                  window.location.href = '/login'
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>{children}</main>
      </div>
    </BusinessProvider>
  )
}
