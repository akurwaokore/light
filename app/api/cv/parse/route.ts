import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { generateText } from "ai"

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

    const { file_url, text_content } = await request.json()

    // Use AI to extract structured data from CV
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Extract structured information from this CV/Resume text. Return a JSON object with these fields:
      - skills: array of technical and professional skills
      - experience_level: one of "entry", "mid", "senior", "executive"
      - education: array of education entries
      - work_experience: array of work experience entries
      - certifications: array of certifications
      - languages: array of languages spoken
      - summary: brief professional summary (2-3 sentences)
      
      CV Text:
      ${text_content}
      
      Return ONLY valid JSON, no markdown or explanation.`,
    })

    const parsed = JSON.parse(text)

    return NextResponse.json({ success: true, parsed_data: parsed })
  } catch (error) {
    console.error("[akurwas] Error parsing CV:", error)
    return NextResponse.json({ error: "Failed to parse CV" }, { status: 500 })
  }
}
