import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function GET() {
  const { authorized, supabase, status } = await checkAdminAccess("manage_donations")
  if (!authorized) return unauthorizedResponse(status!)

  const { data: campaigns, error } = await supabase!
    .from("donation_campaigns")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(campaigns)
}

export async function POST(request: Request) {
  const { authorized, supabase, status } = await checkAdminAccess("manage_donations")
  if (!authorized) return unauthorizedResponse(status!)

  const body = await request.json()

  const { data, error } = await supabase!
    .from("donation_campaigns")
    .insert([
      {
        ...body,
        updated_at: new Date().toISOString()
      }
    ])
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}
