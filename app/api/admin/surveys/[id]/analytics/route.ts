import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    // Get questionnaire with questions
    const { data: questionnaire, error: qError } = await supabase
      .from("questionnaires")
      .select("*, questionnaire_questions(*)")
      .eq("id", id)
      .single()

    if (qError) throw qError

    // Get all responses
    const { data: responses, error: rError } = await supabase
      .from("questionnaire_responses")
      .select("*")
      .eq("questionnaire_id", id)

    if (rError) throw rError

    // Calculate analytics
    const totalResponses = responses?.length || 0
    const avgTime = responses?.reduce((sum, r) => sum + (r.time_taken_seconds || 0), 0) / (totalResponses || 1)

    // Process question-by-question analytics
    const questionAnalytics = questionnaire.questionnaire_questions.map((q: any) => {
      const questionResponses = responses
        ?.map((r) => {
          const answer = r.responses.find((a: any) => a.question_id === q.id)
          return answer?.answer
        })
        .filter(Boolean)

      if (q.question_type === "text") {
        return {
          question_text: q.question_text,
          type: "text",
          responses: questionResponses,
        }
      } else {
        // Calculate option distribution
        const optionCounts: Record<string, number> = {}
        questionResponses?.forEach((answer: any) => {
          if (Array.isArray(answer)) {
            answer.forEach((a) => (optionCounts[a] = (optionCounts[a] || 0) + 1))
          } else {
            optionCounts[answer] = (optionCounts[answer] || 0) + 1
          }
        })

        const options = Object.entries(optionCounts).map(([option, count]) => ({
          option,
          count,
          percentage: Math.round((count / (questionResponses?.length || 1)) * 100),
        }))

        return {
          question_text: q.question_text,
          type: q.question_type,
          options,
        }
      }
    })

    return NextResponse.json({
      total_responses: totalResponses,
      completion_rate: 100, // Simplified - all responses are complete
      avg_time: Math.round(avgTime),
      questions: questionAnalytics,
    })
  } catch (error) {
    console.error("[akurwas] Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
