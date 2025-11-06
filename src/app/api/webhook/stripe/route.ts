import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/client"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-11-20.acacia" })

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 })

  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || "")
  
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any
    if (session.metadata?.business_id) {
      await supabaseAdmin.from("businesses").update({ stripe_customer_id: session.customer, subscription_status: "active" }).eq("id", session.metadata.business_id)
    }
  }
  
  return NextResponse.json({ received: true })
}
