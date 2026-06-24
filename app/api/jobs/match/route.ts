import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Deterministic CV<->job matching against the live `jobs` table.
// (The old version hit a nonexistent `job_listings` table and made one GPT call
// per job — a cost/timeout bomb. This scores by skill overlap + experience fit.)
function norm(s: string) {
  return String(s || "").trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { cv_id } = await request.json().catch(() => ({}))

    // Resolve the CV: explicit id, else the user's primary, else newest.
    let cvQuery = supabase.from("cvs").select("id, technical_skills, soft_skills, skills, experience_level").eq("user_id", user.id)
    const { data: cvs } = await cvQuery.order("is_primary", { ascending: false }).order("created_at", { ascending: false })
    const cv = cv_id ? cvs?.find((c: any) => c.id === cv_id) : cvs?.[0]
    if (!cv) return NextResponse.json({ matches: [] })

    const cvSkills = new Set<string>([
      ...(cv.technical_skills || []),
      ...(cv.soft_skills || []),
      ...(cv.skills || []),
    ].map(norm).filter(Boolean))

    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, title, company, location, skills, experience_level, employment_type, salary_min, salary_max")
      .eq("status", "active")

    const matches = (jobs || [])
      .map((job: any) => {
        const reqSkills: string[] = (job.skills || []).map(norm).filter(Boolean)
        const matching = reqSkills.filter((s) => cvSkills.has(s))
        const missing = reqSkills.filter((s) => !cvSkills.has(s))
        const skillScore = reqSkills.length ? (matching.length / reqSkills.length) * 80 : 40
        const expScore = cv.experience_level && job.experience_level
          ? (cv.experience_level === job.experience_level ? 20 : 8)
          : 10
        const score = Math.round(Math.min(100, skillScore + expScore))
        return { job, match_score: score, matching_skills: matching, missing_skills: missing }
      })
      .filter((m) => m.match_score >= 40)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 20)

    return NextResponse.json({ matches })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
