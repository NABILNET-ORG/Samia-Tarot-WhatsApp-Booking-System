/**
 * 🔮 Home Page - Samia Tarot
 */

'use client'

import { useEffect, useState } from 'react'

export default function HomePage() {
  const [whatsappNumber, setWhatsappNumber] = useState('+15556320392')
  const [provider, setProvider] = useState('meta')

  useEffect(() => {
    // Fetch current provider from database
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        const currentProvider = data.settings?.whatsapp_provider?.value || 'meta'
        setProvider(currentProvider)

        // Set WhatsApp number based on provider
        if (currentProvider === 'twilio') {
          setWhatsappNumber('+14155238886') // Twilio sandbox
        } else {
          // Meta business number
          setWhatsappNumber('+15556320392') // Your Meta number
        }
      })
      .catch(() => {
        // Fallback to Meta
        setProvider('meta')
        setWhatsappNumber('+15556320392')
      })
  }, [])
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-purple-900 mb-4">
            🔮 Samia Tarot
          </h1>
          <p className="text-xl md:text-2xl text-purple-700 mb-2">
            سامية تاروت
          </p>
          <p className="text-gray-600">
            Professional Spiritual Readings
          </p>
        </div>

        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-4">Welcome</h2>
          <p className="text-gray-700 mb-4">
            Professional Coffee Cup, Tarot, and Rune readings by Samia.
          </p>
          <p className="text-gray-700 mb-6">
            Book your spiritual guidance session via WhatsApp!
          </p>

          <div className="space-y-4">
            <a
              href={`https://wa.me/${whatsappNumber.replace('+', '')}`}
              target="_blank"
              className="btn btn-primary w-full inline-block"
            >
              📱 Book via WhatsApp
            </a>

            <div className="text-xs text-gray-400">
              {provider === 'twilio' ? 'Twilio Sandbox' : 'Samia Tarot Official'}
            </div>

            <div className="text-sm text-gray-500">
              Available in Arabic & English
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="card">
            <div className="text-4xl mb-2">☕</div>
            <h3 className="font-bold mb-1">Coffee Cup</h3>
            <p className="text-sm text-gray-600">Traditional readings</p>
          </div>

          <div className="card">
            <div className="text-4xl mb-2">🃏</div>
            <h3 className="font-bold mb-1">Tarot</h3>
            <p className="text-sm text-gray-600">Card guidance</p>
          </div>

          <div className="card">
            <div className="text-4xl mb-2">🗿</div>
            <h3 className="font-bold mb-1">Rune</h3>
            <p className="text-sm text-gray-600">Ancient wisdom</p>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          <a href="/admin" className="text-purple-600 hover:underline">
            Admin Dashboard →
          </a>
        </div>
      </div>
    </div>
  )
}
