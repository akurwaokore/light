import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Add or remove reaction to comment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
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
      .from("comment_reactions")
      .select("id, reaction_type")
      .eq("comment_id", id)
      .eq("user_id", user.id)
      .single()

    if (existing) {
      if (existing.reaction_type === reaction_type) {
        // Same reaction - remove it
        const { error } = await supabase.from("comment_reactions").delete().eq("id", existing.id)

        if (error) throw error
        return NextResponse.json({ message: "Reaction removed" })
      } else {
        // Different reaction - update it
        const { error } = await supabase.from("comment_reactions").update({ reaction_type }).eq("id", existing.id)

        if (error) throw error
        return NextResponse.json({ message: "Reaction updated" })
      }
    } else {
      // New reaction - insert it
      const { error } = await supabase.from("comment_reactions").insert({
        comment_id: id,
        user_id: user.id,
        reaction_type,
      })

      if (error) throw error
      return NextResponse.json({ message: "Reaction added" })
    }
  } catch (error: any) {
    console.error("Error reacting to comment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
