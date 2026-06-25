import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Shape comment reactions into counts + the current user's reaction.
function withReactionAggregates(comments: any[], userId: string) {
  return (comments || []).map((c: any) => {
    const reactions_by_type: Record<string, number> = {}
    ;(c.reactions || []).forEach((r: any) => {
      reactions_by_type[r.reaction_type] = (reactions_by_type[r.reaction_type] || 0) + 1
    })
    const { reactions, ...rest } = c
    return {
      ...rest,
      reactions_count: reactions?.length || 0,
      reactions_by_type,
      user_reaction: userId ? reactions?.find((r: any) => r.user_id === userId)?.reaction_type || null : null,
    }
  })
}

// GET - All comments for a post (flat list; client builds the reply threads
// from parent_comment_id). Ordered oldest-first, Facebook-style.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: comments, error } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        image_url,
        media_urls,
        created_at,
        parent_comment_id,
        author:profiles!comments_author_id_fkey(id, display_name, photo_url, campus),
        reactions:comment_reactions(reaction_type, user_id)
      `)
      .eq("post_id", id)
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({ comments: withReactionAggregates(comments || [], user?.id || "") })
  } catch (error: any) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Add a comment or reply. A comment may be text, an image, or both.
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

    const { content, parent_comment_id, image_url, media_urls } = await request.json()

    const trimmed = (content || "").trim()
    const hasMedia = !!image_url || (Array.isArray(media_urls) && media_urls.length > 0)
    if (!trimmed && !hasMedia) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 })
    }

    // Validate the parent (if replying) belongs to the same post.
    if (parent_comment_id) {
      const { data: parent, error: parentError } = await supabase
        .from("comments")
        .select("id, post_id")
        .eq("id", parent_comment_id)
        .maybeSingle()
      if (parentError || !parent || parent.post_id !== id) {
        return NextResponse.json({ error: "Parent comment not found for reply" }, { status: 404 })
      }
    }

    const commentData: any = {
      post_id: id,
      author_id: user.id,
      content: trimmed,
      parent_comment_id: parent_comment_id || null,
      image_url: image_url || null,
      media_urls: Array.isArray(media_urls) ? media_urls : [],
    }

    const { data: comment, error } = await supabase
      .from("comments")
      .insert(commentData)
      .select(`id, content, image_url, media_urls, created_at, parent_comment_id`)
      .single()

    if (error) {
      console.error("Error inserting comment:", error)
      throw error
    }

    // Attach author manually to avoid join hiccups in the insert response.
    const { data: authorProfile } = await supabase
      .from("profiles")
      .select("id, display_name, photo_url, campus")
      .eq("id", user.id)
      .single()
    const commentWithAuthor = {
      ...comment,
      author: authorProfile,
      reactions_count: 0,
      reactions_by_type: {},
      user_reaction: null,
    }

    // Notify the post author (unless commenting on own post).
    const { data: post } = await supabase.from("posts").select("author_id, content").eq("id", id).single()
    if (post && post.author_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: post.author_id,
        type: "post_comment",
        title: "New Comment",
        message: `${authorProfile?.display_name || "Someone"} commented on your post: "${post.content?.substring(0, 30)}..."`,
        link: `/feed`,
        action_url: `/feed`,
        metadata: { post_id: id, comment_id: comment.id },
      })
    }

    // If it's a reply, notify the parent comment author too (once).
    if (parent_comment_id) {
      const { data: parentComment } = await supabase
        .from("comments")
        .select("author_id, content")
        .eq("id", parent_comment_id)
        .single()
      if (parentComment && parentComment.author_id !== user.id && parentComment.author_id !== post?.author_id) {
        await supabase.from("notifications").insert({
          user_id: parentComment.author_id,
          type: "comment_reply",
          title: "New Reply",
          message: `${authorProfile?.display_name || "Someone"} replied to your comment: "${parentComment.content?.substring(0, 30)}..."`,
          link: `/feed`,
          action_url: `/feed`,
          metadata: { post_id: id, comment_id: comment.id, parent_comment_id },
        })
      }
    }

    // Award 0.2 points for commenting (best-effort).
    try {
      const origin = request.nextUrl.origin
      fetch(`${origin}/api/points/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amount: 0.2,
          type: "earn",
          reason: "Commented on a post",
          referenceType: "comment",
          referenceId: comment.id,
        }),
      }).catch((e) => console.error("[points] comment award error:", e))
    } catch (pointsError) {
      console.error("[points] Error awarding comment points:", pointsError)
    }

    return NextResponse.json({ comment: commentWithAuthor, message: "Comment added successfully" })
  } catch (error: any) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 })
  }
}

// DELETE - Remove the user's own comment (cascade removes its replies/reactions).
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { commentId } = await request.json()
    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
    }

    const { data: comment, error: fetchError } = await supabase
      .from("comments")
      .select("id, author_id, post_id")
      .eq("id", commentId)
      .eq("post_id", id)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    if (comment.author_id !== user.id) {
      return NextResponse.json({ error: "You can only delete your own comment" }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("author_id", user.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ message: "Comment deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting comment:", error)
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 })
  }
}
