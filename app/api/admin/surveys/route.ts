import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Fetch questionnaires from database
    const { data: questionnaires, error } = await supabase
      .from("questionnaires")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Surveys API] Error fetching questionnaires:", error)
      return NextResponse.json({ error: "Failed to fetch questionnaires" }, { status: 500 })
    }

    return NextResponse.json({ questionnaires: questionnaires || [] })
  } catch (error) {
    console.error("[Surveys API] Error in GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    console.log("[Surveys API] Creating questionnaire with body:", body)

    // 1. Create the questionnaire
    const { data: questionnaire, error: qError } = await supabase
      .from("questionnaires")
      .insert({
        title: body.title,
        description: body.description,
        status: "draft",
        target_audience: body.target_audience,
        is_required: body.is_required,
        send_notification: body.send_notification,
        created_by: user.id,
      })
      .select()
      .single()

    if (qError) {
      console.error("[Surveys API] Error creating questionnaire:", qError)
      return NextResponse.json({ error: qError.message || "Failed to create questionnaire" }, { status: 500 })
    }

    // 2. Create the questions
    if (body.questions && body.questions.length > 0) {
      const questionsToInsert = body.questions.map((q: any, index: number) => ({
        questionnaire_id: questionnaire.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || [],
        is_required: q.is_required || false,
        order_index: q.order_index ?? index
      }))

      const { error: questionsError } = await supabase
        .from("survey_questions")
        .insert(questionsToInsert)

      if (questionsError) {
        console.error("[Surveys API] Error creating questions:", questionsError)
        // We might want to delete the questionnaire here if questions fail, 
        // but for now we'll just report the error
        return NextResponse.json({ 
          error: "Questionnaire created but failed to save questions: " + questionsError.message,
          questionnaire_id: questionnaire.id 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, questionnaire })
  } catch (error: any) {
    console.error("[Surveys API] Unexpected error in POST:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
