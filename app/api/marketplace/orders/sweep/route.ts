import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// POST - release reserved stock for abandoned (expired) pending orders.
// Intended to be called by a scheduler/cron. Protected by a shared secret.
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc("expire_stale_orders")
    if (error) throw error
    return NextResponse.json({ expired: data ?? 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
