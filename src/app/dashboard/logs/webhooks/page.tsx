/**
 * Webhook Logs Page
 * View incoming webhook requests and responses
 */

'use client'

import { useEffect, useState } from 'react'

interface WebhookLog {
  id: string
  source: string
  method: string
  path: string
  status: number
  request_headers: any
  request_body: any
  response_body: any
  response_time_ms: number
  error_message?: string
  created_at: string
}

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  useEffect(() => {
    loadLogs()
  }, [page, statusFilter, sourceFilter])

  const loadLogs = async () => {
    try {
      setLoading(true)
      let url = `/api/webhook-logs?page=${page}&limit=50`
      if (statusFilter) url += `&status=${statusFilter}`
      if (sourceFilter) url += `&source=${sourceFilter}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.logs) {
        setLogs(data.logs)
        setTotalPages(data.pagination.total_pages)
      }
    } catch (error) {
      console.error('Error loading webhook logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800'
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800'
    if (status >= 500) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Webhook Logs</h1>
          <div className="flex gap-2">
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Sources</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="stripe">Stripe</option>
              <option value="twilio">Twilio</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Status</option>
              <option value="200">Success (200)</option>
              <option value="400">Bad Request (400)</option>
              <option value="401">Unauthorized (401)</option>
              <option value="500">Server Error (500)</option>
            </select>
          </div>
        </div>

        {loading && page === 1 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <div className="text-6xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold mb-2">No webhook logs yet</h3>
            <p className="text-gray-600">Incoming webhook requests will be logged here</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="bg-white rounded-lg border hover:shadow-lg transition">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded font-mono text-sm">
                          {log.method}
                        </span>
                        <span className="text-sm text-gray-600">{log.source}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{formatDate(log.created_at)}</div>
                        <div className="text-xs text-gray-500">{log.response_time_ms}ms</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <code className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded">
                        {log.path}
                      </code>
                    </div>

                    {log.error_message && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-800">
                          <strong>Error:</strong> {log.error_message}
                        </p>
                      </div>
                    )}

                    <details className="cursor-pointer">
                      <summary className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                        View Request/Response Details
                      </summary>
                      <div className="mt-4 space-y-4">
                        {/* Request Headers */}
                        {log.request_headers && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Request Headers</h4>
                            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40">
                              {JSON.stringify(log.request_headers, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Request Body */}
                        {log.request_body && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Request Body</h4>
                            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-60">
                              {JSON.stringify(log.request_body, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Response Body */}
                        {log.response_body && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Response Body</h4>
                            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-60">
                              {JSON.stringify(log.response_body, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
