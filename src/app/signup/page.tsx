/**
 * 📝 Business Signup Page
 * Multi-step onboarding for new businesses
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type FormData = {
  // Step 1: Business Info
  businessName: string
  industry: string
  whatsappNumber: string

  // Step 2: Admin Account
  adminName: string
  adminEmail: string
  adminPassword: string

  // Step 3: WhatsApp Setup
  provider: 'meta' | 'twilio'
  metaAccessToken?: string
  metaPhoneId?: string
  twilioAccountSid?: string
  twilioAuthToken?: string
}

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    industry: 'other',
    whatsappNumber: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    provider: 'meta',
  })

  function updateField(field: keyof FormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)

    try {
      // Create business
      const businessResponse = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.businessName,
          slug: formData.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          industry: formData.industry,
          whatsapp_number: formData.whatsappNumber,
          whatsapp_provider: formData.provider,
          meta_access_token: formData.metaAccessToken,
          meta_phone_number_id: formData.metaPhoneId,
          twilio_account_sid: formData.twilioAccountSid,
          twilio_auth_token: formData.twilioAuthToken,
          subscription_tier: 'trial',
        }),
      })

      if (!businessResponse.ok) {
        throw new Error('Failed to create business')
      }

      const { business } = await businessResponse.json()

      // Get admin role
      const rolesResponse = await fetch('/api/roles?system=true')
      const { roles } = await rolesResponse.json()
      const adminRole = roles.find((r: any) => r.name === 'admin')

      // Create admin employee
      const employeeResponse = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.adminEmail,
          full_name: formData.adminName,
          role_id: adminRole.id,
          temporary_password: formData.adminPassword,
        }),
      })

      if (!employeeResponse.ok) {
        throw new Error('Failed to create admin account')
      }

      // Auto-login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.adminEmail,
          password: formData.adminPassword,
        }),
      })

      if (loginResponse.ok) {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Start Your Free Trial</h1>
          <p className="text-gray-600 mt-2">14 days free, no credit card required</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-500' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Business</span>
          </div>
          <div className={`w-16 h-0.5 mx-4 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`flex items-center ${step >= 2 ? 'text-blue-500' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Account</span>
          </div>
          <div className={`w-16 h-0.5 mx-4 ${step >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`flex items-center ${step >= 3 ? 'text-blue-500' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">WhatsApp</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Business Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Samia Tarot"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => updateField('industry', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="tarot">Tarot Reading</option>
                <option value="restaurant">Restaurant</option>
                <option value="clinic">Medical Clinic</option>
                <option value="salon">Salon/Spa</option>
                <option value="consultant">Consulting</option>
                <option value="fitness">Fitness/Gym</option>
                <option value="education">Education</option>
                <option value="ecommerce">E-commerce</option>
                <option value="real_estate">Real Estate</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Business Number</label>
              <input
                type="tel"
                value={formData.whatsappNumber}
                onChange={(e) => updateField('whatsappNumber', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1234567890"
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!formData.businessName || !formData.whatsappNumber}
              className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Admin Account */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Name</label>
              <input
                type="text"
                value={formData.adminName}
                onChange={(e) => updateField('adminName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.adminEmail}
                onChange={(e) => updateField('adminEmail', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@yourbusiness.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={formData.adminPassword}
                onChange={(e) => updateField('adminPassword', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Minimum 8 characters"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!formData.adminName || !formData.adminEmail || !formData.adminPassword}
                className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: WhatsApp Setup */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Provider</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField('provider', 'meta')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.provider === 'meta'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900">Meta (Recommended)</p>
                  <p className="text-xs text-gray-600 mt-1">Official WhatsApp Business API</p>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('provider', 'twilio')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.provider === 'twilio'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900">Twilio</p>
                  <p className="text-xs text-gray-600 mt-1">Alternative provider</p>
                </button>
              </div>
            </div>

            {formData.provider === 'meta' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Access Token</label>
                  <input
                    type="text"
                    value={formData.metaAccessToken || ''}
                    onChange={(e) => updateField('metaAccessToken', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="EAAxxxxxxxxx..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    value={formData.metaPhoneId || ''}
                    onChange={(e) => updateField('metaPhoneId', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123456789012345"
                  />
                </div>
              </>
            )}

            {formData.provider === 'twilio' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account SID</label>
                  <input
                    type="text"
                    value={formData.twilioAccountSid || ''}
                    onChange={(e) => updateField('twilioAccountSid', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="ACxxxxxxxxx..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
                  <input
                    type="password"
                    value={formData.twilioAuthToken || ''}
                    onChange={(e) => updateField('twilioAuthToken', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You can skip this step and add WhatsApp credentials later from your dashboard.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating Account...' : 'Complete Signup'}
              </button>
            </div>
          </div>
        )}

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
