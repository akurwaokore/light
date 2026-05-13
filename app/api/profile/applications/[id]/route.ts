import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const appId = params.id
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { status } = await request.json()

    // Update application if job belongs to current user
    // We check if the application's job.posted_by is the current user
    const { data: appData, error: fetchError } = await supabase
      .from("job_applications")
      .select(`
        id,
        job:jobs(posted_by)
      `)
      .eq("id", appId)
      .single()

    if (fetchError || !appData || (appData.job as any).posted_by !== user.id) {
       return NextResponse.json({ error: "Unauthorized to update this application" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("job_applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", appId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
