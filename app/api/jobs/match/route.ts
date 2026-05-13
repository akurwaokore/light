import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { generateText } from "ai"

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

    const { cv_id } = await request.json()

    // Get CV data
    const { data: cv, error: cvError } = await supabase.from("cvs").select("*").eq("id", cv_id).single()

    if (cvError || !cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 })
    }

    // Get active job listings
    const { data: jobs, error: jobsError } = await supabase.from("job_listings").select("*").eq("status", "active")

    if (jobsError || !jobs || jobs.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    // Use AI to match jobs
    const matches = []

    for (const job of jobs) {
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt: `Compare this CV with the job listing and provide a match analysis.
        
        CV Skills: ${cv.skills.join(", ")}
        CV Experience Level: ${cv.experience_level}
        CV Summary: ${cv.summary}
        
        Job Title: ${job.title}
        Job Skills Required: ${job.skills_required.join(", ")}
        Job Experience Level: ${job.experience_level}
        Job Description: ${job.description}
        
        Return a JSON object with:
        - match_score: number 0-100
        - matching_skills: array of skills that match
        - missing_skills: array of required skills the candidate lacks
        - match_reasons: array of 2-3 reasons why this is a good/bad match
        - ai_recommendation: brief recommendation (1 sentence)
        
        Return ONLY valid JSON, no markdown or explanation.`,
      })

      try {
        const matchData = JSON.parse(text)

        if (matchData.match_score >= 50) {
          // Save match to database
          const { error: insertError } = await supabase.from("job_matches").upsert({
            cv_id: cv.id,
            job_id: job.id,
            match_score: matchData.match_score,
            matching_skills: matchData.matching_skills,
            missing_skills: matchData.missing_skills,
            match_reasons: matchData.match_reasons,
            ai_recommendation: matchData.ai_recommendation,
          })

          if (!insertError) {
            matches.push({ job, ...matchData })
          }
        }
      } catch (parseError) {
        console.error("[akurwas] Error parsing match result:", parseError)
      }
    }

    return NextResponse.json({ success: true, matches })
  } catch (error) {
    console.error("[akurwas] Error matching jobs:", error)
    return NextResponse.json({ error: "Failed to match jobs" }, { status: 500 })
  }
}
