import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { validateEmail } from "@/lib/validation"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      console.error("[Profile API] Error fetching profile:", profileError)
      return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }

    if (!profile) {
      // Create a default profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert([{
          id: user.id,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          email: user.email!,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (createError) {
        console.error("[Profile API] Error creating profile:", createError)
        return NextResponse.json({ error: "Could not initialize profile" }, { status: 500 })
      }
      
      return NextResponse.json({
        ...newProfile,
        email: user.email,
        isAdmin: false
      })
    }

    // Unified admin check: profiles.is_admin OR an admin/super_admin role.
    const { data: roleRows } = await supabase.from("user_roles").select("roles(name)").eq("user_id", user.id)
    const roleNames = (roleRows || []).map((r: any) => (Array.isArray(r.roles) ? r.roles[0]?.name : r.roles?.name)).filter(Boolean)
    const isAdmin = !!profile?.is_admin || roleNames.includes("admin") || roleNames.includes("super_admin")

    return NextResponse.json({
      ...profile,
      email: user.email,
      isAdmin,
    })
  } catch (error) {
    console.error("[akurwas] Error in profile route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
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
    console.log("[Profile API] Received body:", body)

    if (body.email && !validateEmail(body.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    if (
      body.graduationYear &&
      (Number.isNaN(body.graduationYear) ||
        body.graduationYear < 1950 ||
        body.graduationYear > new Date().getFullYear())
    ) {
      return NextResponse.json({ error: "Invalid graduation year" }, { status: 400 })
    }

    if (body.bio && body.bio.length > 500) {
      return NextResponse.json({ error: "Bio must be less than 500 characters" }, { status: 400 })
    }

    // Prepare update object with only provided fields (partial update)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Explicitly handle mapping for all potential frontend field names
    if (body.display_name !== undefined) updateData.display_name = body.display_name
    if (body.displayName !== undefined) updateData.display_name = body.displayName
    
    if (body.full_name !== undefined) updateData.full_name = body.full_name
    if (body.fullName !== undefined) updateData.full_name = body.fullName
    
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.bio !== undefined) updateData.bio = body.bio
    
    if (body.job_title !== undefined) updateData.job_title = body.job_title
    if (body.jobTitle !== undefined) updateData.job_title = body.jobTitle
    
    if (body.company !== undefined) updateData.company = body.company
    if (body.location !== undefined) updateData.location = body.location
    if (body.country !== undefined) updateData.country = body.country
    if (body.city !== undefined) updateData.city = body.city
    
    if (body.linkedin !== undefined) updateData.linkedin = body.linkedin
    if (body.linkedIn !== undefined) updateData.linkedin = body.linkedIn
    
    if (body.is_hiring !== undefined) updateData.is_hiring = body.is_hiring
    if (body.status !== undefined) updateData.status = body.status
    
    if (body.graduation_year !== undefined) updateData.graduation_year = body.graduation_year
    if (body.graduationYear !== undefined) {
      const gYear = body.graduationYear ? Number.parseInt(body.graduationYear.toString()) : null
      updateData.graduation_year = !isNaN(gYear as number) ? gYear : null
    }
    
    if (body.campus !== undefined) updateData.campus = body.campus
    if (body.photo_url !== undefined) updateData.photo_url = body.photo_url
    
    if (body.open_to_work !== undefined) updateData.open_to_work = body.open_to_work
    if (body.openToWork !== undefined) updateData.open_to_work = body.openToWork

    if (
      body.friends_visibility !== undefined &&
      ["public", "friends", "private"].includes(body.friends_visibility)
    ) {
      updateData.friends_visibility = body.friends_visibility
    }

    console.log("[Profile API] Update payload:", updateData)

    // Update profile
    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("[Profile API] Error updating profile:", updateError)
      return NextResponse.json({ error: updateError.message || "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error: any) {
    console.error("[Profile API] unexpected error:", error)
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  return PUT(request)
}
