import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - the caller's saved jobs with the job details.
export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("saved_jobs")
      .select(`id, created_at, job:jobs(id, title, company, location, employment_type, salary_min, salary_max, status)`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ saved: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
