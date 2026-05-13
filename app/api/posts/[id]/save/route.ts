import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Save/unsave post
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already saved
    const { data: existing } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .single()

    if (existing) {
      // Unsave
      const { error } = await supabase.from("saved_posts").delete().eq("id", existing.id)

      if (error) throw error
      return NextResponse.json({ saved: false, message: "Post unsaved" })
    } else {
      // Save
      const { error } = await supabase.from("saved_posts").insert({
        post_id: id,
        user_id: user.id,
      })

      if (error) throw error
      return NextResponse.json({ saved: true, message: "Post saved" })
    }
  } catch (error: any) {
    console.error("Error saving post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
