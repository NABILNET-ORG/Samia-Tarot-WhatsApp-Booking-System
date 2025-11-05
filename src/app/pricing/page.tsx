/**
 * 💰 Pricing Page
 * Subscription tiers and features
 */

export default function PricingPage() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for testing',
      features: [
        '100 conversations/month',
        '1 employee account',
        'AI-powered responses',
        'Basic analytics',
        'Email support',
      ],
      cta: 'Start Free',
      highlighted: false,
    },
    {
      name: 'Starter',
      price: '$100',
      period: 'per month',
      description: 'For small teams',
      features: [
        '1,000 conversations/month',
        '3 employee accounts',
        'AI + human takeover',
        'Voice transcription (60 min/mo)',
        'Real-time chat dashboard',
        'Quick reply templates',
        'Priority support',
      ],
      cta: 'Start Trial',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$200',
      period: 'per month',
      description: 'Most popular',
      features: [
        '5,000 conversations/month',
        '10 employee accounts',
        'Everything in Starter',
        'Voice transcription (200 min/mo)',
        'Custom AI prompts',
        'Push notifications',
        'Advanced analytics',
        'API access',
        'Dedicated support',
      ],
      cta: 'Start Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: '$300',
      period: 'per month',
      description: 'For large businesses',
      features: [
        'Unlimited conversations',
        'Unlimited employees',
        'Everything in Pro',
        'Unlimited voice transcription',
        'White-label branding',
        'Custom integrations',
        'SLA guarantee',
        'Dedicated account manager',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the perfect plan for your business
          </p>
          <p className="text-gray-500 mt-2">
            14-day free trial on all plans. No credit card required.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`bg-white rounded-2xl shadow-lg p-8 ${
                tier.highlighted ? 'ring-2 ring-blue-500 relative' : ''
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
              <p className="text-gray-600 mb-4">{tier.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                <span className="text-gray-600 ml-2">/{tier.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="/signup"
                className={`block w-full py-3 text-center font-medium rounded-lg transition-colors ${
                  tier.highlighted
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            All Plans Include:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-xl mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-600">GPT-4 powered responses in any language</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-xl mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">24/7 Availability</h3>
              <p className="text-sm text-gray-600">Never miss a customer message</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-xl mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-sm text-gray-600">Enterprise-grade encryption</p>
            </div>
          </div>
        </div>

        {/* FAQ or Trust Signals */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Questions? <a href="mailto:admin@samia-tarot.com" className="text-blue-600 hover:text-blue-800 font-medium">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  )
}
