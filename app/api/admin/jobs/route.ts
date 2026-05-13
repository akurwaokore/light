import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function GET() {
  const { authorized, supabase, status } = await checkAdminAccess("manage_jobs")
  if (!authorized) return unauthorizedResponse(status!)

  const { data: jobs, error } = await supabase!
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(jobs)
}

export async function POST(request: Request) {
  const { authorized, supabase, status } = await checkAdminAccess("manage_jobs")
  if (!authorized) return unauthorizedResponse(status!)

  const body = await request.json()

  const { data, error } = await supabase!
    .from("jobs")
    .insert([body])
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}
