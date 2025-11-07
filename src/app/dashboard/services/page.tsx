/**
 * 🛎️ Service Management Page
 */

'use client'

import { useEffect, useState } from 'react'
import ServiceModal from '@/components/modals/ServiceModal'

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

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    try {
      const response = await fetch('/api/services')
      const data = await response.json()
      if (data.services) setServices(data.services)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateService = () => {
    setModalMode('create')
    setSelectedService(null)
    setModalOpen(true)
  }

  const handleEditService = (service: Service) => {
    setModalMode('edit')
    setSelectedService(service)
    setModalOpen(true)
  }

  const handleSaveService = async (serviceData: Service) => {
    try {
      const url = modalMode === 'create' ? '/api/services' : `/api/services/${serviceData.id}`
      const method = modalMode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save service')
      }

      // Reload services
      await loadServices()
      setModalOpen(false)
    } catch (error: any) {
      throw error
    }
  }

  const handleDeleteService = async (id: string | undefined) => {
    if (!id) return

    if (!confirm('Are you sure you want to delete this service?')) {
      return
    }

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete service')
      }

      await loadServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('Failed to delete service')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Services</h1>
          <button
            onClick={handleCreateService}
            className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Add Service
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto" />
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-6xl mb-4">🛎️</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No services yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first service to start accepting bookings</p>
            <button
              onClick={handleCreateService}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Create Service
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{service.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      service.is_active ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{service.description}</p>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{service.duration_minutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Price:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {service.currency} {service.price.toFixed(2)}
                    </span>
                  </div>
                  {service.requires_deposit && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Deposit:</span>
                      <span className="font-medium text-orange-600 dark:text-orange-400">
                        {service.currency} {service.deposit_amount?.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditService(service)}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Service Modal */}
        <ServiceModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveService}
          service={selectedService}
          mode={modalMode}
        />
      </div>
    </div>
  )
}
