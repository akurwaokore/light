import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: categories, error } = await supabase
      .from("job_categories")
      .select("*")
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("[akurwas] Error fetching job categories:", error)
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("[akurwas] Unexpected error in categories route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
