import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const type = searchParams.get("type")
    const experience = searchParams.get("experience")
    const remote = searchParams.get("remote")
    const salaryMin = searchParams.get("salaryMin")
    // Strip characters that are meaningful in PostgREST filters to prevent
    // filter injection through the .or() ilike below.
    const safeSearch = search ? search.replace(/[,()*:%\\]/g, " ").trim() : ""

    let query = supabase
      .from("jobs")
      .select(
        `
        id,
        title,
        description,
        requirements,
        responsibilities,
        company,
        location,
        logo_url,
        employment_type,
        experience_level,
        salary_min,
        salary_max,
        skills,
        application_deadline,
        is_remote,
        status,
        created_at,
        posted_by,
        category_id,
        poster:profiles(id, display_name, photo_url)
      `,
      )
      .order("created_at", { ascending: false })

    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      query = query.or(`status.eq.active,posted_by.eq.${user.id}`)
    } else {
      query = query.eq("status", "active")
    }

    if (safeSearch) {
      query = query.or(`title.ilike.%${safeSearch}%,company.ilike.%${safeSearch}%,location.ilike.%${safeSearch}%`)
    }

    if (category) query = query.eq("category_id", category)
    if (type) query = query.eq("employment_type", type)
    if (experience) query = query.eq("experience_level", experience)
    if (remote === "true") query = query.eq("is_remote", true)
    if (salaryMin && !Number.isNaN(Number(salaryMin))) query = query.gte("salary_max", Number(salaryMin))

    const { data: jobs, error } = await query

    if (error) {
      console.error("[akurwas] Unexpected error in jobs route:", error)
      return NextResponse.json({ jobs: [] })
    }

    return NextResponse.json({ jobs: jobs || [] })
  } catch (error) {
    console.error("[akurwas] Unexpected error in jobs route:", error)
    return NextResponse.json({ jobs: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const { data: profile } = await supabase
      .from("profiles")
      .select("membership_tier, is_admin")
      .eq("id", userData.user.id)
      .single()

    const isPremium = profile?.membership_tier !== 'free' && profile?.membership_tier !== 'guest';
    const isAdmin = profile?.is_admin === true;

    if (!isPremium && !isAdmin) {
      return NextResponse.json({ 
        error: "Only subscribed members can post job openings. Please upgrade your membership." 
      }, { status: 403 });
    }

    // Auto-approval: admins always go live; everyone else goes live too when
    // the jobs_auto_approve system setting is on (key/value row).
    const { data: jobsAutoRow } = await supabase
      .from("system_settings").select("value").eq("key", "jobs_auto_approve").maybeSingle()
    const jobsAutoApprove = jobsAutoRow ? (jobsAutoRow.value === true || jobsAutoRow.value === "true") : false
    const initialStatus = (isAdmin || jobsAutoApprove) ? "active" : "pending_approval"

    const { data: job, error } = await supabase
      .from("jobs")
      .insert([
        {
          title: body.title,
          description: body.description,
          requirements: body.requirements,
          responsibilities: body.responsibilities,
          company: body.company,
          location: body.location,
          employment_type: body.employment_type,
          experience_level: body.experience_level,
          salary_min: (body.salary_min && !isNaN(parseInt(body.salary_min))) ? parseInt(body.salary_min) : null,
          salary_max: (body.salary_max && !isNaN(parseInt(body.salary_max))) ? parseInt(body.salary_max) : null,
          skills: Array.isArray(body.skills) ? body.skills : [],
          application_deadline: body.application_deadline || null,
          is_remote: body.is_remote || false,
          status: initialStatus,
          posted_by: userData.user.id,
          category_id: body.category_id,
          logo_url: body.logo_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("[akurwas] Unexpected error creating job:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Award loyalty points for posting a job opening.
    if (job?.[0]?.id) {
      await supabase.rpc("award_points", {
        p_user_id: userData.user.id,
        p_points: 5,
        p_type: "earn",
        p_reason: "Posted a job",
        p_reference_id: job[0].id,
        p_reference_type: "job",
        p_metadata: {},
      })
    }

    return NextResponse.json({ job: job?.[0] }, { status: 201 })
  } catch (error) {
    console.error("[akurwas] Unexpected error creating job:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
