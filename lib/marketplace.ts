export type MarketplaceSeller = {
  id: string | null
  display_name: string
  email: string | null
  photo_url: string | null
}

export type MarketplaceProduct = {
  id: string
  title: string
  description: string
  price: number
  currency: string
  category: string
  product_type: "product" | "service"
  status: string
  created_at: string
  updated_at: string
  seller_id: string | null
  seller_name: string | null
  seller_email: string | null
  quantity: number
  in_stock: boolean
  image_urls: string[]
  images: string[]
  seller: MarketplaceSeller
}

export function normalizeMarketplaceProduct(product: any): MarketplaceProduct {
  const images = Array.isArray(product?.image_urls)
    ? product.image_urls
    : Array.isArray(product?.images)
      ? product.images
      : product?.image_url
        ? [product.image_url]
        : []

  const sellerSource = Array.isArray(product?.seller) ? product.seller[0] : product?.seller

  return {
    id: product.id,
    title: product.title ?? "",
    description: product.description ?? "",
    price: Number(product.price ?? 0),
    currency: product.currency ?? "KES",
    category: product.category ?? "Other",
    product_type: product.product_type === "service" ? "service" : "product",
    status: product.status ?? "draft",
    created_at: product.created_at ?? new Date(0).toISOString(),
    updated_at: product.updated_at ?? product.created_at ?? new Date(0).toISOString(),
    seller_id: product.seller_id ?? sellerSource?.id ?? null,
    seller_name: product.seller_name ?? sellerSource?.display_name ?? "Alumni",
    seller_email: product.seller_email ?? sellerSource?.email ?? null,
    quantity: Number(product.quantity ?? 1),
    in_stock: Number(product.quantity ?? 1) > 0,
    image_urls: images,
    images,
    seller: {
      id: product.seller_id ?? sellerSource?.id ?? null,
      display_name: product.seller_name ?? sellerSource?.display_name ?? "Alumni",
      email: product.seller_email ?? sellerSource?.email ?? null,
      photo_url: sellerSource?.photo_url ?? null,
    },
  }
}
