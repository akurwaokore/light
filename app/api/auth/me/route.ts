import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Returns the currently authenticated user's identity (id + email) and a
// lightweight profile snapshot. Used by client pages that only need to know
// "who am I" without the full profile payload from /api/profile.
export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Best-effort admin flag; ignore lookup errors so auth still succeeds.
    let isAdmin = false
    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()
      isAdmin = roleData?.role === "admin" || roleData?.role === "super_admin"
    } catch {
      // user_roles table may not be configured; non-fatal.
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email ?? null,
        name:
          user.user_metadata?.display_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          (user.email ? user.email.split("@")[0] : null),
        avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
        is_admin: isAdmin,
      },
    })
  } catch (error) {
    console.error("[auth/me] unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
