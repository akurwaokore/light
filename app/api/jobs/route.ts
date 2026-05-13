import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const type = searchParams.get("type")

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

    if (search) {
      query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%,location.ilike.%${search}%`)
    }

    if (category) query = query.eq("category_id", category)
    if (type) query = query.eq("employment_type", type)

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

    // Handle status mapping for constraints
    const initialStatus = isAdmin ? "active" : "pending_approval"

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

    return NextResponse.json({ job: job?.[0] }, { status: 201 })
  } catch (error) {
    console.error("[akurwas] Unexpected error creating job:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
