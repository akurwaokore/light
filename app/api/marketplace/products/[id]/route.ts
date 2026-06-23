import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { normalizeMarketplaceProduct } from "@/lib/marketplace"

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 })
    }

    const { data: product, error } = await supabase
      .from("products")
      .select(`
        *,
        seller:profiles(id, display_name, email, photo_url)
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return NextResponse.json({ product: normalizeMarketplaceProduct(product) })
  } catch (error) {
    console.error("[akurwas] Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const updateData = { ...body }
    if (updateData.category) {
      updateData.category = updateData.category.toLowerCase()
    }

    const { data: product, error: updateError } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .eq("seller_id", user.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ product: normalizeMarketplaceProduct(product) })
  } catch (error) {
    console.error("[akurwas] Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, price, category, images } = body

    const { data: existingProduct, error: fetchError } = await supabase
      .from("products")
      .select("seller_id")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    if (existingProduct.seller_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized - not your product" }, { status: 403 })
    }

    // Get auto-approval setting
    const { data: settings } = await supabase
      .from("system_settings")
      .select("marketplace_auto_approve")
      .single()

    const autoApprove = settings?.marketplace_auto_approve === true;

    const { data: product, error: updateError } = await supabase
      .from("products")
      .update({
        title,
        description,
        price,
        category: category?.toLowerCase(),
        image_urls: images || body.image_urls,
        status: autoApprove ? "approved" : "pending_approval",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    const { data: admins } = await supabase.from("profiles").select("id").in("role", ["admin", "super_admin"])

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        type: "product_update",
        title: "Product Updated",
        message: `${title} has been updated and needs re-approval`,
        action_url: `/admin/products/${id}`,
        metadata: { productId: id, action: "update" },
      }))

      await supabase.from("notifications").insert(notifications)
    }

    return NextResponse.json({ product: normalizeMarketplaceProduct(product) })
  } catch (error) {
    console.error("[akurwas] Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}
