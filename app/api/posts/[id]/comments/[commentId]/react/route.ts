import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

const VALID = ["like", "love", "haha", "wow", "sad", "angry"]

// POST - Toggle an emoji reaction on a comment (mirrors the post react route).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const { commentId } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reaction_type } = await request.json()
    if (!VALID.includes(reaction_type)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from("comment_reactions")
      .select("id, reaction_type")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existing) {
      if (existing.reaction_type === reaction_type) {
        const { error } = await supabase.from("comment_reactions").delete().eq("id", existing.id)
        if (error) throw error
        return NextResponse.json({ action: "removed" })
      }
      const { error } = await supabase
        .from("comment_reactions")
        .update({ reaction_type })
        .eq("id", existing.id)
      if (error) throw error
      return NextResponse.json({ action: "updated", reaction_type })
    }

    const { error } = await supabase.from("comment_reactions").insert({
      comment_id: commentId,
      user_id: user.id,
      reaction_type,
    })
    if (error) throw error

    // Notify the comment author of a new reaction (best-effort).
    try {
      const { data: comment } = await supabase
        .from("comments")
        .select("author_id, post_id")
        .eq("id", commentId)
        .single()
      if (comment && comment.author_id !== user.id) {
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()
        await supabase.from("notifications").insert({
          user_id: comment.author_id,
          type: "general",
          title: "New Reaction",
          message: `${profile?.display_name || "Someone"} reacted to your comment.`,
          link: `/feed`,
          metadata: { post_id: comment.post_id, comment_id: commentId, reaction_type, real_type: "comment_like" },
        })
      }
    } catch (err) {
      console.error("[comment react] notification error:", err)
    }

    return NextResponse.json({ action: "added", reaction_type })
  } catch (error: any) {
    console.error("Error reacting to comment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
