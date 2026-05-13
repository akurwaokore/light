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

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "super_admin", "editor"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { productId, status, rejectionReason } = body

    const updateData: any = {
      status,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    }

    if (status === "rejected" && rejectionReason) {
      updateData.rejection_reason = rejectionReason
    }

    const { data: product, error: updateError } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .select()
      .single()

    if (updateError) throw updateError

    // Create approval record
    await supabase.from("product_approvals").insert({
      product_id: productId,
      reviewer_id: user.id,
      status: status === "approved" ? "approved" : "rejected",
      notes: rejectionReason,
    })

    // Create notification for seller
    if (product?.seller_id) {
      await supabase.from("notifications").insert({
        user_id: product.seller_id,
        type: "general",
        title: status === "approved" ? "Product Approved" : "Product Rejected",
        message: status === "approved" 
          ? `Your product "${product.title}" has been approved and is now live.`
          : `Your product "${product.title}" was not approved. Reason: ${rejectionReason || "No reason provided."}`,
        link: "/marketplace/my-listings",
        metadata: { 
          product_id: productId, 
          real_type: status === "approved" ? "product_approved" : "product_rejected" 
        },
      })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("[akurwas] Error approving product:", error)
    return NextResponse.json({ error: "Failed to approve product" }, { status: 500 })
  }
}
