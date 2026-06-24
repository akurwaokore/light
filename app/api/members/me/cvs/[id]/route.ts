import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// PATCH - set primary / rename a CV (owner only via RLS). { is_primary?, label? }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { is_primary, label } = await request.json()

    if (is_primary === true) {
      // Clear any existing primary first (partial unique index allows one).
      await supabase.from("cvs").update({ is_primary: false }).eq("user_id", user.id).eq("is_primary", true)
    }
    const patch: any = {}
    if (typeof is_primary === "boolean") patch.is_primary = is_primary
    if (typeof label === "string") patch.label = label

    const { error } = await supabase.from("cvs").update(patch).eq("id", id).eq("user_id", user.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - remove a CV, unless it's attached to a submitted application.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { count } = await supabase
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("cv_id", id)
    if ((count || 0) > 0) {
      return NextResponse.json({ error: "This CV is attached to an application and cannot be deleted." }, { status: 409 })
    }

    // Remove the storage object too.
    const { data: cv } = await supabase.from("cvs").select("storage_path, is_primary").eq("id", id).eq("user_id", user.id).maybeSingle()
    if (cv?.storage_path) {
      await supabase.storage.from("cvs").remove([cv.storage_path])
    }
    const { error } = await supabase.from("cvs").delete().eq("id", id).eq("user_id", user.id)
    if (error) throw error

    // If we deleted the primary, promote the newest remaining CV.
    if (cv?.is_primary) {
      const { data: next } = await supabase.from("cvs").select("id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      if (next?.id) await supabase.from("cvs").update({ is_primary: true }).eq("id", next.id)
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
