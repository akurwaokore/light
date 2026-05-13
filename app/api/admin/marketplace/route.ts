import { NextResponse } from "next/server"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-auth"

export async function GET() {
  const { authorized, supabase, status } = await checkAdminAccess("manage_marketplace")
  if (!authorized) return unauthorizedResponse(status!)

  console.log("[Admin Marketplace API] Fetching all listings...")

  // Fetch both products and settings
  const [productsRes, settingsRes] = await Promise.all([
    supabase!
      .from("products")
      .select(`
        *,
        seller:profiles(id, display_name, email)
      `)
      .order("created_at", { ascending: false }),
    supabase!
      .from("system_settings")
      .select("marketplace_auto_approve")
      .single()
  ])

  if (productsRes.error) {
    console.error("[Admin Marketplace API] Error fetching products:", productsRes.error)
    return new NextResponse(productsRes.error.message, { status: 500 })
  }

  console.log(`[Admin Marketplace API] Found ${productsRes.data?.length || 0} items`)

  return NextResponse.json({
    products: productsRes.data || [],
    settings: settingsRes.data || { marketplace_auto_approve: false }
  })
}

export async function PATCH(request: Request) {
  const { authorized, supabase, status } = await checkAdminAccess("manage_marketplace")
  if (!authorized) return unauthorizedResponse(status!)

  try {
    const body = await request.json()
    
    // Handle product update (status or other fields)
    if (body.productId) {
      const updateData: any = { updated_at: new Date().toISOString() }
      
      if (body.status) updateData.status = body.status
      if (body.title) updateData.title = body.title
      if (body.description) updateData.description = body.description
      if (body.price) updateData.price = body.price
      if (body.category) updateData.category = body.category
      if (body.product_type) updateData.product_type = body.product_type
      if (body.image_urls) updateData.image_urls = body.image_urls
      if (body.images) updateData.image_urls = body.images // compatibility

      const { data, error } = await supabase!
        .from("products")
        .update(updateData)
        .eq("id", body.productId)
        .select()
        .single()

      if (error) return new NextResponse(error.message, { status: 500 })
      return NextResponse.json(data)
    }

    // Handle auto-approval setting update
    if (typeof body.marketplace_auto_approve === 'boolean') {
      const { data, error } = await supabase!
        .from("system_settings")
        .update({ 
          marketplace_auto_approve: body.marketplace_auto_approve,
          updated_at: new Date().toISOString()
        })
        .eq("id", 1)
        .select()
        .single()

      if (error) return new NextResponse(error.message, { status: 500 })
      return NextResponse.json(data)
    }

    return new NextResponse("Invalid request body", { status: 400 })
  } catch (error: any) {
    return new NextResponse(error.message, { status: 400 })
  }
}

export async function POST(request: Request) {
  const { authorized, supabase, status, user } = (await checkAdminAccess("manage_marketplace")) as any
  if (!authorized) return unauthorizedResponse(status!)

  try {
    const body = await request.json()
    const { data: product, error } = await supabase!
      .from("products")
      .insert([
        {
          title: body.title,
          description: body.description,
          price: body.price,
          product_type: body.product_type,
          image_urls: body.image_url ? [body.image_url] : [],
          seller_name: body.seller_name,
          seller_email: body.seller_email,
          category: body.category || body.category_id || "General",
          seller_id: user?.id,
          status: body.status || "approved",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
      ])
      .select()
      .single()

    if (error) return new NextResponse(error.message, { status: 500 })

    return NextResponse.json(product)
  } catch (error: any) {
    return new NextResponse(error.message, { status: 400 })
  }
}
