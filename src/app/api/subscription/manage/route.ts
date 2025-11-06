import { NextRequest, NextResponse } from "next/server"
import { requireBusinessContext } from "@/lib/multi-tenant/middleware"
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
    const business = context.business as any
    const { action } = await request.json()
    if (action === "cancel" && business.stripe_customer_id) {
      const subs = await stripe.subscriptions.list({ customer: business.stripe_customer_id, limit: 1 })
      if (subs.data[0]) await stripe.subscriptions.cancel(subs.data[0].id)
      return NextResponse.json({ message: "Subscription cancelled" })
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  })
}
