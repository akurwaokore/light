import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const { id } = params

    const { data: comments, error } = await supabase
      .from("product_comments")
      .select(`
        id,
        content,
        created_at,
        author:profiles(id, display_name, photo_url)
      `)
      .eq("product_id", id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ comments: comments || [] })
  } catch (error: any) {
    console.error("Error fetching product comments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { content } = await request.json()
    if (!content) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 })

    const { data: comment, error } = await supabase
      .from("product_comments")
      .insert({
        product_id: id,
        author_id: user.id,
        content
      })
      .select(`
        id,
        content,
        created_at,
        author:profiles(id, display_name, photo_url)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ comment })
  } catch (error: any) {
    console.error("Error adding product comment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
