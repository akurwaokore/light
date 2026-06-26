import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { generateAIText, AINotConfiguredError } from "@/lib/ai/generate"

export const dynamic = "force-dynamic"

// POST { prompt, system?, maxTokens? } — generates text using the admin-
// configured AI provider. Auth required (spends the org's AI quota/keys).
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const prompt = String(body.prompt || "").trim()
    if (!prompt) return NextResponse.json({ error: "A prompt is required" }, { status: 400 })

    const { text, provider } = await generateAIText({
      prompt,
      system: body.system,
      maxTokens: body.maxTokens,
    })

    return NextResponse.json({ text, provider }, { headers: { "Cache-Control": "no-store" } })
  } catch (error: any) {
    if (error instanceof AINotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error("[ai/generate] error:", error)
    return NextResponse.json({ error: error.message || "AI generation failed" }, { status: 500 })
  }
}
