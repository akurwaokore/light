import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// POST - Toggle saving/unsaving a post
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already saved
    const { data: existing, error: checkError } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (checkError) {
      console.error("[Save Post] Check error:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existing) {
      // Unsave
      const { error: deleteError } = await supabase
        .from("saved_posts")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id)

      if (deleteError) {
        console.error("[Save Post] Delete error:", deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      return NextResponse.json({ saved: false, message: "Post unsaved successfully" })
    } else {
      // Save
      const { error: insertError } = await supabase
        .from("saved_posts")
        .insert({
          post_id: postId,
          user_id: user.id,
        })

      if (insertError) {
        console.error("[Save Post] Insert error:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ saved: true, message: "Post saved successfully" })
    }
  } catch (error: any) {
    console.error("[Save Post] Error:", error)
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 })
  }
}

// GET - Check if a post is saved
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ saved: false })
    }

    const { data, error } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ saved: !!data })
  } catch (error: any) {
    console.error("[Save Post GET] Error:", error)
    return NextResponse.json({ saved: false })
  }
}
