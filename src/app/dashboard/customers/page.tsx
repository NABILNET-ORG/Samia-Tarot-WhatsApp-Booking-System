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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [formData, setFormData] = useState({
    phone: '',
    name_english: '',
    name_arabic: '',
    email: '',
    preferred_language: 'en',
    country_code: '+1',
    vip_status: false,
    notes: ''
  })

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

  async function handleCreate() {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        alert('✅ Customer created!')
        setShowCreateModal(false)
        resetForm()
        loadCustomers()
      } else {
        const data = await response.json()
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      alert('❌ Failed to create customer')
    }
  }

  async function handleUpdate() {
    if (!selectedCustomer) return
    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        alert('✅ Customer updated!')
        setShowEditModal(false)
        setSelectedCustomer(null)
        loadCustomers()
      } else {
        const data = await response.json()
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      alert('❌ Failed to update')
    }
  }

  async function handleDelete() {
    if (!selectedCustomer) return
    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, { method: 'DELETE' })
      const data = await response.json()

      if (response.ok) {
        // Show GDPR deletion summary
        const summary = data.deletion_summary
        alert(`✅ Customer deleted successfully (GDPR compliant)\n\n` +
          `Conversations deleted: ${summary?.conversations_deleted || 0}\n` +
          `Bookings deleted: ${summary?.bookings_deleted || 0}\n\n` +
          `Retention Policy: ${summary?.retention_policy || '30 days'}`)

        setShowDeleteModal(false)
        setSelectedCustomer(null)
        loadCustomers()
      } else {
        alert(`❌ ${data.error || 'Failed to delete customer'}`)
      }
    } catch (error) {
      alert('❌ Failed to delete')
    }
  }

  function resetForm() {
    setFormData({ phone: '', name_english: '', name_arabic: '', email: '', preferred_language: 'en', country_code: '+1', vip_status: false, notes: '' })
  }

  function handleEdit(customer: any) {
    setSelectedCustomer(customer)
    setFormData({
      phone: customer.phone || '',
      name_english: customer.name_english || '',
      name_arabic: customer.name_arabic || '',
      email: customer.email || '',
      preferred_language: customer.preferred_language || 'en',
      country_code: customer.country_code || '+1',
      vip_status: customer.vip_status || false,
      notes: customer.notes || ''
    })
    setShowEditModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
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
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                        <button onClick={() => { setSelectedCustomer(customer); setShowDeleteModal(true) }} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Create Customer</h2>
              <div className="space-y-3">
                <input type="text" placeholder="Phone *" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Name (English)" value={formData.name_english} onChange={e => setFormData({...formData, name_english: e.target.value})} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Name (Arabic)" value={formData.name_arabic} onChange={e => setFormData({...formData, name_arabic: e.target.value})} className="px-4 py-2 border rounded-lg" />
                </div>
                <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.vip_status} onChange={e => setFormData({...formData, vip_status: e.target.checked})} /> VIP Status</label>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                  <button onClick={handleCreate} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg">Create</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Edit Customer</h2>
              <div className="space-y-3">
                <input type="text" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Name (English)" value={formData.name_english} onChange={e => setFormData({...formData, name_english: e.target.value})} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Name (Arabic)" value={formData.name_arabic} onChange={e => setFormData({...formData, name_arabic: e.target.value})} className="px-4 py-2 border rounded-lg" />
                </div>
                <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.vip_status} onChange={e => setFormData({...formData, vip_status: e.target.checked})} /> VIP Status</label>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => { setShowEditModal(false); setSelectedCustomer(null) }} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                  <button onClick={handleUpdate} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg">Update</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <div className="mb-4 text-red-600 text-4xl text-center">⚠️</div>
              <h2 className="text-2xl font-bold mb-3 text-center">Delete Customer - GDPR Request</h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  This action will permanently delete:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                  <li>• Customer profile: <strong>{selectedCustomer.name_english || selectedCustomer.phone}</strong></li>
                  <li>• Phone: <strong>{selectedCustomer.phone}</strong></li>
                  <li>• Email: <strong>{selectedCustomer.email || 'N/A'}</strong></li>
                  <li>• All conversations with this customer</li>
                  <li>• All messages in those conversations</li>
                  <li>• All bookings made by this customer</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>GDPR Compliance:</strong> This soft delete complies with the "right to be forgotten".
                  Customer data will be anonymized immediately and permanently deleted after 30 days.
                </p>
              </div>

              <p className="text-center text-gray-700 mb-6 font-medium">
                This action cannot be undone. Are you sure?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedCustomer(null) }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Confirm Deletion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
