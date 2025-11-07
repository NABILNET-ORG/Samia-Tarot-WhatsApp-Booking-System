/**
 * 💳 Stripe Checkout Page
 * Subscription payment and plan selection
 */

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      '50 conversations/month',
      '1 employee',
      'Basic AI responses',
      'Email support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'month',
    features: [
      '500 conversations/month',
      '3 employees',
      'Advanced AI + RAG',
      'Priority support',
      'Analytics',
    ],
    popular: true,
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 99,
    interval: 'month',
    features: [
      '2,000 conversations/month',
      '10 employees',
      'Custom AI training',
      '24/7 support',
      'Advanced analytics',
      'API access',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    interval: 'month',
    features: [
      'Unlimited conversations',
      'Unlimited employees',
      'Dedicated AI model',
      'White-label',
      'SLA guarantee',
      'Custom integrations',
    ],
  },
]

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState('starter')
  const [loading, setLoading] = useState(false)
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')

  useEffect(() => {
    const plan = searchParams.get('plan')
    if (plan) {
      setSelectedPlan(plan)
    }
  }, [searchParams])

  async function handleCheckout() {
    setLoading(true)
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          interval: billingInterval,
          return_url: `${window.location.origin}/payment/success`,
          cancel_url: `${window.location.origin}/checkout?plan=${selectedPlan}`,
        }),
      })

      const data = await response.json()

      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        alert('Failed to create checkout session. Please try again.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan)
  const displayPrice = selectedPlanData
    ? billingInterval === 'year'
      ? selectedPlanData.price * 10
      : selectedPlanData.price
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600">
            Select the perfect plan for your business needs
          </p>

          {/* Billing Interval Toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={billingInterval === 'month' ? 'text-gray-900 font-medium' : 'text-gray-500'}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-600 transition-colors"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingInterval === 'year' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={billingInterval === 'year' ? 'text-gray-900 font-medium' : 'text-gray-500'}>
              Yearly <span className="text-green-600 text-sm">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
                selectedPlan === plan.id
                  ? 'border-purple-600 bg-white shadow-lg scale-105'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
              } ${plan.popular ? 'ring-2 ring-purple-200' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ${billingInterval === 'year' ? plan.price * 10 : plan.price}
                  </span>
                  <span className="text-gray-600">/{billingInterval === 'year' ? 'year' : 'mo'}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {selectedPlan === plan.id && (
                <div className="absolute inset-0 border-2 border-purple-600 rounded-xl pointer-events-none"></div>
              )}
            </div>
          ))}
        </div>

        {/* Checkout Summary */}
        {selectedPlanData && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Checkout Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Selected Plan:</span>
                <span className="font-semibold text-gray-900">{selectedPlanData.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Billing:</span>
                <span className="font-semibold text-gray-900">
                  {billingInterval === 'year' ? 'Yearly' : 'Monthly'}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total:</span>
                  <span className="text-3xl font-bold text-purple-600">
                    ${displayPrice}
                    <span className="text-lg text-gray-600">
                      /{billingInterval === 'year' ? 'year' : 'month'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || selectedPlanData.price === 0}
              className="w-full px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : selectedPlanData.price === 0 ? 'Current Plan' : 'Proceed to Payment'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
              Secure payment powered by Stripe.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
