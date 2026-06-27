"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ProductFormComponent } from "@/components/marketplace/product-form"
import { Edit, Package, Wrench, Eye, Clock, CheckCircle, XCircle, Loader2, ShoppingBag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  title: string
  description: string
  price: number
  currency: string
  category: string
  images: string[]
  product_type: "product" | "service"
  status: "draft" | "pending_approval" | "approved" | "rejected" | "sold"
  views: number
  created_at: string
  updated_at: string
}

export function UserListings() {
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchUserListings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/marketplace/products/user")

      if (!response.ok) {
        setProducts([])
        setServices([])
        return
      }

      const data = await response.json()
      const allProducts = data.products || []
      const productsList = allProducts.filter((p: Product) => p.product_type === "product")
      const servicesList = allProducts.filter((p: Product) => p.product_type === "service")

      setProducts(productsList)
      setServices(servicesList)
    } catch (error) {
      console.log("[akurwas] Could not fetch listings:", error)
      setProducts([])
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserListings()
  }, [fetchUserListings])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case "pending_approval":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        )
      case "sold":
        return <Badge variant="outline">Sold</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    setEditingProduct(null)
    fetchUserListings()
    toast({
      title: "Update submitted",
      description: "Your changes have been submitted for admin approval",
    })
  }

  const handleStatusToggle = async (item: Product) => {
    const newStatus = item.status === "sold" ? "approved" : "sold"
    setIsUpdatingStatus(item.id)
    try {
      const response = await fetch(`/api/marketplace/products/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast({
          title: `Marked as ${newStatus === 'sold' ? 'Sold' : 'Available'}`,
          description: `Product status updated successfully.`,
        })
        fetchUserListings()
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not update product status.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(null)
    }
  }

  const renderListingCard = (item: Product) => (
    <Card key={item.id} className="overflow-hidden border-primary/10 hover:border-primary/30 transition-all shadow-sm">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative h-48 w-full md:h-auto md:w-48 bg-muted overflow-hidden">
          <img
            src={item.images?.[0] || "/placeholder.svg?height=200&width=200"}
            alt={item.title}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
          {item.product_type === "service" && (
            <div className="absolute left-2 top-2 rounded bg-accent px-2 py-1 text-[10px] font-bold uppercase text-accent-foreground shadow-sm">
              Service
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base truncate">{item.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
              </div>
              <div className="shrink-0">
                {getStatusBadge(item.status)}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-4">
              <span className="flex items-center gap-1.5 font-medium px-2 py-1 rounded-full bg-muted/50">
                <Eye className="h-3 w-3" />
                {item.views} views
              </span>
              <span className="font-bold text-primary text-sm">
                {item.currency} {item.price.toLocaleString()}
              </span>
              <Badge variant="outline" className="text-[10px] border-primary/20">{item.category}</Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Dialog open={editDialogOpen && editingProduct?.id === item.id} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl h-8 px-3 text-xs" onClick={() => handleEdit(item)}>
                  <Edit className="mr-2 h-3.5 w-3.5" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit {item.product_type === "product" ? "Product" : "Service"}</DialogTitle>
                </DialogHeader>
                {editingProduct && (
                  <ProductFormComponent
                    productType={item.product_type}
                    editMode={true}
                    existingProduct={editingProduct}
                    onSuccess={handleEditSuccess}
                  />
                )}
              </DialogContent>
            </Dialog>

            {(item.status === "approved" || item.status === "sold") && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-xl h-8 px-3 text-xs"
                disabled={isUpdatingStatus === item.id}
                onClick={() => handleStatusToggle(item)}
              >
                {isUpdatingStatus === item.id ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : item.status === "sold" ? (
                  <CheckCircle className="mr-2 h-3.5 w-3.5 text-green-500" />
                ) : (
                  <ShoppingBag className="mr-2 h-3.5 w-3.5" />
                )}
                {item.status === "sold" ? "Mark Available" : "Mark Sold"}
              </Button>
            )}

            {item.status === "pending_approval" && (
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                Awaiting admin approval
              </div>
            )}
            {item.status === "rejected" && (
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                <XCircle className="h-3 w-3" />
                Rejected - Edit to resubmit
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (products.length === 0 && services.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-muted/20">
        <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground font-medium">No listings found.</p>
        <p className="text-xs text-muted-foreground/60 mb-4">Start selling your products or offering services to the community.</p>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="outline" size="sm" className="w-full rounded-xl sm:w-auto" asChild>
            <Link href="/marketplace?action=add-product">Add Product</Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full rounded-xl sm:w-auto" asChild>
            <Link href="/marketplace?action=add-service">Add Service</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Products Section */}
      {products.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">My Products</h3>
            </div>
            <Badge variant="secondary" className="rounded-full">{products.length} items</Badge>
          </div>
          <div className="grid gap-4">{products.map(renderListingCard)}</div>
        </div>
      )}

      {/* Services Section */}
      {services.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex flex-col gap-2 border-t px-1 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-accent" />
              <h3 className="font-bold text-lg">My Services</h3>
            </div>
            <Badge variant="secondary" className="rounded-full">{services.length} items</Badge>
          </div>
          <div className="grid gap-4">{services.map(renderListingCard)}</div>
        </div>
      )}
    </div>
  )
}

import Link from "next/link"
