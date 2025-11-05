/**
 * 🛎️ Service Management Page
 */

'use client'

import { useEffect, useState } from 'react'

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold">Services</h1>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Add Service
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg border p-6">
                <h3 className="font-bold text-lg mb-2">{service.name_english}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.description_english}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-blue-600">${service.price}</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    service.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
