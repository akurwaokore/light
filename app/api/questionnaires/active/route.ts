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

    // To enable this feature, run the questionnaire migration script first
    return NextResponse.json({ questionnaire: null })

    // This prevents the full query from failing if the table doesn't exist
    const { error: tableCheckError } = await supabase
      .from("questionnaires")
      .select("id", { count: "exact", head: true })
      .limit(0)

    // If table doesn't exist, return null questionnaire
    if (tableCheckError) {
      console.log("[akurwas] Questionnaires table not available:", tableCheckError.code)
      return NextResponse.json({ questionnaire: null })
    }

    const { data: questionnaires, error } = await supabase
      .from("questionnaires")
      .select(`
        *,
        questionnaire_questions(*),
        questionnaire_responses!left(user_id)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      console.log("[akurwas] Questionnaire query error:", error.code)
      return NextResponse.json({ questionnaire: null })
    }

    // Filter out questionnaires the user has already completed
    const unanswered = questionnaires?.filter((q) => {
      const hasResponded = q.questionnaire_responses?.some((r: any) => r.user_id === userId)
      return !hasResponded
    })

    // Return the first unanswered questionnaire
    const questionnaire = unanswered?.[0] || null

    if (questionnaire) {
      // Parse options for each question
      questionnaire.questionnaire_questions = questionnaire.questionnaire_questions.map((q: any) => ({
        ...q,
        options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
      }))
    }

    return NextResponse.json({ questionnaire })
  } catch (error) {
    console.error("[akurwas] Error fetching active questionnaires:", error)
    return NextResponse.json({ questionnaire: null })
  }
}
