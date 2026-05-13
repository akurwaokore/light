import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, scheduled_at, duration_minutes = 60, event_id, group_id } = body

    // Generate a unique Google Meet link (placeholder - in production, integrate with Google Calendar API)
    const meetCode = `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 10)}`
    const googleMeetLink = `https://meet.google.com/${meetCode}`

    // Update event or group meeting with Google Meet link
    if (event_id) {
      const { error } = await supabase
        .from("events")
        .update({ google_meet_link: googleMeetLink })
        .eq("id", event_id)
        .eq("organizer_id", user.id)

      if (error) throw error

      return NextResponse.json({ google_meet_link: googleMeetLink, event_id })
    }

    if (group_id) {
      const { data: meeting, error } = await supabase
        .from("group_meetings")
        .insert({
          group_id,
          title,
          description,
          scheduled_at,
          duration_minutes,
          google_meet_link: googleMeetLink,
          created_by: user.id,
          status: "scheduled",
        })
        .select()
        .single()

      if (error) throw error

      // Notify all group members
      const { data: members } = await supabase.from("group_members").select("user_id").eq("group_id", group_id)

      if (members) {
        for (const member of members) {
          if (member.user_id !== user.id) {
            await supabase.from("notifications").insert({
              user_id: member.user_id,
              type: "meet_invitation",
              title: "New Meeting Scheduled",
              message: `You're invited to "${title}" on ${new Date(scheduled_at).toLocaleString()}`,
              link: googleMeetLink,
              metadata: { meeting_id: meeting.id, group_id },
            })
          }
        }
      }

      return NextResponse.json({ google_meet_link: googleMeetLink, meeting })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("[akurwas] Error creating Google Meet:", error)
    return NextResponse.json({ error: "Failed to create Google Meet" }, { status: 500 })
  }
}
