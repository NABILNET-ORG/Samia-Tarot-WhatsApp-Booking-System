/**
 * 📝 Internal Notes Page
 * Manage internal notes about conversations and customers
 */

'use client'

import { useEffect, useState } from 'react'
import { useBusinessContext } from '@/lib/multi-tenant/context'

type Note = {
  id: string
  note: string
  note_type: 'general' | 'warning' | 'follow_up' | 'reminder' | 'vip'
  is_pinned: boolean
  is_important: boolean
  conversation_id?: string
  customer_id?: string
  created_by: string
  created_by_employee?: {
    id: string
    full_name: string
    email: string
  }
  created_at: string
  updated_at: string
}

const noteTypeColors = {
  general: 'bg-gray-100 text-gray-800',
  warning: 'bg-red-100 text-red-800',
  follow_up: 'bg-blue-100 text-blue-800',
  reminder: 'bg-yellow-100 text-yellow-800',
  vip: 'bg-purple-100 text-purple-800',
}

const noteTypeIcons = {
  general: '📝',
  warning: '⚠️',
  follow_up: '📞',
  reminder: '⏰',
  vip: '⭐',
}

export default function NotesPage() {
  const { business } = useBusinessContext()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [showPinnedOnly, setShowPinnedOnly] = useState(false)
  const [formData, setFormData] = useState({
    note: '',
    note_type: 'general' as Note['note_type'],
    is_pinned: false,
    is_important: false,
    conversation_id: '',
    customer_id: '',
  })

  useEffect(() => {
    loadNotes()
  }, [showPinnedOnly])

  async function loadNotes() {
    try {
      setLoading(true)
      const url = showPinnedOnly ? '/api/notes?pinned=true' : '/api/notes'
      const response = await fetch(url)
      const data = await response.json()
      if (data.notes) setNotes(data.notes)
    } catch (error) {
      console.error('Failed to load notes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    try {
      // At least one ID must be provided
      if (!formData.conversation_id && !formData.customer_id) {
        alert('⚠️ Please provide either a Conversation ID or Customer ID')
        return
      }

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: formData.note,
          note_type: formData.note_type,
          is_pinned: formData.is_pinned,
          is_important: formData.is_important,
          conversation_id: formData.conversation_id || null,
          customer_id: formData.customer_id || null,
        }),
      })

      if (response.ok) {
        alert('✅ Note created successfully!')
        setShowCreateModal(false)
        setFormData({
          note: '',
          note_type: 'general',
          is_pinned: false,
          is_important: false,
          conversation_id: '',
          customer_id: '',
        })
        loadNotes()
      } else {
        const data = await response.json()
        alert(`❌ Failed to create note: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to create note:', error)
      alert('❌ Failed to create note. Please try again.')
    }
  }

  async function handleUpdate() {
    if (!selectedNote) return

    try {
      const response = await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: formData.note,
          note_type: formData.note_type,
          is_pinned: formData.is_pinned,
          is_important: formData.is_important,
        }),
      })

      if (response.ok) {
        alert('✅ Note updated successfully!')
        setShowEditModal(false)
        setSelectedNote(null)
        loadNotes()
      } else {
        const data = await response.json()
        alert(`❌ Failed to update note: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to update note:', error)
      alert('❌ Failed to update note. Please try again.')
    }
  }

  async function handleDelete() {
    if (!selectedNote) return

    try {
      const response = await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('✅ Note deleted successfully!')
        setShowDeleteModal(false)
        setSelectedNote(null)
        loadNotes()
      } else {
        const data = await response.json()
        alert(`❌ Failed to delete note: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
      alert('❌ Failed to delete note. Please try again.')
    }
  }

  async function togglePin(note: Note) {
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !note.is_pinned }),
      })

      if (response.ok) {
        loadNotes()
      } else {
        alert('❌ Failed to toggle pin')
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  function handleEditClick(note: Note) {
    setSelectedNote(note)
    setFormData({
      note: note.note,
      note_type: note.note_type,
      is_pinned: note.is_pinned,
      is_important: note.is_important,
      conversation_id: '',
      customer_id: '',
    })
    setShowEditModal(true)
  }

  const filteredNotes = filterType === 'all'
    ? notes
    : notes.filter(note => note.note_type === filterType)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Internal Notes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Private notes about conversations and customers</p>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showPinnedOnly
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              📌 {showPinnedOnly ? 'Show All' : 'Pinned Only'}
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create Note
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['all', 'general', 'warning', 'follow_up', 'reminder', 'vip'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                filterType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {type === 'all' ? 'All' : `${noteTypeIcons[type as keyof typeof noteTypeIcons]} ${type.replace('_', ' ').charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}`}
            </button>
          ))}
        </div>

        {/* Notes List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-gray-600">No notes found</p>
            <p className="text-sm text-gray-500 mt-1">Create your first internal note</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-colors ${
                  note.is_important ? 'border-l-4 border-l-red-500' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${noteTypeColors[note.note_type]}`}>
                        {noteTypeIcons[note.note_type]} {note.note_type.replace('_', ' ')}
                      </span>
                      {note.is_pinned && (
                        <span className="text-yellow-500">📌</span>
                      )}
                      {note.is_important && (
                        <span className="text-red-500">❗</span>
                      )}
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{note.note}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>By: {note.created_by_employee?.full_name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      {note.conversation_id && (
                        <>
                          <span>•</span>
                          <span>Conversation: {note.conversation_id.substring(0, 8)}...</span>
                        </>
                      )}
                      {note.customer_id && (
                        <>
                          <span>•</span>
                          <span>Customer: {note.customer_id.substring(0, 8)}...</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => togglePin(note)}
                      className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                      title={note.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      <svg className="h-5 w-5" fill={note.is_pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditClick(note)}
                      className="p-2 text-blue-600 hover:text-blue-800"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedNote(note)
                        setShowDeleteModal(true)
                      }}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <NoteFormModal
            title="Create Note"
            formData={formData}
            setFormData={setFormData}
            onSave={handleCreate}
            onCancel={() => setShowCreateModal(false)}
            isCreate={true}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && selectedNote && (
          <NoteFormModal
            title="Edit Note"
            formData={formData}
            setFormData={setFormData}
            onSave={handleUpdate}
            onCancel={() => {
              setShowEditModal(false)
              setSelectedNote(null)
            }}
            isCreate={false}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="rounded-full bg-red-100 p-3">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Delete Note
                </h2>
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to delete this note? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setSelectedNote(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Separate component for the note form modal
function NoteFormModal({
  title,
  formData,
  setFormData,
  onSave,
  onCancel,
  isCreate
}: {
  title: string
  formData: any
  setFormData: (data: any) => void
  onSave: () => void
  onCancel: () => void
  isCreate: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Note Content *</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your note..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.note_type}
                  onChange={(e) => setFormData({ ...formData, note_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="warning">Warning</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="reminder">Reminder</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              {isCreate && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Conversation ID (Optional)</label>
                    <input
                      type="text"
                      value={formData.conversation_id}
                      onChange={(e) => setFormData({ ...formData, conversation_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="UUID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer ID (Optional)</label>
                    <input
                      type="text"
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="UUID"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">📌 Pin this note</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_important}
                  onChange={(e) => setFormData({ ...formData, is_important: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">❗ Mark as important</span>
              </label>
            </div>

            {isCreate && (
              <p className="text-xs text-gray-500">
                * At least one of Conversation ID or Customer ID must be provided
              </p>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {isCreate ? 'Create' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
