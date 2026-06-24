import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Idempotently finalize a paid marketplace order. Called from payment callbacks
 * with a SERVICE-ROLE client (no user session). Stock was already reserved at
 * order creation (create_order_from_cart), so success does not decrement again.
 *
 * Returns true if this call transitioned the order to paid (so callers can avoid
 * double side-effects); false if it was already finalized / not finalizable.
 */
export async function finalizeOrder(
  admin: SupabaseClient,
  opts: { orderId: string; provider: string; providerRef?: string; rawCallback?: any },
): Promise<boolean> {
  const { orderId, provider, providerRef, rawCallback } = opts

  const { data: order } = await admin
    .from("orders")
    .select("id, buyer_id, seller_id, total, status")
    .eq("id", orderId)
    .single()
  if (!order) return false
  // Idempotency: only a pending order becomes paid; replays are no-ops.
  if (order.status !== "pending_payment") return false

  await admin
    .from("payments")
    .update({ status: "success", provider_ref: providerRef ?? null, raw_callback: rawCallback ?? null, updated_at: new Date().toISOString() })
    .eq("order_id", orderId)

  const { error: updErr } = await admin
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending_payment") // guard against concurrent finalize
  if (updErr) return false

  // Points: buyer earns (~1 per KES 100 spent, min 1), seller earns a sale bonus.
  // Use whole points so they're visible in the integer points view.
  const amount = Number(order.total || 0)
  await admin.rpc("award_points", {
    p_user_id: order.buyer_id,
    p_points: Math.max(1, Math.round(amount / 100)),
    p_type: "earn",
    p_reason: "Marketplace purchase",
    p_reference_id: orderId,
    p_reference_type: "purchase",
    p_metadata: { provider },
  })
  await admin.rpc("award_points", {
    p_user_id: order.seller_id,
    p_points: 50,
    p_type: "earn",
    p_reason: "Marketplace sale",
    p_reference_id: orderId,
    p_reference_type: "sale",
    p_metadata: { provider },
  })

  // Notifications (columns reconciled: title/message/action_url/metadata).
  await admin.from("notifications").insert([
    {
      user_id: order.seller_id,
      type: "marketplace_purchase",
      title: "New paid order",
      message: "You have a new paid order. Open it to arrange delivery.",
      action_url: `/marketplace/orders/${orderId}`,
      metadata: { orderId },
    },
    {
      user_id: order.buyer_id,
      type: "marketplace_purchase",
      title: "Payment received",
      message: "Your order is confirmed. View your receipt and seller contact.",
      action_url: `/marketplace/orders/${orderId}`,
      metadata: { orderId },
    },
  ])

  return true
}

/** Mark an order failed/cancelled and release its reserved stock (idempotent). */
export async function failOrder(
  admin: SupabaseClient,
  opts: { orderId: string; reason?: string; rawCallback?: any; status?: "failed" | "cancelled" },
): Promise<void> {
  const { orderId, rawCallback } = opts
  const { data: order } = await admin.from("orders").select("status").eq("id", orderId).single()
  if (!order || order.status !== "pending_payment") return

  const { data: items } = await admin.from("order_items").select("product_id, quantity").eq("order_id", orderId)
  for (const it of items || []) {
    // Restore reserved stock.
    const { data: p } = await admin.from("products").select("quantity").eq("id", it.product_id).single()
    if (p) {
      await admin
        .from("products")
        .update({ quantity: Number(p.quantity || 0) + Number(it.quantity || 0), updated_at: new Date().toISOString() })
        .eq("id", it.product_id)
    }
  }
  await admin.from("payments").update({ status: "failed", raw_callback: rawCallback ?? null, updated_at: new Date().toISOString() }).eq("order_id", orderId)
  await admin.from("orders").update({ status: opts.status ?? "failed", updated_at: new Date().toISOString() }).eq("id", orderId).eq("status", "pending_payment")
}
