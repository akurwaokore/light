import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET - Get all comments for a post (with nested replies)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    // Get all comments for this post
    // Note: parent_comment_id is checked in the SQL script but we handle it gracefully here
    const { data: comments, error } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        parent_comment_id,
        path,
        author:profiles!comments_author_id_fkey(id, display_name, photo_url, campus)
      `)
      .eq("post_id", id)
      .order("path", { ascending: true }) // Order by path for threaded view

    if (error) throw error

    // Get user from session
    const { data: { user } } = await supabase.auth.getUser()

    // Transform to include reaction counts
    const transformedComments =
      comments?.map((comment: any) => ({
        ...comment,
        reactions_count: comment.reactions?.length || 0,
        reactions_by_type: comment.reactions?.reduce((acc: any, r: any) => {
          acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1
          return acc
        }, {}),
        user_reaction:
          comment.reactions?.find((r: any) => r.user_id === (user?.id || ""))?.reaction_type ||
          null,
      })) || []

    return NextResponse.json({ comments: transformedComments })
  } catch (error: any) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Add comment or reply to post
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

    const { content, parent_comment_id } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 })
    }

    let path = user.id; // Default path for top-level comments
    if (parent_comment_id) {
      // Fetch parent comment's path to build the new path
      const { data: parentComment, error: parentError } = await supabase
        .from("comments")
        .select("path")
        .eq("id", parent_comment_id)
        .single();

      if (parentError || !parentComment) {
        console.error("Error fetching parent comment for reply:", parentError?.message || "Parent comment not found");
        return NextResponse.json({ error: "Parent comment not found for reply" }, { status: 404 });
      }
      path = `${parentComment.path}.${user.id}`; // Append current user's ID to parent path
    }

    const commentData: any = {
      post_id: id,
      author_id: user.id,
      content: content.trim(),
      parent_comment_id: parent_comment_id || null,
      path: path,
    }

    const { data: comment, error } = await supabase
      .from("comments")
      .insert(commentData)
      .select(`
        id,
        content,
        created_at,
        parent_comment_id,
        path
      `)
      .single()

    if (error) {
      console.error("Error inserting comment:", error)
      throw error
    }

    // Add author info manually to avoid join issues in response
    const { data: authorProfile } = await supabase.from("profiles").select("id, display_name, photo_url, campus").eq("id", user.id).single()
    const commentWithAuthor = { ...comment, author: authorProfile }

    // Get post author to notify
    const { data: post } = await supabase.from("posts").select("author_id, content").eq("id", id).single()

    if (post && post.author_id !== user.id) {
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()

      await supabase.from("notifications").insert({
        user_id: post.author_id,
        type: "post_comment",
        title: "New Comment",
        message: `${profile?.display_name || "Someone"} commented on your post: "${post.content?.substring(0, 30)}..."`,
        action_url: `/feed`,
        metadata: { post_id: id, comment_id: comment.id },
      })
    }

    // If it's a reply, notify the parent comment author
    if (parent_comment_id) {
      const { data: parentComment } = await supabase
        .from("comments")
        .select("author_id, content")
        .eq("id", parent_comment_id)
        .single()

      if (parentComment && parentComment.author_id !== user.id && parentComment.author_id !== post?.author_id) {
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()

        await supabase.from("notifications").insert({
          user_id: parentComment.author_id,
          type: "comment_reply",
          title: "New Reply",
          message: `${profile?.display_name || "Someone"} replied to your comment: "${parentComment.content?.substring(0, 30)}..."`,
          action_url: `/feed`,
          metadata: { post_id: id, comment_id: comment.id, parent_comment_id },
        })
      }
    }

    // Award 0.2 points for commenting
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
      }).catch(e => console.error("[akurwas] Points award background error:", e))
    } catch (pointsError) {
      console.error("[akurwas] Error awarding comment points:", pointsError)
    }

    return NextResponse.json({ comment: commentWithAuthor, message: "Comment added successfully" })
  } catch (error: any) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 })
  }
}

// DELETE - Remove user's own comment from a post
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
