import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: categories, error } = await supabase
      .from("product_categories")
      .select("*")
      .eq("is_active", true)
      .order("name")

    if (error) throw error

    return NextResponse.json({ categories: categories || [] })
  } catch (error) {
    console.error("[akurwas] Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  try {
    const { authorized, supabase, status } = await checkAdminAccess("manage_categories")
    if (!authorized) return unauthorizedResponse(status!)

    const body = await request.json()
    const { name, description, productType } = body

    const { data: category, error: insertError } = await supabase!
      .from("product_categories")
      .insert({
        name,
        description,
        product_type: productType || "product",
        is_active: true,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error("[akurwas] Error creating category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
