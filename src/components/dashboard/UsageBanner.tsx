/**
 * Usage Banner Component
 * Shows current subscription usage and limits
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface UsageData {
  conversations_current: number
  conversations_limit: number
  messages_current: number
  messages_limit: number
  plan_name: string
  usage_percentage: number
}

export default function UsageBanner() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsage()
  }, [])

  const fetchUsage = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics?usage=true')

      if (!response.ok) {
        throw new Error('Failed to fetch usage data')
      }

      const data = await response.json()

      // Calculate usage from analytics data
      const conversationsLimit = data.subscription?.plan_max_conversations_monthly || -1
      const currentConversations = data.stats?.conversations_this_month || 0

      const usageData: UsageData = {
        conversations_current: currentConversations,
        conversations_limit: conversationsLimit,
        messages_current: data.stats?.messages_this_month || 0,
        messages_limit: -1, // Unlimited for now
        plan_name: data.subscription?.plan_name || 'Free',
        usage_percentage: conversationsLimit > 0
          ? Math.round((currentConversations / conversationsLimit) * 100)
          : 0,
      }

      setUsage(usageData)
    } catch (err: any) {
      console.error('Error fetching usage:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-purple-200 rounded w-3/4"></div>
            <div className="h-3 bg-purple-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !usage) {
    return null
  }

  // Don't show banner if unlimited plan
  if (usage.conversations_limit === -1) {
    return null
  }

  // Determine alert level
  const isWarning = usage.usage_percentage >= 80 && usage.usage_percentage < 100
  const isDanger = usage.usage_percentage >= 100

  const bgColor = isDanger
    ? 'bg-red-50 border-red-200'
    : isWarning
    ? 'bg-yellow-50 border-yellow-200'
    : 'bg-blue-50 border-blue-200'

  const textColor = isDanger
    ? 'text-red-800'
    : isWarning
    ? 'text-yellow-800'
    : 'text-blue-800'

  const barColor = isDanger
    ? 'bg-red-600'
    : isWarning
    ? 'bg-yellow-600'
    : 'bg-blue-600'

  return (
    <div className={`${bgColor} border rounded-lg p-4 mb-6`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className={`font-semibold ${textColor}`}>
            {isDanger && '🚨 Usage Limit Reached'}
            {isWarning && '⚠️ Approaching Usage Limit'}
            {!isDanger && !isWarning && '📊 Usage This Month'}
          </h3>
          <p className={`text-sm ${textColor} opacity-80`}>
            {usage.plan_name} Plan
          </p>
        </div>
        {(isWarning || isDanger) && (
          <Link
            href="/pricing"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
          >
            Upgrade Plan
          </Link>
        )}
      </div>

      {/* Conversations Usage */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className={textColor}>Conversations</span>
          <span className={`font-medium ${textColor}`}>
            {usage.conversations_current.toLocaleString()} / {usage.conversations_limit.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${barColor} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(usage.usage_percentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Messages Info */}
      {usage.messages_current > 0 && (
        <div className="text-sm">
          <span className={textColor}>
            {usage.messages_current.toLocaleString()} messages sent this month
          </span>
        </div>
      )}

      {/* Danger Message */}
      {isDanger && (
        <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-800">
          <strong>Action Required:</strong> You've reached your monthly conversation limit.
          Upgrade your plan to continue using the platform.
        </div>
      )}

      {/* Warning Message */}
      {isWarning && (
        <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
          <strong>Heads up:</strong> You're at {usage.usage_percentage}% of your monthly conversation limit.
          Consider upgrading to avoid service interruption.
        </div>
      )}
    </div>
  )
}
