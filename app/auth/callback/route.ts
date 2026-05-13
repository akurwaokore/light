import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/dashboard"

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/auth/reset-password`)
  }

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the user to create/update their profile
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle()

        // Only log actual errors, not "no rows" which is expected
        if (profileCheckError) {
          console.error("[akurwas] Error checking profile:", profileCheckError)
        }

        // Create profile if it doesn't exist
        if (!existingProfile) {
          const profileData = {
            id: user.id,
            email: user.email || "",
            display_name:
              user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Alumni",
            photo_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            graduation_year: user.user_metadata?.graduation_year ? Number(user.user_metadata.graduation_year) : null,
            campus: user.user_metadata?.campus || null,
            status: "active",
            is_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            points: 10,
          }

          const { error: profileError } = await supabase.from("profiles").insert(profileData)

          if (profileError) {
            console.error("[akurwas] Error creating profile:", profileError)
            const { error: upsertError } = await supabase.from("profiles").upsert(profileData, { onConflict: "id" })

            if (upsertError) {
              console.error("[akurwas] Error upserting profile:", upsertError)
              return NextResponse.redirect(
                `${origin}/auth/auth-code-error?error=${encodeURIComponent("Failed to create profile. Please try again.")}`,
              )
            }
          }

          // Award registration points transaction
          try {
            await supabase.rpc("award_points", {
              p_user_id: user.id,
              p_points: 10,
              p_type: "earn",
              p_reason: "Registration Bonus",
              p_metadata: { source: "oauth_callback" },
            })
          } catch (awardError) {
            console.error("[akurwas] Error awarding registration points:", awardError)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error("[akurwas] Error exchanging code for session:", error)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
