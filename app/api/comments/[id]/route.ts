import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// PUT - Update comment
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 })
    }

    const { data: comment, error } = await supabase
      .from("comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("author_id", user.id) // Ensure user owns the comment
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ comment, message: "Comment updated successfully" })
  } catch (error: any) {
    console.error("Error updating comment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete comment
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase.from("comments").delete().eq("id", id).eq("author_id", user.id) // Ensure user owns the comment

    if (error) throw error

    return NextResponse.json({ message: "Comment deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting comment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
