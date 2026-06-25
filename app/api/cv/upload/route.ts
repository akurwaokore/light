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

    const formData = await request.formData()
    const file = (formData.get("file") || formData.get("cv")) as File
    const jsonData = (formData.get("data") as string) || JSON.stringify({})
    const preferredFileName = formData.get("preferredFileName") as string

    if (!file) {
      return NextResponse.json({ error: "No CV file provided" }, { status: 400 })
    }

    const data = JSON.parse(jsonData)
    console.log("[CV API] Received data:", data)

    // Extract fields from structured data
    const {
      fullName,
      phone,
      email,
      city,
      country,
      linkedIn,
      graduationYear,
      education,
      workExperience,
      technicalSkills,
      softSkills,
      soft_skills,
      languages,
      certifications,
      volunteerExperience,
      declaration
    } = data

    // 1. Upload CV to the PRIVATE `cvs` bucket (never public). A unique path per
    // upload so multiple CVs don't overwrite each other.
    const fileExt = file.name.split(".").pop()
    const safeFileName = preferredFileName || `${Date.now()}.${fileExt}`
    const filePath = `${user.id}/${Date.now()}-${safeFileName}`

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(filePath, file, { upsert: false })

    if (uploadError) {
      console.error("[CV API] Storage upload error:", uploadError)
      return NextResponse.json({ error: uploadError.message || "Failed to upload CV file" }, { status: 500 })
    }

    // Private bucket: no public URL. Access is via short-lived signed URLs.
    const publicUrl = null

    // 2. Update CV profile in database (schema-tolerant)
    const parsedGraduationYear = Number.parseInt(String(graduationYear || ""), 10)
    const safeGraduationYear = Number.isFinite(parsedGraduationYear) ? parsedGraduationYear : null
    const safeSoftSkills = Array.isArray(softSkills)
      ? softSkills
      : Array.isArray(soft_skills)
      ? soft_skills
      : []

    // user_name / user_email are NOT NULL in the DB. Fall back to the uploader's
    // profile + auth email so an upload never fails on a missing name/email.
    const { data: uploaderProfile } = await supabase
      .from("profiles")
      .select("display_name, full_name, email")
      .eq("id", user.id)
      .maybeSingle()

    const payload = {
      user_id: user.id,
      user_name: fullName || uploaderProfile?.full_name || uploaderProfile?.display_name || user.email || "Alumnus",
      user_email: email || uploaderProfile?.email || user.email || "",
      file_url: publicUrl,
      storage_path: filePath,
      file_name: safeFileName,
      phone: phone || null,
      city: city || null,
      country: country || null,
      linkedin_url: linkedIn || null,
      graduation_year: safeGraduationYear,
      technical_skills: Array.isArray(technicalSkills) ? technicalSkills : [],
      soft_skills: safeSoftSkills,
      education_json: Array.isArray(education) ? education : [],
      experience_json: Array.isArray(workExperience) ? workExperience : [],
      languages_json: Array.isArray(languages) ? languages : [],
      certifications_json: Array.isArray(certifications) ? certifications : [],
      volunteer_json: Array.isArray(volunteerExperience) ? volunteerExperience : [],
      declaration_accepted: !!declaration,
      status: 'active',
      updated_at: new Date().toISOString()
    }

    // Multiple CVs allowed: always insert a new row. Make it primary if it's
    // the user's first CV.
    const { count: existingCount } = await supabase
      .from("cvs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)

    const { data: cvRecord, error: insertError } = await supabase
      .from("cvs")
      .insert({ ...payload, is_primary: (existingCount || 0) === 0, label: data.label || safeFileName })
      .select("id")
      .single()

    if (insertError) {
      console.error("[CV API] Database write error:", insertError)
      return NextResponse.json({ error: insertError.message || "Failed to save CV data" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      file_name: safeFileName,
      cv_id: cvRecord?.id,
    })
  } catch (error) {
    console.error("[CV API] Error processing CV submission:", error)
    return NextResponse.json({ error: "Failed to process CV submission" }, { status: 500 })
  }
}
