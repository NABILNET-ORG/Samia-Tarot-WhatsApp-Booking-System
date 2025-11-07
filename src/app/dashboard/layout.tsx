/**
 * 📱 Dashboard Layout
 * Wraps dashboard with BusinessProvider and navigation
 */

'use client'

import { useState } from 'react'
import { BusinessProvider } from '@/lib/multi-tenant/context'
import { ThemeProvider } from '@/lib/theme/ThemeProvider'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <ThemeProvider>
      <BusinessProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile-First Top Navigation */}
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Left: Menu Button (mobile) + Logo */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">WhatsApp AI</h1>
              </div>

              {/* Desktop Navigation (hidden on mobile) - Simplified to main pages only */}
              <div className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm">
                <a href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium whitespace-nowrap">💬 Chat</a>
                <a href="/dashboard/customers" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium whitespace-nowrap">👥 Customers</a>
                <a href="/dashboard/services" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium whitespace-nowrap">🛎️ Services</a>
                <a href="/dashboard/bookings" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium whitespace-nowrap">📅 Bookings</a>
                <a href="/dashboard/admin" className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium whitespace-nowrap">👑 Admin</a>
              </div>

              {/* Right: Theme Toggle + Notifications + Logout */}
              <div className="flex items-center gap-2 sm:gap-4">
                <ThemeToggle />
                <NotificationCenter />
                {/* Desktop Logout */}
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' })
                    window.location.href = '/login'
                  }}
                  className="hidden sm:block px-3 sm:px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                >
                  Logout
                </button>
                {/* Mobile Logout Icon */}
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' })
                    window.location.href = '/login'
                  }}
                  className="sm:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Logout"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <div className="lg:hidden mt-4 pb-3 space-y-1 border-t border-gray-200 pt-4">
                <a href="/dashboard" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  💬 Chat
                </a>
                <a href="/dashboard/customers" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  👥 Customers
                </a>
                <a href="/dashboard/services" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  🛎️ Services
                </a>
                <a href="/dashboard/bookings" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  📅 Bookings
                </a>
                <a href="/dashboard/employees" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  👨‍💼 Team
                </a>
                <a href="/dashboard/roles" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  🔐 Roles
                </a>
                <a href="/dashboard/templates" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  📝 Templates
                </a>
                <a href="/dashboard/ai-instructions" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  🤖 AI Config
                </a>
                <a href="/dashboard/analytics" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  📊 Analytics
                </a>
                <a href="/dashboard/media" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  📁 Media
                </a>
                <a href="/dashboard/notes" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  📝 Notes
                </a>
                <div className="border-t border-gray-200 my-2"></div>
                <a href="/dashboard/subscription" className="block px-4 py-3 text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  💳 Subscription
                </a>
                <a href="/dashboard/admin" className="block px-4 py-3 text-purple-700 hover:bg-purple-50 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  👑 Admin Dashboard
                </a>
                <a href="/dashboard/sessions" className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  🔐 Sessions
                </a>
                <div className="border-t border-gray-200 my-2"></div>
                <a href="/dashboard/logs/activity" className="block px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm" onClick={() => setMobileMenuOpen(false)}>
                  📋 Activity Logs
                </a>
                <a href="/dashboard/logs/webhooks" className="block px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm" onClick={() => setMobileMenuOpen(false)}>
                  🔗 Webhook Logs
                </a>
                <a href="/dashboard/voice" className="block px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm" onClick={() => setMobileMenuOpen(false)}>
                  🎤 Voice Messages
                </a>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content - Mobile padding */}
        <main className="pb-safe">{children}</main>
      </div>
    </BusinessProvider>
    </ThemeProvider>
  )
}
