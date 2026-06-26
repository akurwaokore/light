import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { generateAIText, AINotConfiguredError } from "@/lib/ai/generate"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Require authentication — this endpoint spends the org's AI quota.
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

    // Routes to the admin-configured provider (OpenAI / Gemini / custom LLM).
    const { text } = await generateAIText({
      prompt,
      system: "You are an expert marketplace copywriter.",
      maxTokens: 300,
    })

    return NextResponse.json({ description: text.trim() })
  } catch (error: any) {
    if (error instanceof AINotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error("[akurwas] Error generating AI description:", error)
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 })
  }
}
