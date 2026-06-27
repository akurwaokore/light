"use client"

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { CheckoutDialog } from "@/components/marketplace/checkout-dialog"
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"
import {
  ShoppingBag,
  ChevronLeft,
  Heart,
  MessageSquare,
  Phone,
  Package,
  Clock,
  User,
  Loader2,
  ImageIcon,
  Mail,
} from "lucide-react"

interface Product {
  id: string
  title: string
  description: string
  price: number
  currency: string
  category: string
  product_type: "product" | "service"
  quantity: number
  in_stock: boolean
  created_at: string
  seller_id: string | null
  seller_name: string | null
  image_urls: string[]
  seller: { id: string | null; display_name: string; photo_url: string | null }
}

interface Contact {
  name: string
  phone: string | null
  whatsapp: string | null
  email: string | null
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [showingInterest, setShowingInterest] = useState(false)
  const [contact, setContact] = useState<Contact | null>(null)
  const [loadingContact, setLoadingContact] = useState(false)
  const [messaging, setMessaging] = useState(false)
  const { add: addToCart } = useCart()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/marketplace/products/${id}`)
        const data = await res.json()
        if (res.ok && data.product) {
          setProduct(data.product)
        } else {
          toast.error(data.error || "Listing not found")
        }
      } catch {
        toast.error("Could not load this listing")
      } finally {
        setIsLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const formatPrice = (price: number) => `KSh ${Number(price).toLocaleString()}`

  const images = (product?.image_urls || []).filter((u) => u && !u.startsWith("/placeholder"))

  const handleAddToCart = async () => {
    if (!product) return
    try {
      await addToCart(product.id, 1)
      toast.success("Added to cart")
    } catch (e: any) {
      toast.error(e.message || "Could not add to cart")
    }
  }

  const handleShowInterest = async () => {
    if (!product) return
    setShowingInterest(true)
    try {
      const res = await fetch(`/api/marketplace/products/${product.id}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success("The seller has been notified of your interest")
      } else {
        toast.error(data.error || "Could not register interest")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setShowingInterest(false)
    }
  }

  const handleRevealContact = async () => {
    if (!product || contact) return
    setLoadingContact(true)
    try {
      const res = await fetch(`/api/marketplace/products/${product.id}/contact`)
      const data = await res.json()
      if (res.ok) {
        setContact(data)
        if (!data.phone) toast.info("This seller has not added a phone number. Try messaging them.")
      } else {
        toast.error(data.error || "Could not load contact details")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoadingContact(false)
    }
  }

  const handleMessageSeller = async () => {
    if (!product?.seller_id) return
    setMessaging(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: product.seller_id, productId: product.id }),
      })
      const data = await res.json()
      if (res.ok) {
        window.dispatchEvent(
          new CustomEvent("open-chat", {
            detail: { id: data.conversationId, name: product.seller?.display_name || product.seller_name || "Seller" },
          }),
        )
      } else {
        toast.error(data.details || data.error || "Could not start chat")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setMessaging(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="py-20 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold">Listing not found</h2>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/marketplace">Back to Marketplace</Link>
          </Button>
        </div>
      </div>
    )
  }

  const sellerName = product.seller?.display_name || product.seller_name || "Alumni"
  const outOfStock = product.product_type === "product" && product.quantity === 0

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/marketplace">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Marketplace
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
            {images.length > 0 ? (
              <Image
                src={images[activeImage] || images[0]}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {images.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative aspect-square overflow-hidden rounded-lg border transition-all ${
                    activeImage === i ? "ring-2 ring-primary ring-offset-2" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={url} alt={`${product.title} ${i + 1}`} fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {product.category}
              </Badge>
              {product.product_type === "service" && (
                <Badge variant="outline">
                  <Package className="mr-1 h-3 w-3" /> Service
                </Badge>
              )}
              {outOfStock && <Badge variant="destructive">Out of stock</Badge>}
            </div>
            <h1 className="font-serif text-2xl font-bold md:text-3xl">{product.title}</h1>
            <p className="font-serif text-3xl font-bold text-primary">{formatPrice(product.price)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={product.seller?.photo_url || undefined} alt={sellerName} />
                <AvatarFallback>{sellerName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              {sellerName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(product.created_at).toLocaleDateString()}
            </span>
          </div>

          <Separator />

          {/* Primary actions */}
          <div className="flex flex-col gap-2 sm:flex-row">
            {product.product_type === "product" && (
              <>
                <Button className="flex-1" disabled={outOfStock} onClick={handleAddToCart}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {outOfStock ? "Out of stock" : "Add to Cart"}
                </Button>
                <Button variant="secondary" className="flex-1" disabled={outOfStock} onClick={() => setIsCheckoutOpen(true)}>
                  Buy Now
                </Button>
              </>
            )}
          </div>

          {/* Contact / interest — for buying after meeting the seller */}
          <Card className="bg-muted/30">
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-semibold">Prefer to deal in person?</p>
              <p className="text-xs text-muted-foreground">
                Show interest, message the seller, or reveal their contact to arrange payment on meeting.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button variant="outline" onClick={handleShowInterest} disabled={showingInterest}>
                  {showingInterest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className="mr-2 h-4 w-4" />}
                  Show Interest
                </Button>
                <Button variant="outline" onClick={handleMessageSeller} disabled={messaging || !product.seller_id}>
                  {messaging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                  Message
                </Button>
                <Button variant="outline" onClick={handleRevealContact} disabled={loadingContact}>
                  {loadingContact ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                  Reveal Contact
                </Button>
              </div>

              {contact && (
                <div className="space-y-2 rounded-lg border bg-background p-3 text-sm">
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {contact.name}
                  </p>
                  {contact.phone ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-2 font-medium text-primary">
                        <Phone className="h-4 w-4" />
                        {contact.phone}
                      </a>
                      {contact.whatsapp && (
                        <a
                          href={`https://wa.me/${contact.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 sm:py-1 sm:text-xs"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Chat on WhatsApp
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No phone number on file — message them instead.</p>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {contact.email}
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Description</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{product.description}</p>
          </div>
        </div>
      </div>

      {isCheckoutOpen && (
        <CheckoutDialog
          product={product}
          open={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          onSuccess={() => setIsCheckoutOpen(false)}
          formatPrice={formatPrice}
        />
      )}
    </div>
  )
}
