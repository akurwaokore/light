import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Require authentication — this endpoint spends paid AI tokens.
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, category, productType, keywords } = body

    const prompt = `Create a compelling, catchy sales description for a ${productType} listing on an alumni marketplace.

Product/Service: ${title}
Category: ${category}
${keywords ? `Keywords: ${keywords}` : ""}

Requirements:
- Write 2-3 engaging sentences that sell the product/service
- Highlight key benefits and value proposition
- Use persuasive language that appeals to alumni community
- Keep it professional but friendly
- Make it concise and impactful

Write only the description, no extra commentary.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
    })

    return NextResponse.json({ description: text.trim() })
  } catch (error) {
    console.error("[akurwas] Error generating AI description:", error)
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 })
  }
}
