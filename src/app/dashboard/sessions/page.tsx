/**
 * 🔐 Session Manager Page
 * View and manage active login sessions
 */

'use client'

import { useEffect, useState } from 'react'
import { useBusinessContext } from '@/lib/multi-tenant/context'
import toast from 'react-hot-toast'

type Session = {
  id: string
  employee_id: string
  ip_address?: string
  user_agent?: string
  last_activity: string
  expires_at: string
  is_current?: boolean
  created_at: string
}

export default function SessionsPage() {
  const { employee } = useBusinessContext()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/sessions')
      const data = await response.json()

      if (data.sessions) {
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRevokeSession(sessionId: string) {
    if (!confirm('Are you sure you want to revoke this session? The user will be logged out.')) {
      return
    }

    setRevoking(sessionId)
    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })

      if (response.ok) {
        // Remove from list
        setSessions(sessions.filter(s => s.id !== sessionId))
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to revoke session')
      }
    } catch (error) {
      console.error('Failed to revoke session:', error)
      toast.error('Failed to revoke session')
    } finally {
      setRevoking(null)
    }
  }

  async function handleRevokeAllOthers() {
    if (!confirm('Revoke all other sessions? Other devices will be logged out.')) {
      return
    }

    setRevoking('all')
    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revoke_all_except_current: true }),
      })

      if (response.ok) {
        await loadSessions()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to revoke sessions')
      }
    } catch (error) {
      console.error('Failed to revoke sessions:', error)
      toast.error('Failed to revoke sessions')
    } finally {
      setRevoking(null)
    }
  }

  function getBrowserIcon(userAgent?: string) {
    if (!userAgent) return '🌐'
    const ua = userAgent.toLowerCase()
    if (ua.includes('chrome')) return '🔵'
    if (ua.includes('firefox')) return '🟠'
    if (ua.includes('safari')) return '🔷'
    if (ua.includes('edge')) return '🟦'
    return '🌐'
  }

  function getDeviceType(userAgent?: string) {
    if (!userAgent) return 'Unknown Device'
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Mobile'
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablet'
    }
    return 'Desktop'
  }

  function isSessionExpired(expiresAt: string) {
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    )
  }

  const activeSessions = sessions.filter(s => !isSessionExpired(s.expires_at))
  const expiredSessions = sessions.filter(s => isSessionExpired(s.expires_at))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Active Sessions</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your login sessions across devices</p>
          </div>
          {activeSessions.length > 1 && (
            <button
              onClick={handleRevokeAllOthers}
              disabled={revoking === 'all'}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {revoking === 'all' ? 'Revoking...' : 'Revoke All Others'}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</p>
            <p className="text-3xl font-bold text-green-600">{activeSessions.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Current Device</p>
            <p className="text-3xl font-bold text-blue-600">
              {getDeviceType(activeSessions.find(s => s.is_current)?.user_agent)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Expired Sessions</p>
            <p className="text-3xl font-bold text-gray-600">{expiredSessions.length}</p>
          </div>
        </div>

        {/* Active Sessions List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Sessions</h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activeSessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No active sessions
              </div>
            ) : (
              activeSessions.map((session) => (
                <div key={session.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-3xl">{getBrowserIcon(session.user_agent)}</div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {getDeviceType(session.user_agent)}
                          </p>
                          {session.is_current && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Current Device
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mt-1">
                          {session.ip_address || 'Unknown IP'}
                        </p>

                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>
                            Last active: {new Date(session.last_activity).toLocaleString()}
                          </span>
                          <span>
                            Expires: {new Date(session.expires_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!session.is_current && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={revoking === session.id}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {revoking === session.id ? 'Revoking...' : 'Revoke'}
                      </button>
                    )}
                  </div>

                  {/* User Agent Details */}
                  {session.user_agent && (
                    <details className="mt-3">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        Show details
                      </summary>
                      <p className="text-xs text-gray-600 mt-2 font-mono bg-gray-50 p-2 rounded">
                        {session.user_agent}
                      </p>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expired Sessions */}
        {expiredSessions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Expired Sessions</h2>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {expiredSessions.map((session) => (
                <div key={session.id} className="p-4 opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{getBrowserIcon(session.user_agent)}</div>

                    <div className="flex-1">
                      <p className="font-medium text-gray-700">
                        {getDeviceType(session.user_agent)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {session.ip_address || 'Unknown IP'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Expired: {new Date(session.expires_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Security Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Revoke sessions from devices you no longer use</li>
            <li>• If you see suspicious activity, revoke all sessions and change your password</li>
            <li>• Sessions expire after 7 days of inactivity</li>
            <li>• Always log out from shared computers</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
