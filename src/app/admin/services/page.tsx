'use client'

import { useEffect, useState } from 'react'
import { Service, ServiceHelpers } from '@/lib/supabase/services'

export default function ServicesManagementPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalValue: 0,
  })

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/services')
      const data = await response.json()
      setServices(data.services)

      // Calculate stats
      const active = data.services.filter((s: Service) => s.is_active).length
      const totalValue = data.services.reduce(
        (sum: number, s: Service) => sum + Number(s.price),
        0
      )

      setStats({
        total: data.services.length,
        active,
        inactive: data.services.length - active,
        totalValue,
      })
    } catch (error) {
      console.error('Failed to load services:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(serviceId: number, currentStatus: boolean) {
    try {
      await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          action: 'toggle_active',
          data: { isActive: !currentStatus },
        }),
      })
      loadServices()
    } catch (error) {
      console.error('Failed to toggle service:', error)
    }
  }

  async function toggleFeatured(serviceId: number, currentStatus: boolean) {
    try {
      await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          action: 'toggle_featured',
          data: { isFeatured: !currentStatus },
        }),
      })
      loadServices()
    } catch (error) {
      console.error('Failed to feature service:', error)
    }
  }

  async function updatePrice(serviceId: number, newPrice: number) {
    try {
      await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          action: 'update_price',
          data: { price: newPrice },
        }),
      })
      loadServices()
    } catch (error) {
      console.error('Failed to update price:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 safe-top safe-bottom">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-purple-900 mb-2">
          🔮 Service Management
        </h1>
        <p className="text-gray-600">Manage your services, prices, and availability</p>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Services" value={stats.total} icon="📋" />
        <StatCard title="Active" value={stats.active} icon="✅" color="green" />
        <StatCard title="Inactive" value={stats.inactive} icon="❌" color="red" />
        <StatCard
          title="Total Value"
          value={`$${stats.totalValue.toFixed(0)}`}
          icon="💰"
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">⚡ Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadServices()}
              className="btn btn-secondary"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => {
                const discount = prompt('Enter discount percentage (e.g., 20 for 20% off):')
                if (discount) {
                  // Apply discount logic
                  alert('Discount feature coming soon!')
                }
              }}
              className="btn btn-secondary"
            >
              💰 Flash Sale
            </button>
            <button
              onClick={() => {
                if (confirm('Disable all call services?')) {
                  // Disable calls
                  alert('Vacation mode feature coming soon!')
                }
              }}
              className="btn btn-secondary"
            >
              🏖️ Vacation Mode
            </button>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-4">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onToggleActive={toggleActive}
              onToggleFeatured={toggleFeatured}
              onUpdatePrice={updatePrice}
              onEdit={setEditingService}
            />
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingService && (
        <EditServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onSave={() => {
            setEditingService(null)
            loadServices()
          }}
        />
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color = 'purple',
}: {
  title: string
  value: string | number
  icon: string
  color?: string
}) {
  const colorClasses = {
    purple: 'text-purple-600',
    green: 'text-green-600',
    red: 'text-red-600',
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-3xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
          {value}
        </span>
      </div>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  )
}

function ServiceCard({
  service,
  onToggleActive,
  onToggleFeatured,
  onUpdatePrice,
  onEdit,
}: {
  service: Service
  onToggleActive: (id: number, current: boolean) => void
  onToggleFeatured: (id: number, current: boolean) => void
  onUpdatePrice: (id: number, price: number) => void
  onEdit: (service: Service) => void
}) {
  const [editingPrice, setEditingPrice] = useState(false)
  const [newPrice, setNewPrice] = useState(service.price.toString())

  return (
    <div
      className={`card ${service.is_featured ? 'border-2 border-purple-500 mystical-glow' : ''}`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Service Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{service.icon_emoji}</span>
            <div>
              <h3 className="text-lg font-bold">
                {service.name_english}
                {service.is_featured && <span className="ml-2 text-yellow-500">⭐</span>}
              </h3>
              <p className="text-sm text-gray-600">{service.name_arabic}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
              {service.service_type}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {service.service_tier}
            </span>
            {service.duration_minutes && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                {service.duration_minutes} min
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="text-center">
          {editingPrice ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="input w-24"
                step="0.01"
              />
              <button
                onClick={() => {
                  onUpdatePrice(service.id, parseFloat(newPrice))
                  setEditingPrice(false)
                }}
                className="btn btn-primary"
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setEditingPrice(false)
                  setNewPrice(service.price.toString())
                }}
                className="btn btn-secondary"
              >
                ✕
              </button>
            </div>
          ) : (
            <div>
              <p className="text-3xl font-bold text-purple-600">${service.price}</p>
              <button
                onClick={() => setEditingPrice(true)}
                className="text-sm text-purple-600 hover:underline"
              >
                Edit Price
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onToggleActive(service.id, service.is_active)}
            className={`btn ${service.is_active ? 'btn-primary' : 'btn-secondary'}`}
          >
            {service.is_active ? '✅ Active' : '❌ Inactive'}
          </button>

          <button
            onClick={() => onToggleFeatured(service.id, service.is_featured)}
            className={`btn ${service.is_featured ? 'bg-yellow-500 text-white' : 'btn-secondary'}`}
          >
            {service.is_featured ? '⭐ Featured' : '☆ Feature'}
          </button>

          <button onClick={() => onEdit(service)} className="btn btn-secondary">
            ✏️ Edit
          </button>
        </div>
      </div>
    </div>
  )
}

function EditServiceModal({
  service,
  onClose,
  onSave,
}: {
  service: Service
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    name_english: service.name_english,
    name_arabic: service.name_arabic,
    price: service.price,
    description_english: service.description_english || '',
    description_arabic: service.description_arabic || '',
  })

  async function handleSave() {
    try {
      await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          action: 'update_details',
          data: formData,
        }),
      })
      onSave()
    } catch (error) {
      console.error('Failed to update service:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Edit Service</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">English Name</label>
            <input
              type="text"
              value={formData.name_english}
              onChange={(e) => setFormData({ ...formData, name_english: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Arabic Name</label>
            <input
              type="text"
              value={formData.name_arabic}
              onChange={(e) => setFormData({ ...formData, name_arabic: e.target.value })}
              className="input rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price ($)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className="input"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">English Description</label>
            <textarea
              value={formData.description_english}
              onChange={(e) => setFormData({ ...formData, description_english: e.target.value })}
              className="input"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Arabic Description</label>
            <textarea
              value={formData.description_arabic}
              onChange={(e) => setFormData({ ...formData, description_arabic: e.target.value })}
              className="input rtl"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} className="btn btn-primary flex-1">
              💾 Save Changes
            </button>
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
