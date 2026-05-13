import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// POST - Add or update reaction to post
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reaction_type } = await request.json()

    const validReactions = ["like", "love", "haha", "wow", "sad", "angry"]
    if (!validReactions.includes(reaction_type)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 })
    }

    // Check if user already reacted
    const { data: existing } = await supabase
      .from("post_reactions")
      .select("id, reaction_type")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existing) {
      // If same reaction, DELETE it (toggle off)
      if (existing.reaction_type === reaction_type) {
        console.log(`[Reactions] Removing existing reaction ${existing.id} for post ${id}`)
        const { error } = await supabase.from("post_reactions").delete().eq("id", existing.id)
        if (error) throw error
        return NextResponse.json({ message: "Reaction removed", action: "removed" })
      } else {
        // If different reaction, UPDATE it
        console.log(`[Reactions] Updating reaction ${existing.id} for post ${id} to ${reaction_type}`)
        const { error } = await supabase
          .from("post_reactions")
          .update({ reaction_type })
          .eq("id", existing.id)

        if (error) throw error

        // Notify post author
        try {
          const { data: post } = await supabase.from("posts").select("author_id, content").eq("id", id).single()
          if (post && post.author_id !== user.id) {
            const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()
            await supabase.from("notifications").insert({
              user_id: post.author_id,
              type: "general",
              title: "New Reaction",
              message: `${profile?.display_name || "Someone"} changed their reaction to your post: "${post.content?.substring(0, 30)}..."`,
              link: `/feed`,
              metadata: { post_id: id, reaction_type, real_type: "post_like" },
            })
          }
        } catch (err) {
          console.error("Notification error:", err)
        }

        return NextResponse.json({ message: "Reaction updated", action: "updated" })
      }
    } else {
      // New reaction - INSERT it
      console.log(`[Reactions] Adding new reaction ${reaction_type} for post ${id}`)
      const { error } = await supabase.from("post_reactions").insert({
        post_id: id,
        user_id: user.id,
        reaction_type,
      })

      if (error) {
        console.error("[Reactions] Insert error:", error)
        throw error
      }

      // Notify post author
      try {
        const { data: post } = await supabase.from("posts").select("author_id, content").eq("id", id).single()
        if (post && post.author_id !== user.id) {
          const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()
          await supabase.from("notifications").insert({
            user_id: post.author_id,
            type: "general",
            title: "New Reaction",
            message: `${profile?.display_name || "Someone"} reacted to your post: "${post.content?.substring(0, 30)}..."`,
            link: `/feed`,
            metadata: { post_id: id, reaction_type, real_type: "post_like" },
          })
        }
      } catch (err) {
        console.error("Notification error:", err)
      }

      // Award points for reacting
      try {
        await fetch(`${request.nextUrl.origin}/api/points/award`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            amount: 0.1,
            type: "earn",
            reason: "Reacted to a post",
            referenceType: "reaction",
            referenceId: id,
          }),
        })
      } catch (pointsError) {
        console.error("[Reactions] Error awarding points:", pointsError)
      }

      return NextResponse.json({ message: "Reaction added", action: "added" })
    }
  } catch (error: any) {
    console.error("Error reacting to post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
