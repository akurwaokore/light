import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: cvs, error } = await supabase
      .from("cvs")
      .select("id, file_url, file_name, created_at")
      .eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ cvs: cvs || [] })
  } catch (error) {
    console.error("[CVs API] Error fetching CVs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
