import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

function transformPosts(posts: any[], user: any) {
  return posts?.map((post: any) => {
    const reactions_by_type: Record<string, number> = {}
    post.reactions?.forEach((r: any) => {
      reactions_by_type[r.reaction_type] = (reactions_by_type[r.reaction_type] || 0) + 1
    })
    return {
      ...post,
      likes_count: post.reactions?.length || 0,
      user_liked: user ? post.reactions?.some((r: any) => r.user_id === user.id) : false,
      user_reaction: user ? post.reactions?.find((r: any) => r.user_id === user.id)?.reaction_type : null,
      reactions_count: post.reactions?.length || 0,
      reactions_by_type,
      user_saved: true,
      comments_count: typeof post.comments_count === 'number' ? post.comments_count : (post.comments_count?.[0]?.count || 0),
      shares_count: typeof post.shares_count === 'number' ? post.shares_count : (post.shares_count?.[0]?.count || 0),
    }
  }) || []
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Query saved posts and join with posts details
    const { data: savedPostsData, error } = await supabase
      .from("saved_posts")
      .select(`
        post_id,
        post:posts(
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
        )
      `)
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false })

    if (error) {
      console.error("[Get Saved Posts] Error:", error)
      return NextResponse.json({ posts: [] })
    }

    // Extract the nested post objects and filter out any null/deleted posts
    const posts = savedPostsData
      ?.map((item: any) => item.post)
      .filter((post: any) => !!post) || []

    return NextResponse.json({
      posts: transformPosts(posts, user),
    })
  } catch (error: any) {
    console.error("[Get Saved Posts Handler] Error:", error)
    return NextResponse.json({ posts: [] })
  }
}
