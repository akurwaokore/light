import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// POST - Share a post (create a new post that references the original)
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

    const { share_text } = await request.json()

    // Get the original post to verify it exists
    const { data: originalPost, error: postError } = await supabase
      .from("posts")
      .select("id, author_id, visibility")
      .eq("id", id)
      .single()

    if (postError || !originalPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Don't let sharing widen the audience of a non-public post.
    // Private posts can't be reshared at all; friends-only posts stay friends-only.
    const isOwnPost = originalPost.author_id === user.id
    if (originalPost.visibility === "private" && !isOwnPost) {
      return NextResponse.json({ error: "This post cannot be shared" }, { status: 403 })
    }
    const shareVisibility =
      originalPost.visibility === "friends" || originalPost.visibility === "private"
        ? "friends"
        : "public"

    // Create a new post that shares the original
    const { data: sharedPost, error } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        content: share_text || "",
        shared_post_id: id,
        visibility: shareVisibility,
        status: "active"
      })
      .select(`
        id,
        content,
        created_at,
        shared_post_id,
        author:profiles!posts_author_id_fkey(id, display_name, photo_url)
      `)
      .single()

    if (error) throw error

    // Record in post_shares table
    await supabase.from("post_shares").insert({
      post_id: id,
      user_id: user.id,
      share_text: share_text || null,
    })

    // Notify original author
    if (originalPost.author_id !== user.id) {
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()
        
        await supabase.from("notifications").insert({
            user_id: originalPost.author_id,
            type: "general",
            title: "Post Shared",
            message: `${profile?.display_name || "Someone"} shared your post.`,
            link: `/feed`,
            metadata: { post_id: id, shared_post_id: sharedPost.id, real_type: "post_share" },
        })
    }

    // Award 0.3 points for sharing
    try {
        await fetch(`${request.nextUrl.origin}/api/points/award`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            amount: 0.3,
            type: "earn",
            reason: "Shared a post",
            referenceType: "share",
            referenceId: sharedPost.id,
          }),
        })
    } catch (pointsError) {
        console.error("[Share API] Error awarding share points:", pointsError)
    }

    return NextResponse.json({ post: sharedPost, message: "Post shared successfully" })
  } catch (error: any) {
    console.error("Error sharing post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
