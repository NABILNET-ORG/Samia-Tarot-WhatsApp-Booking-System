/**
 * 💳 Subscription Management Page
 * Manage billing, view usage, upgrade/downgrade plans
 */

'use client'

import { useEffect, useState } from 'react'
import { useBusinessContext } from '@/lib/multi-tenant/context'
import toast from 'react-hot-toast'

type Subscription = {
  id: string
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  plan_name: string
  plan_price: number
  plan_interval: 'month' | 'year'
  plan_max_conversations_monthly: number
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  stripe_subscription_id?: string
}

type UsageStats = {
  conversations_this_month: number
  messages_this_month: number
  customers_total: number
}

export default function SubscriptionPage() {
  const { business } = useBusinessContext()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    loadSubscription()
    loadUsage()
  }, [])

  async function loadSubscription() {
    try {
      const response = await fetch('/api/subscription/manage')
      const data = await response.json()

      if (data.subscription) {
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Failed to load subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUsage() {
    try {
      const response = await fetch('/api/analytics')
      const data = await response.json()

      if (data.stats) {
        setUsage({
          conversations_this_month: data.stats.totalConversations || 0,
          messages_this_month: data.stats.totalMessages || 0,
          customers_total: data.stats.totalCustomers || 0,
        })
      }
    } catch (error) {
      console.error('Failed to load usage:', error)
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of the billing period.')) {
      return
    }

    setCancelling(true)
    try {
      const response = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })

      if (response.ok) {
        toast.success('Subscription cancelled successfully')
        await loadSubscription()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      toast.error('Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  async function handleUpgrade() {
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'pro',
          return_url: window.location.href,
        }),
      })

      const data = await response.json()

      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        toast.error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Failed to upgrade:', error)
      toast.error('Failed to start upgrade process')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    )
  }

  const usagePercentage = subscription && usage
    ? (usage.conversations_this_month / subscription.plan_max_conversations_monthly) * 100
    : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscription & Billing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your plan and view usage</p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Current Plan</h2>
            {subscription?.status && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  subscription.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : subscription.status === 'trialing'
                    ? 'bg-blue-100 text-blue-700'
                    : subscription.status === 'past_due'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            )}
          </div>

          {subscription ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {subscription.plan_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Price</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${subscription.plan_price}/{subscription.plan_interval}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Billing Period</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(subscription.current_period_start).toLocaleDateString()} -
                    {' '}{new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Monthly Conversation Limit</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {subscription.plan_max_conversations_monthly === -1
                    ? 'Unlimited'
                    : subscription.plan_max_conversations_monthly.toLocaleString()}
                </p>
              </div>

              {subscription.cancel_at_period_end && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Your subscription will be cancelled at the end of the current billing period.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">You don't have an active subscription</p>
              <button
                onClick={handleUpgrade}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Subscribe Now
              </button>
            </div>
          )}
        </div>

        {/* Usage Card */}
        {subscription && usage && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Usage This Month</h2>

            <div className="space-y-6">
              {/* Conversations Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Conversations</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {usage.conversations_this_month} / {subscription.plan_max_conversations_monthly === -1 ? '∞' : subscription.plan_max_conversations_monthly}
                  </p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      usagePercentage > 90
                        ? 'bg-red-500'
                        : usagePercentage > 75
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                {usagePercentage > 90 && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    You're approaching your monthly limit. Consider upgrading your plan.
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{usage.conversations_this_month}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Conversations</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{usage.messages_this_month}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Messages</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{usage.customers_total}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {subscription && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Manage Subscription</h2>

            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Upgrade Plan
              </button>

              {!subscription.cancel_at_period_end && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              )}

              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Need help? Contact support at support@example.com
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
