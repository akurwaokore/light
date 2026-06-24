import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

const AUTO_APPROVE_KEY = "marketplace_auto_approve"

async function readAutoApprove(supabase: any): Promise<boolean> {
  const { data } = await supabase.from("system_settings").select("value").eq("key", AUTO_APPROVE_KEY).maybeSingle()
  const v = data?.value
  return v === true || v === "true"
}

export async function GET() {
  // is_admin is sufficient to manage the marketplace (RBAC permission seeding
  // is optional); super-admins/permission-holders also pass.
  const { authorized, supabase, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  const { data: products, error } = await supabase!
    .from("products")
    .select(`*, seller:profiles(id, display_name, email)`)
    .order("created_at", { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })

  const autoApprove = await readAutoApprove(supabase!)
  return NextResponse.json({
    products: products || [],
    settings: { marketplace_auto_approve: autoApprove },
  })
}

export async function PATCH(request: Request) {
  const { authorized, supabase, status } = await checkAdminAccess()
  if (!authorized) return unauthorizedResponse(status!)

  try {
    const body = await request.json()

    // Product update (status / fields / inventory).
    if (body.productId) {
      const updateData: any = { updated_at: new Date().toISOString() }
      if (body.status) updateData.status = body.status
      if (body.title) updateData.title = body.title
      if (body.description) updateData.description = body.description
      if (body.price != null) updateData.price = body.price
      if (body.quantity != null) updateData.quantity = body.quantity
      if (body.category) updateData.category = body.category
      if (body.product_type) updateData.product_type = body.product_type
      if (body.image_urls) updateData.image_urls = body.image_urls
      if (body.images) updateData.image_urls = body.images

      const { data, error } = await supabase!
        .from("products").update(updateData).eq("id", body.productId).select().single()
      if (error) return new NextResponse(error.message, { status: 500 })
      return NextResponse.json(data)
    }

    // Auto-approval toggle (stored as a key/value row).
    if (typeof body.marketplace_auto_approve === "boolean") {
      const { data: existing } = await supabase!
        .from("system_settings").select("id").eq("key", AUTO_APPROVE_KEY).maybeSingle()
      if (existing) {
        await supabase!.from("system_settings")
          .update({ value: body.marketplace_auto_approve, updated_at: new Date().toISOString() })
          .eq("key", AUTO_APPROVE_KEY)
      } else {
        await supabase!.from("system_settings")
          .insert({ key: AUTO_APPROVE_KEY, value: body.marketplace_auto_approve })
      }
      return NextResponse.json({ marketplace_auto_approve: body.marketplace_auto_approve })
    }

    return new NextResponse("Invalid request body", { status: 400 })
  } catch (error: any) {
    return new NextResponse(error.message, { status: 400 })
  }
}

export async function POST(request: Request) {
  const { authorized, supabase, status, user } = (await checkAdminAccess()) as any
  if (!authorized) return unauthorizedResponse(status!)

  try {
    const body = await request.json()
    const { data: product, error } = await supabase!
      .from("products")
      .insert([{
        title: body.title,
        description: body.description,
        price: body.price,
        quantity: body.quantity ?? 1,
        product_type: body.product_type,
        image_urls: body.image_url ? [body.image_url] : (body.image_urls || []),
        seller_name: body.seller_name,
        seller_email: body.seller_email,
        category: body.category || body.category_id || "General",
        seller_id: user?.id,
        status: body.status || "approved",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select().single()

    if (error) return new NextResponse(error.message, { status: 500 })
    return NextResponse.json(product)
  } catch (error: any) {
    return new NextResponse(error.message, { status: 400 })
  }
}
