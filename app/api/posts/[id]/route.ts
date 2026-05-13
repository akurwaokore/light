import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET - Get single post with all details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    const { data: post, error } = await supabase
      .from("posts")
      .select(`
        id,
        content,
        image_url,
        visibility,
        location,
        feeling,
        created_at,
        updated_at,
        shared_post_id,
        author:profiles!posts_author_id_fkey(id, display_name, photo_url, campus, job_title),
        reactions:post_reactions(id, reaction_type, user_id, profiles(display_name, photo_url)),
        shares:post_shares(id, user_id, share_text, created_at, profiles(display_name, photo_url)),
        comments:comments(
          id,
          content,
          created_at,
          author:profiles!comments_author_id_fkey(id, display_name, photo_url, campus)
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    // Get current user to check if they liked it
    const { data: { user } } = await supabase.auth.getUser()

    // Transform post
    const transformedPost = {
        ...post,
        likes_count: post.reactions?.length || 0,
        user_liked: user ? post.reactions?.some((r: any) => r.user_id === user.id) : false,
        user_reaction: user ? post.reactions?.find((r: any) => r.user_id === user.id)?.reaction_type : null,
        comments_count: post.comments?.length || 0,
        shares_count: post.shares?.length || 0,
    }

    return NextResponse.json({ post: transformedPost })
  } catch (error: any) {
    console.error("Error fetching post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update post
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, image_url, visibility, location, feeling } = await request.json()

    const { data: post, error } = await supabase
      .from("posts")
      .update({
        content,
        image_url,
        visibility,
        location,
        feeling,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("author_id", user.id) // Ensure user owns the post
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ post, message: "Post updated successfully" })
  } catch (error: any) {
    console.error("Error updating post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete post
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

    const { error } = await supabase.from("posts").delete().eq("id", id).eq("author_id", user.id) // Ensure user owns the post

    if (error) throw error

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
