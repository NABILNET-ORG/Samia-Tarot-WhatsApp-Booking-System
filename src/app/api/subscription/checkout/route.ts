import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { SubscriptionCheckoutSchema, validateInput } from '@/lib/validation/schemas'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' })

export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()

      // Validate request body against schema
      const validation = validateInput(SubscriptionCheckoutSchema, body)
      if (!validation.success) {
        return NextResponse.json({ error: 'Validation failed', errors: validation.errors }, { status: 400 })
      }

      const { priceId, successUrl, cancelUrl } = validation.data

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl || `${process.env.NEXT_PUBLIC_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_URL}/pricing`,
        client_reference_id: context.business.id,
        metadata: { business_id: context.business.id },
      })

      return NextResponse.json({ sessionId: session.id, url: session.url })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
