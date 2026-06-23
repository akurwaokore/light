import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

// Generic AI description generator. Currently used by the event form, which
// posts { type: "event", title, category }. Returns { description }.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type = "event", title, category, keywords } = body

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const prompts: Record<string, string> = {
      event: `Write an engaging, inviting description for an alumni community event.

Event title: ${title}
Category: ${category || "General"}
${keywords ? `Highlights: ${keywords}` : ""}

Requirements:
- 2-4 sentences that build excitement and explain the value of attending
- Warm, professional tone suited to an alumni audience
- Mention what attendees will gain
- No extra commentary, just the description`,
    }

    const prompt = prompts[type] || prompts.event

    try {
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt,
      })
      return NextResponse.json({ description: text.trim() })
    } catch (aiError) {
      // Fall back to a deterministic description if the AI provider isn't
      // configured, so the form still works in presentation/demo mode.
      console.error("[ai/generate-description] provider error:", aiError)
      const fallback = `Join us for "${title}"${
        category ? `, a ${category.toLowerCase()} event` : ""
      } organized by the alumni community. Connect with fellow alumni, gain valuable insights, and be part of an engaging experience. Don't miss this opportunity to learn, network, and grow together.`
      return NextResponse.json({ description: fallback })
    }
  } catch (error) {
    console.error("[ai/generate-description] error:", error)
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 })
  }
}
