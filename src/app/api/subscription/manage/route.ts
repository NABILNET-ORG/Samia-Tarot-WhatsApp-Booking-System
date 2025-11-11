import { NextRequest, NextResponse } from "next/server"
import { requireBusinessContext } from "@/lib/multi-tenant/middleware"
import { SubscriptionManageSchema, validateInput } from "@/lib/validation/schemas"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2023-10-16" })

export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    const business = context.business as any
    if (!business.stripe_customer_id) return NextResponse.json({ subscription: null })
    const subs = await stripe.subscriptions.list({ customer: business.stripe_customer_id, limit: 1 })
    return NextResponse.json({ subscription: subs.data[0] || null })
  })
}

export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()

      // Validate request body against schema
      const validation = validateInput(SubscriptionManageSchema, body)
      if (!validation.success) {
        return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 })
      }

      const business = context.business as any
      const { action } = validation.data

      if (action === "cancel" && business.stripe_customer_id) {
        const subs = await stripe.subscriptions.list({ customer: business.stripe_customer_id, limit: 1 })
        if (subs.data[0]) await stripe.subscriptions.cancel(subs.data[0].id)
        return NextResponse.json({ message: "Subscription cancelled" })
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
