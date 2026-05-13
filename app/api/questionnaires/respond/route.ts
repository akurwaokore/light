import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const { questionnaire_id, responses, time_taken_seconds } = body

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Insert response
    const { error } = await supabase.from("questionnaire_responses").insert({
      questionnaire_id,
      user_id: user.id,
      responses: JSON.stringify(responses),
      time_taken_seconds,
    })

    if (error) {
      console.error("[akurwas] Error inserting response:", error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[akurwas] Error submitting questionnaire response:", error)
    return NextResponse.json({ error: "Failed to submit response" }, { status: 500 })
  }
}
