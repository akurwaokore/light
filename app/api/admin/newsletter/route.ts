import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function GET() {
  const { authorized, supabase, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const { data: newsletters, error: nError } = await supabase!
    .from("newsletters")
    .select("*")
    .order("created_at", { ascending: false })

  const { count: subscriberCount } = await supabase!
    .from("newsletter_subscribers")
    .select("*", { count: "exact", head: true })

  const { count: activeCount } = await supabase!
    .from("newsletter_subscribers")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  if (nError) return new NextResponse(nError.message, { status: 500 })

  return NextResponse.json({
    newsletters: newsletters || [],
    stats: {
      totalSubscribers: subscriberCount || 0,
      activeSubscribers: activeCount || 0,
      newslettersSent: newsletters?.filter(n => n.status === 'sent').length || 0
    }
  })
}

export async function POST(request: Request) {
  const { authorized, supabase, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const body = await request.json()

  const { data, error } = await supabase!
    .from("newsletters")
    .insert([{ ...body, created_at: new Date().toISOString() }])
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}
