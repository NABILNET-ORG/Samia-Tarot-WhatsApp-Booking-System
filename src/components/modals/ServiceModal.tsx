/**
 * Service Modal Component
 * Create or edit services
 */

'use client'

import { useState, useEffect } from 'react'

interface Service {
  id?: string
  name: string
  description: string
  duration_minutes: number
  price: number
  currency: string
  is_active: boolean
  requires_deposit: boolean
  deposit_amount?: number
}

interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (service: Service) => Promise<void>
  service?: Service | null
  mode: 'create' | 'edit'
}

export default function ServiceModal({
  isOpen,
  onClose,
  onSave,
  service,
  mode,
}: ServiceModalProps) {
  const [formData, setFormData] = useState<Service>({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    currency: 'USD',
    is_active: true,
    requires_deposit: false,
    deposit_amount: 0,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (service && mode === 'edit') {
      setFormData(service)
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        duration_minutes: 60,
        price: 0,
        currency: 'USD',
        is_active: true,
        requires_deposit: false,
        deposit_amount: 0,
      })
    }
  }, [service, mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate
      if (!formData.name.trim()) {
        throw new Error('Service name is required')
      }

      if (formData.price < 0) {
        throw new Error('Price cannot be negative')
      }

      if (formData.duration_minutes <= 0) {
        throw new Error('Duration must be greater than 0')
      }

      if (formData.requires_deposit && (formData.deposit_amount || 0) <= 0) {
        throw new Error('Deposit amount must be greater than 0 when required')
      }

      await onSave(formData)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New Service' : 'Edit Service'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Tarot Reading, Spiritual Counseling"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this service includes..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Duration and Price Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                min="1"
                step="15"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Deposit Settings */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="requires_deposit"
                id="requires_deposit"
                checked={formData.requires_deposit}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="requires_deposit" className="ml-2 text-sm font-medium text-gray-700">
                Require deposit for booking
              </label>
            </div>

            {formData.requires_deposit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Amount
                </label>
                <input
                  type="number"
                  name="deposit_amount"
                  value={formData.deposit_amount || 0}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Customers will need to pay this amount upfront to confirm booking
                </p>
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
              Service is active and bookable
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Service' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
