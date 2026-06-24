import { type NextRequest, NextResponse } from "next/server"
import { checkAdminAccess } from "@/lib/admin-auth"

// POST - Approve or reject event
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Adminness is determined via the centralized RBAC helper. `profiles` has no
    // `role` column (roles live in user_roles / the is_admin flag), so checking
    // it directly always failed and blocked every approval.
    const { authorized, supabase, user, status } = await checkAdminAccess("manage_events")
    if (!authorized) {
      return NextResponse.json(
        { error: status === 401 ? "Unauthorized" : "Only admins can approve events" },
        { status: status! },
      )
    }

    const body = await request.json()
    const { action, rejection_reason } = body

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updateData =
      action === "approve"
        ? {
            status: "approved",
            approved_by: user!.id,
            approved_at: new Date().toISOString(),
            rejection_reason: null,
          }
        : {
            status: "rejected",
            rejection_reason: rejection_reason || "No reason provided",
          }

    const { data, error } = await supabase!
      .from("events")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        organizer:profiles!events_organizer_id_fkey(id, display_name, photo_url)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
