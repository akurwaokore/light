import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    let userId = searchParams.get("userId")

    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      userId = user?.id ?? null
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("points_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({
      transactions: (data || []).map((transaction: any) => ({
        ...transaction,
        points: transaction.points ?? transaction.amount ?? transaction.delta ?? 0,
      })),
    })
  } catch (error) {
    console.error("[akurwas] Error fetching points history:", error)
    return NextResponse.json({ error: "Failed to fetch points history" }, { status: 500 })
  }
}
