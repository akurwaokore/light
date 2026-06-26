import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

/**
 * Leaderboard rankings.
 *
 * `user_points` is a VIEW over `profiles.points`, so a PostgREST relational
 * embed (`profiles!inner(...)`) through it is unreliable — PostgREST can't
 * always detect a foreign-key relationship across a view, which previously made
 * this endpoint return an empty list. We instead read the ranking straight from
 * `profiles` (the real source of `points`), with a two-step `user_points`
 * fallback for older schemas where the points column lives elsewhere.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const searchParams = request.nextUrl.searchParams
  const limit = Number.parseInt(searchParams.get("limit") || "50")
  const campus = searchParams.get("campus")

  const shape = (rows: any[]) =>
    (rows || []).map((p: any, index: number) => ({
      id: p.id,
      user_id: p.id,
      display_name: p.display_name || p.full_name || "Alumni Member",
      full_name: p.full_name || p.display_name || "Alumni Member",
      photo_url: p.photo_url || p.avatar_url || null,
      avatar_url: p.avatar_url || p.photo_url || null,
      campus: p.campus || null,
      graduation_year: p.graduation_year || null,
      points: p.points ?? 0,
      rank: index + 1,
      total_transactions: p.total_transactions ?? 0,
    }))

  try {
    // Primary path: rank directly off profiles.points.
    let query = supabase
      .from("profiles")
      .select("id, full_name, display_name, avatar_url, photo_url, campus, graduation_year, points")
      .order("points", { ascending: false, nullsFirst: false })
      .limit(limit)

    if (campus && campus !== "all") query = query.eq("campus", campus)

    const { data, error } = await query
    if (!error && data) {
      return NextResponse.json({ leaderboard: shape(data) })
    }
    if (error) console.error("[Leaderboard API] profiles path failed, falling back:", error.message)
  } catch (err: any) {
    console.error("[Leaderboard API] profiles path threw:", err?.message)
  }

  // Fallback path: two-step over the user_points view, joined in JS.
  try {
    const { data: points, error: pErr } = await supabase
      .from("user_points")
      .select("user_id, total_points")
      .order("total_points", { ascending: false })
      .limit(limit)
    if (pErr) throw pErr

    const ids = Array.from(new Set((points || []).map((p: any) => p.user_id).filter(Boolean)))
    let profilesById: Record<string, any> = {}
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, display_name, avatar_url, photo_url, campus, graduation_year")
        .in("id", ids)
      profilesById = Object.fromEntries((profs || []).map((p: any) => [p.id, p]))
    }

    let merged = (points || []).map((row: any) => ({
      ...(profilesById[row.user_id] || { id: row.user_id }),
      id: row.user_id,
      points: row.total_points || 0,
    }))
    if (campus && campus !== "all") merged = merged.filter((m: any) => m.campus === campus)

    return NextResponse.json({ leaderboard: shape(merged) })
  } catch (err: any) {
    console.error("[Leaderboard API] fallback failed:", err?.message)
    return NextResponse.json({ leaderboard: [] }, { status: 200 })
  }
}
