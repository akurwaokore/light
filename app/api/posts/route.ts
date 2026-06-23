import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { validatePostContent, sanitizeText } from "@/lib/validation"

// Helper function to transform posts
function transformPosts(posts: any[], user: any) {
  return posts?.map((post: any) => ({
    ...post,
    likes_count: post.reactions?.length || 0,
    user_liked: user ? post.reactions?.some((r: any) => r.user_id === user.id) : false,
    user_reaction: user ? post.reactions?.find((r: any) => r.user_id === user.id)?.reaction_type : null,
    comments_count: typeof post.comments_count === 'number' ? post.comments_count : (post.comments_count?.[0]?.count || 0),
    shares_count: typeof post.shares_count === 'number' ? post.shares_count : (post.shares_count?.[0]?.count || 0),
  })) || []
}

// GET - Fetch posts feed
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "20"), 100)
    const from = (page - 1) * limit
    const to = from + limit - 1

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[akurwas] GET /api/posts - User:", user?.id)

    // Base query: select from posts table
    // Simplest possible query to ensure data is returned
    let query = supabase
      .from("posts")
      .select(
        `
        id,
        content,
        image_url,
        video_url,
        media_urls,
        created_at,
        updated_at,
        author_id,
        visibility,
        status,
        author:profiles(id, display_name, photo_url, job_title, campus, membership_tier),
        reactions:post_reactions(id, reaction_type, user_id),
        recent_comments:comments(
          id,
          content,
          created_at,
          author:profiles(id, display_name, photo_url)
        )
      `,
      )

    // Simplified logic to ensure posts are visible
    // Filter by active status for guest/general, but allow authors to see their own.
    if (user) {
      const { data: friends } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

      const friendIds = friends?.map((f) => (f.user_id === user.id ? f.friend_id : f.user_id)) || []
      const publicAndOwnFilters = [`author_id.eq.${user.id}`, "and(visibility.eq.public,status.eq.active)", "status.is.null"]

      if (friendIds.length > 0) {
        publicAndOwnFilters.push(`and(visibility.eq.friends,status.eq.active,author_id.in.(${friendIds.join(",")}))`)
      }

      query = query.or(publicAndOwnFilters.join(","))
    } else {
      query = query.or("and(visibility.eq.public,status.eq.active),status.is.null")
    }

    const { data: posts, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("[akurwas] Posts query error:", error)
      
      // Fallback for missing columns or schema errors
      const { data: fallbackPosts, error: fallbackError } = await supabase
          .from("posts")
          .select(
            `
            id,
            content,
            image_url,
            created_at,
            updated_at,
            author_id,
            author:profiles(id, display_name, photo_url, job_title, campus),
            reactions:post_reactions(id, reaction_type, user_id)
          `,
          )
          .order("created_at", { ascending: false })
          .range(from, to)
      
      if (fallbackError) {
          console.error("[akurwas] fallback error:", fallbackError)
          return NextResponse.json({ posts: [] })
      }
      return NextResponse.json({ posts: transformPosts(fallbackPosts || [], user) })
    }

    console.log("[akurwas] Found posts:", posts?.length)
    return NextResponse.json({
      posts: transformPosts(posts || [], user),
      pagination: {
        page,
        limit,
        hasMore: posts?.length === limit,
      },
    })
  } catch (error: any) {
    console.error("[akurwas] Error fetching posts:", error)
    return NextResponse.json({ posts: [] })
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, image_url, video_url, media_urls, visibility } = await request.json()

    const validation = validatePostContent(content)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const sanitizedContent = sanitizeText(content)

    // Check system settings for auto-approval
    const { data: settings } = await supabase
      .from("system_settings")
      .select("posts_auto_approve")
      .maybeSingle()

    const autoApprove = settings?.posts_auto_approve !== false

    const { data: post, error } = await supabase
      .from("posts")
      .insert([
        {
          author_id: userData.user.id,
          content: sanitizedContent,
          image_url: image_url || null,
          video_url: video_url || null,
          media_urls: media_urls || [],
          visibility: visibility || "public",
          status: autoApprove ? "active" : "pending_approval",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("[akurwas] Post creation error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: post?.[0], message: "Post created successfully" })
  } catch (error: any) {
    console.error("[akurwas] Error creating post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
