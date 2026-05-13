import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()
    const isAdmin = roleData?.role === "admin" || roleData?.role === "super_admin"

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, photo_url, campus, graduation_year, job_title, company")
      .order("display_name")

    if (profilesError) {
      console.error("[akurwas] Error fetching members:", profilesError)
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
    }

    // Filter out the current user
    const otherProfiles = profiles.filter(p => p.id !== user.id)

    return NextResponse.json({
      members: otherProfiles,
      isAdmin
    })
  } catch (error) {
    console.error("[akurwas] Error in members route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
