import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: profileId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Verify friendship or if it's self
    let isAuthorized = user.id === profileId
    
    if (!isAuthorized) {
        const { data: friendship } = await supabase
          .from("friendships")
          .select("status")
          .or(`and(user_id.eq.${user.id},friend_id.eq.${profileId}),and(user_id.eq.${profileId},friend_id.eq.${user.id})`)
          .eq("status", "accepted")
          .maybeSingle()
        
        if (friendship) isAuthorized = true
    }

    if (!isAuthorized) {
        return NextResponse.json({ posts: [], media: [] })
    }

    // 2. Fetch posts
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .eq("author_id", profileId)
      .order("created_at", { ascending: false })

    if (postsError) throw postsError

    // 3. Extract media (images and videos)
    const media: any[] = []
    posts?.forEach(post => {
        if (post.image_url) media.push({ url: post.image_url, type: 'image', post_id: post.id, created_at: post.created_at })
        if (post.video_url) media.push({ url: post.video_url, type: 'video', post_id: post.id, created_at: post.created_at })
        if (Array.isArray(post.media_urls)) {
            post.media_urls.forEach((url: string) => {
                media.push({ url, type: 'image', post_id: post.id, created_at: post.created_at })
            })
        }
    })

    return NextResponse.json({
      posts: posts || [],
      media: media.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    })
  } catch (error: any) {
    console.error("[Profile Activity API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
