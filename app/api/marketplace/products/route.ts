import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { validateProductData } from "@/lib/validation"
import { normalizeMarketplaceProduct } from "@/lib/marketplace"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "20"), 100)
    const from = (page - 1) * limit
    const to = from + limit - 1
    const category = searchParams.get("category")
    const statusParam = searchParams.get("status")

    const { data: { user } } = await supabase.auth.getUser()
    
    // Check if user is admin
    let isAdmin = false
    if (user) {
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()
      isAdmin = roleData?.role === 'admin' || roleData?.role === 'super_admin'
    }

    console.log("[akurwas] Fetching products with params:", { category, status: statusParam, isAdmin })

    // If status is provided, use it. Otherwise, default based on role.
    // Non-admins only see approved products by default.
    // Admins see all products if no status is specified, or follow the status param.
    let statusFilter = statusParam;
    if (!statusFilter && !isAdmin) {
      statusFilter = "approved";
    }

    const fetchMarketplaceProducts = async (tableName: string) => {
      let query = supabase
        .from(tableName)
        .select(`
          *,
          seller:profiles(id, display_name, photo_url)
        `)
        .order("created_at", { ascending: false })
        .range(from, to)
      
      if (statusFilter === 'approved' || (statusFilter === 'active')) {
        query = query.or('status.eq.approved,status.eq.active,status.is.null')
      } else if (statusFilter && statusFilter !== 'all') {
        query = query.eq("status", statusFilter)
      }
      // If statusFilter is 'all' or (isAdmin and no statusFilter), we don't apply status filter

      if (category && category !== "all") {
        query = query.eq("category", category)
      }
      return await query
    }

    // Try primary fetch with join
    let { data: products, error } = await fetchMarketplaceProducts("products")

    // If failed, try simplified fetch or fallback table
    if (error || !products) {
      console.log("[akurwas] Primary fetch failed, trying simplified...");
      let query = supabase.from("products").select('*').order("created_at", { ascending: false }).range(from, to);
      
      if (statusFilter === 'approved' || statusFilter === 'active') {
        query = query.or('status.eq.approved,status.eq.active,status.is.null')
      } else if (statusFilter && statusFilter !== 'all') {
        query = query.eq("status", statusFilter)
      }

      const simpleResult = await query;
      products = simpleResult.data;
      error = simpleResult.error;

      if (error || !products || products.length === 0) {
        console.log("[akurwas] Trying fallback table marketplace_products...")
        const fallback = await fetchMarketplaceProducts("marketplace_products")
        if (!fallback.error && fallback.data && fallback.data.length > 0) {
          products = fallback.data
          error = null
        }
      }
    }

    if (error) {
      console.error("[akurwas] Error fetching products:", error)
      return NextResponse.json({ products: [] })
    }

    const normalizedProducts = (products || []).map(normalizeMarketplaceProduct)

    console.log("[akurwas] Products fetched:", normalizedProducts.length)
    return NextResponse.json({
      products: normalizedProducts,
      pagination: {
        page,
        limit,
        hasMore: normalizedProducts.length === limit,
      },
    })
  } catch (error) {
    console.error("[akurwas] Unexpected error fetching products:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ products: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[Marketplace] Creating product with body:", body)

    const price = typeof body.price === 'string' ? Number.parseFloat(body.price) : body.price

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, membership_tier, is_admin")
    .eq("id", userData.user.id)
    .single()

  const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id).maybeSingle()
  const isAdmin = roleData?.role === 'admin' || roleData?.role === 'super_admin' || profile?.is_admin === true;

  // Handle both "category" and "category_id" (used in Admin UI)
  const categoryValue = body.category || body.category_id;

  const validation = validateProductData({
    name: body.title,
    description: body.description,
    price: price,
    category: categoryValue,
  })

    if (!validation.valid) {
      console.warn("[Marketplace] Validation failed:", validation.errors)
      return NextResponse.json({ error: validation.errors.join(", ") }, { status: 400 })
    }

    if (price < 1 || price > 100000000) {
      return NextResponse.json({ error: "Price must be between 1 KES and 100,000,000 KES" }, { status: 400 })
    }

    // Get auto-approval setting (stored as a key/value row in system_settings).
    const { data: settingRow } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "marketplace_auto_approve")
      .maybeSingle()

    // Default to true when the setting hasn't been configured.
    const autoApprove = settingRow ? (settingRow.value === true || settingRow.value === "true") : true

    const sellerName = profile?.display_name || userData.user.user_metadata?.full_name || userData.user.email || "Alumni User"
    const sellerEmail = userData.user.email || null

    const basePayload = {
      title: body.title,
      description: body.description,
      price: price,
      currency: "KES",
      category: categoryValue,
      image_urls: body.image_urls || body.images || (body.image_url ? [body.image_url] : []),
      images: body.image_urls || body.images || (body.image_url ? [body.image_url] : []),
      product_type: body.product_type || "product",
      status: (isAdmin || autoApprove) ? "approved" : "pending_approval",
      seller_id: userData.user.id,
      seller_name: sellerName,
      seller_email: sellerEmail,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const normalizedCategory = typeof categoryValue === "string" ? categoryValue.trim() : categoryValue

    const payloadVariants = [
      basePayload,
      {
        title: basePayload.title,
        description: basePayload.description,
        price: basePayload.price,
        currency: basePayload.currency,
        category: normalizedCategory,
        image_urls: basePayload.image_urls,
        status: basePayload.status,
        seller_id: basePayload.seller_id,
      },
      {
        title: basePayload.title,
        description: basePayload.description,
        price: basePayload.price,
        category: basePayload.category,
        image_urls: basePayload.image_urls,
        seller_id: basePayload.seller_id,
      }
    ]

    let product: any = null
    let lastError: any = null

    for (const payload of payloadVariants) {
      console.log("[Marketplace] Attempting insertion payload:", payload)
      const result = await supabase
        .from("products")
        .insert([payload])
        .select()
        .maybeSingle()

      if (!result.error && result.data) {
      product = normalizeMarketplaceProduct(result.data)
        break
      }

      lastError = result.error
    }

    if (!product) {
      console.error("[akurwas] Error creating product:", lastError)
      return NextResponse.json({ error: lastError?.message || "Failed to create product" }, { status: 500 })
    }

    return NextResponse.json({ product, message: "Product created successfully" }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
