import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    if (!userId) {
      return NextResponse.json({ questionnaire: null })
    }

    // Questionnaire support is intentionally disabled until the schema is finalized.
    return NextResponse.json({ questionnaire: null })
  } catch (error) {
    console.error("[akurwas] Error fetching active questionnaires:", error)
    return NextResponse.json({ questionnaire: null })
  }
}
