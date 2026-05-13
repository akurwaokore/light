import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    // Update questionnaire status to active
    const { error } = await supabase
      .from("questionnaires")
      .update({ status: "active", start_date: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error

    // Trigger will automatically send notifications

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[akurwas] Error activating questionnaire:", error)
    return NextResponse.json({ error: "Failed to activate questionnaire" }, { status: 500 })
  }
}
