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

    // 1. Upload CV to Supabase Storage
    const fileExt = file.name.split(".").pop()
    const safeFileName = preferredFileName || `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `cvs/${user.id}/${safeFileName}`

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      console.error("[CV API] Storage upload error:", uploadError)
      return NextResponse.json({ error: uploadError.message || "Failed to upload CV file" }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(filePath)

    // 2. Update CV profile in database (schema-tolerant)
    const parsedGraduationYear = Number.parseInt(String(graduationYear || ""), 10)
    const safeGraduationYear = Number.isFinite(parsedGraduationYear) ? parsedGraduationYear : null
    const safeSoftSkills = Array.isArray(softSkills)
      ? softSkills
      : Array.isArray(soft_skills)
      ? soft_skills
      : []

    const payload = {
      user_id: user.id,
      user_name: fullName || null,
      user_email: email || null,
      file_url: publicUrl,
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

    const { data: existingCv, error: existingCvError } = await supabase
      .from("cvs")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)

    if (existingCvError) {
      console.error("[CV API] Existing CV lookup error:", existingCvError)
      return NextResponse.json({ error: existingCvError.message || "Failed to process CV data" }, { status: 500 })
    }

    const hasExistingCv = Array.isArray(existingCv) && existingCv.length > 0

    const dbResult = hasExistingCv
      ? await supabase.from("cvs").update(payload).eq("user_id", user.id)
      : await supabase.from("cvs").insert(payload)

    if (dbResult.error) {
      console.error("[CV API] Database write error:", dbResult.error)
      return NextResponse.json({ error: dbResult.error.message || "Failed to save CV data" }, { status: 500 })
    }

    // Get the created CV record to return the ID
    const { data: cvRecord, error: fetchError } = await supabase
      .from("cvs")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching created CV record:", fetchError)
    }

    return NextResponse.json({
      success: true,
      file_url: publicUrl,
      file_name: safeFileName,
      cv_id: cvRecord?.id
    })
  } catch (error) {
    console.error("[CV API] Error processing CV submission:", error)
    return NextResponse.json({ error: "Failed to process CV submission" }, { status: 500 })
  }
}
