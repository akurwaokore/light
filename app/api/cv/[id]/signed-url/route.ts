import { createServerClient } from "@/lib/supabase/server"
import { createCvSignedUrl } from "@/lib/supabase/storage"
import { type NextRequest, NextResponse } from "next/server"

// GET - returns a short-lived signed URL for a CV file. The RLS-gated SELECT
// below IS the authorization check: it only returns a row if the caller is the
// owner, an admin, or the poster of a job this CV was used to apply to.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: cv, error } = await supabase
      .from("cvs")
      .select("id, storage_path, file_url")
      .eq("id", id)
      .single()
    if (error || !cv) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 })

    // Legacy CVs uploaded to the public `documents` bucket: their public URL
    // still works (pre-migration back-compat).
    if (!cv.storage_path && cv.file_url) {
      return NextResponse.json({ url: cv.file_url, legacy: true })
    }
    if (!cv.storage_path) return NextResponse.json({ error: "No file" }, { status: 404 })

    const url = await createCvSignedUrl(cv.storage_path)
    if (!url) return NextResponse.json({ error: "Could not generate link" }, { status: 500 })
    return NextResponse.json({ url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
