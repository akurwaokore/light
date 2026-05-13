import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { userId, amount, type, reason, referenceId, referenceType, metadata } = body

    const pointsToAward =
      referenceType === "purchase" || referenceType === "sale"
        ? Number.parseFloat((amount * 0.0001).toFixed(4))
        : Number.parseFloat(amount.toFixed(4))

    console.log("[akurwas] Awarding points:", {
      userId,
      amount,
      pointsToAward,
      type,
      referenceType,
    })

    // Call the award_points function
    const { data, error } = await supabase.rpc("award_points", {
      p_user_id: userId,
      p_points: pointsToAward,
      p_type: type,
      p_reason: reason,
      p_reference_id: referenceId || null,
      p_reference_type: referenceType || null,
      p_metadata: metadata || {},
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      transactionId: data,
      pointsAwarded: pointsToAward,
    })
  } catch (error) {
    console.error("[akurwas] Error awarding points:", error)
    return NextResponse.json({ error: "Failed to award points" }, { status: 500 })
  }
}
