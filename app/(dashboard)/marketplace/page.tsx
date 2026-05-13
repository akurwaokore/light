"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Search, Plus, ImageIcon, User, Clock, Package, Share2, ShieldCheck } from "lucide-react"
import { ProductFormComponent } from "@/components/marketplace/product-form"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { CheckoutDialog } from "@/components/marketplace/checkout-dialog"
import { toast } from "sonner"

const currencies = [
  { code: "KSH", label: "KSH (Kenya)", symbol: "KSh", rate: 1 },
  { code: "USD", label: "USD (US Dollar)", symbol: "$", rate: 0.0065 },
  { code: "EUR", label: "EUR (Euro)", symbol: "€", rate: 0.006 },
  { code: "TZS", label: "TZS (Tanzania)", symbol: "TSh", rate: 16.5 },
  { code: "UGX", label: "UGX (Uganda)", symbol: "USh", rate: 24.5 },
]

const productImages: Record<string, string> = {
  "MacBook Pro 2020": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop&q=80",
  "iPhone 13 Pro": "https://images.unsplash.com/photo-1632633173522-47456de71b76?w=400&h=400&fit=crop&q=80",
  "Office Desk Chair": "https://images.unsplash.com/photo-1580480055273-228ba630e2f8?w=400&h=400&fit=crop&q=80",
  "Business Textbooks Bundle": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=400&fit=crop&q=80",
  "Web Development Services": "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=400&fit=crop&q=80",
  "Business Consulting": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=400&fit=crop&q=80",
  "Graphic Design Services": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop&q=80",
  "Personal Fitness Training": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop&q=80",
}

const categories = [
  { label: "Electronics", value: "Electronics" },
  { label: "Services", value: "Services" },
  { label: "Vehicles", value: "Vehicles" },
  { label: "Real Estate", value: "Real Estate" },
  { label: "Fashion", value: "Fashion" },
  { label: "Books & Media", value: "Books & Media" },
  { label: "Furniture", value: "Furniture" },
  { label: "Home & Garden", value: "Home & Garden" },
  { label: "Other", value: "Other" },
]

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedCurrency, setSelectedCurrency] = useState<string>("KSH")
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [checkoutProduct, setCheckoutProduct] = useState<any>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const url = `/api/marketplace/products?status=approved${selectedCategory !== "all" ? `&category=${selectedCategory}` : ""}`
      const response = await fetch(url)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("[akurwas] Error fetching products:", error)
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getCategoryLabel = (value: string) => {
    const cat = categories.find((c) => c.value === value)
    return cat?.label || value
  }

  const getImageUrl = (product: any) => {
    if (productImages[product.title]) return productImages[product.title]
    const images = product.image_urls || product.images
    if (images && images.length > 0) {
      const img = images[0]
      if (img.startsWith("/placeholder")) return getCategoryImage(product.category)
      return img
    }
    return getCategoryImage(product.category)
  }

  const getCategoryImage = (category: string) => {
    const normalizedCategory = category?.toLowerCase()
    const categoryImages: Record<string, string> = {
      electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop&q=80",
      services: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=400&fit=crop&q=80",
      vehicles: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop&q=80",
      real_estate: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=400&fit=crop&q=80",
      fashion: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop&q=80",
      books: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop&q=80",
      furniture: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&q=80",
      "home & garden": "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=400&fit=crop&q=80",
      other: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=400&fit=crop&q=80",
    }
    return categoryImages[normalizedCategory] || categoryImages.other
  }

  const formatPrice = (price: number, fromCurrency = "KES") => {
    const targetCurrency = currencies.find((c) => c.code === selectedCurrency)
    if (!targetCurrency) return `KSh ${price.toLocaleString()}`
    
    let priceInKSH = price
    if (fromCurrency === "USD") priceInKSH = price * 154

    const convertedPrice = priceInKSH * targetCurrency.rate
    return `${targetCurrency.symbol} ${convertedPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const handleShareToFeed = async (product: any) => {
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `Check out this ${product.product_type} on the marketplace: ${product.title}! \n\nPrice: ${formatPrice(product.price, product.currency || "USD")}\n\n${product.description.substring(0, 100)}...`,
          visibility: "public",
          image_url: getImageUrl(product)
        }),
      })
      if (response.ok) toast.success("Shared to feed successfully!")
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Alumni Marketplace</h1>
          <p className="mt-1 text-muted-foreground">Buy and sell with the alumni community</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-[600px]">
              <ProductFormComponent
                productType="product"
                onSuccess={() => {
                  setIsProductDialogOpen(false)
                  fetchProducts()
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Service</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-[600px]">
              <ProductFormComponent
                productType="service"
                onSuccess={() => {
                  setIsServiceDialogOpen(false)
                  fetchProducts()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {checkoutProduct && (
        <CheckoutDialog
          product={checkoutProduct}
          open={isCheckoutOpen}
          onOpenChange={(open) => {
            setIsCheckoutOpen(open)
            if (!open) {
              // Only clear the product after a small delay to allow dialog close animation
              setTimeout(() => setCheckoutProduct(null), 300)
            }
          }}
          onSuccess={() => {
            fetchProducts()
          }}
          formatPrice={formatPrice}
        />
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search marketplace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square animate-pulse bg-muted" />
              <CardContent className="space-y-3 p-4">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-5 animate-pulse rounded bg-muted" />
                <div className="h-4 animate-pulse rounded bg-muted" />
                <div className="h-6 w-24 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">No listings found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const imageUrl = getImageUrl(product)
            return (
              <Card key={product.id} className="overflow-hidden transition-all hover:shadow-lg">
                <div className="relative aspect-square bg-muted">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <Badge variant="secondary" className="mb-2">
                    {getCategoryLabel(product.category)}
                  </Badge>
                  {product.product_type === "service" && (
                    <Badge variant="outline" className="mb-2 ml-2">
                      <Package className="mr-1 h-3 w-3" /> Service
                    </Badge>
                  )}
                  <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                  <p className="mt-3 font-serif text-xl font-bold text-primary">
                    {formatPrice(product.price, product.currency || "USD")}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {product.seller_name || product.seller?.display_name || "Alumni"}
                      {product.seller?.membership_tier && <ShieldCheck className="h-3 w-3 text-primary" />}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatTimeAgo(product.created_at)}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      className="flex-1 rounded-xl shadow-md active:scale-95 transition-transform" 
                      onClick={() => {
                        console.log("[Marketplace] Opening checkout for product:", product)
                        setCheckoutProduct(product)
                        setIsCheckoutOpen(true)
                      }}
                    >
                      Buy Now
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl" onClick={() => handleShareToFeed(product)} title="Share to Feed">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
