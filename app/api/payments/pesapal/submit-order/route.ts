import { NextResponse } from "next/server"
import { getPesapalClient } from "@/lib/pesapal"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, description, callback_url, cancellation_url, notification_id, billing_address } = body

    const pesapal = await getPesapalClient()

    const orderData = {
      id: `${description.toLowerCase().includes('lifetime') ? 'lifetime' : 'annual'}-ORDER-${Date.now()}`,
      currency: "KES",
      amount: amount,
      description: description,
      callback_url: callback_url,
      cancellation_url: cancellation_url,
      notification_id: notification_id,
      billing_address: billing_address
    }

    const response = await pesapal.submitOrder(orderData)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Pesapal order submission error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
