import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        applications:job_applications(count)
      `)
      .eq("posted_by", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json(
      (data || []).map((job: any) => ({
        ...job,
        application_count: job.applications?.[0]?.count || 0,
      })),
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
