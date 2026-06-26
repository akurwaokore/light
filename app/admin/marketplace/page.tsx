"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ShoppingBag, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Search, 
  DollarSign, 
  User, 
  Tag,
  Settings2,
  AlertCircle,
  ThumbsUp
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { ProductFormComponent } from "@/components/marketplace/product-form"

export default function MarketplaceManagement() {
  const [products, setProducts] = useState<any[]>([])
  const [settings, setSettings] = useState({ marketplace_auto_approve: false })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("all")

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    category_id: "",
    product_type: "product",
    image_url: "",
    video_url: "",
    seller_name: "",
    seller_email: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/marketplace")
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        setSettings(data.settings || { marketplace_auto_approve: false })
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast.error("Failed to load marketplace data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAutoApprove = async (checked: boolean) => {
    try {
      const response = await fetch("/api/admin/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketplace_auto_approve: checked }),
      })

      if (response.ok) {
        setSettings({ ...settings, marketplace_auto_approve: checked })
        toast.success(`Auto-approval turned ${checked ? "ON" : "OFF"}`)
      } else {
        toast.error("Failed to update settings")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          status: "approved",
          created_at: new Date().toISOString()
        }),
      })

      if (response.ok) {
        toast.success("Product listed successfully")
        setIsDialogOpen(false)
        setFormData({ 
          title: "", 
          price: "", 
          description: "", 
          category_id: "", 
          product_type: "product",
          image_url: "",
          video_url: "",
          seller_name: "",
          seller_email: ""
        })
        fetchData()
      } else {
        const errorData = await response.text()
        toast.error(`Failed to list product: ${errorData || "Unknown error"}`)
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch("/api/admin/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, status }),
      })
      if (response.ok) {
        const updatedProduct = await response.json()
        setProducts(products.map((p) => (p.id === id ? updatedProduct : p)))
        toast.success(`Product status set to ${status}`)
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      toast.error("Status update failed")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this listing?")) return

    try {
      const response = await fetch(`/api/admin/marketplace/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setProducts(products.filter((p) => p.id !== id))
        toast.success("Product removed from marketplace")
      }
    } catch (error) {
      toast.error("Deletion failed")
    }
  }

  const filteredProducts = (products || []).filter((product) => {
    if (!product) return false;
    
    const matchesSearch = (product.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.seller_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.seller?.display_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeTab === "pending") return matchesSearch && (product.status === "pending" || product.status === "pending_approval")
    if (activeTab === "approved") return matchesSearch && (product.status === "approved")
    return matchesSearch
  })

  const pendingCount = products.filter(p => p.status === "pending" || p.status === "pending_approval").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Marketplace Management</h1>
          <p className="text-muted-foreground">Approve listings and manage alumni e-commerce</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Marketplace Product</DialogTitle>
                <DialogDescription>Manually create a pre-approved alumni listing.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProduct} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Product Title</Label>
                  <Input 
                    id="title" 
                    required 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (KES)</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      required 
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <select 
                      id="type"
                      title="Product Type"
                      className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                      value={formData.product_type}
                      onChange={e => setFormData({...formData, product_type: e.target.value})}
                    >
                      <option value="product">Product</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select 
                    id="category"
                    title="Product Category"
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                    value={formData.category_id}
                    onChange={e => setFormData({...formData, category_id: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Books & Media">Books & Media</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Services">Services</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Creative">Creative</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seller_name">Seller Name</Label>
                    <Input 
                      id="seller_name" 
                      placeholder="e.g., Ali Hassan"
                      value={formData.seller_name}
                      onChange={e => setFormData({...formData, seller_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller_email">Seller Email</Label>
                    <Input 
                      id="seller_email" 
                      type="email"
                      placeholder="ali@example.com"
                      value={formData.seller_email}
                      onChange={e => setFormData({...formData, seller_email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input 
                    id="image_url" 
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url}
                    onChange={e => setFormData({...formData, image_url: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video_url">Video URL (YouTube/Vimeo)</Label>
                  <Input 
                    id="video_url" 
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.video_url}
                    onChange={e => setFormData({...formData, video_url: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea 
                    id="desc" 
                    required 
                    className="min-h-[100px]"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  List Product
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-4 w-4" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="auto-approve">Auto-Approve</Label>
                <p className="text-xs text-muted-foreground">Approve new listings automatically</p>
              </div>
              <Switch 
                id="auto-approve" 
                checked={settings.marketplace_auto_approve}
                onCheckedChange={handleToggleAutoApprove}
              />
            </div>
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground mb-1">
                <AlertCircle className="h-3 w-3" />
                Info
              </div>
              When OFF, all new listings will be marked as "Pending" and require manual review.
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Marketplace Inventory
              </CardTitle>
              <Badge variant="outline">{products.length} Total Items</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title or seller..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending" className="relative">
                    Pending
                    {pendingCount > 0 && (
                      <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                        {pendingCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Product Details</TableHead>
                    <TableHead>Seller Info</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-muted-foreground">Fetching marketplace inventory...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                        No listings found in this category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-base">{product.title}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">{product.description}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {product.seller_name || product.seller?.display_name || "Official Store"}
                            </div>
                            {(product.seller_email || product.seller?.email) && (
                              <span className="text-xs text-muted-foreground ml-5">
                                {product.seller_email || product.seller?.email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center font-semibold text-primary">
                            <DollarSign className="h-3.5 w-3.5" />
                            {product.price?.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="capitalize">{product.category || "General"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="capitalize"
                            variant={
                              product.status === "approved" ? "default" : 
                              (product.status === "pending" || product.status === "pending_approval") ? "secondary" : 
                              "destructive"
                            }
                          >
                            {product.status?.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {(product.status === "pending" || product.status === "pending_approval") && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleUpdateStatus(product.id, "approved")} 
                                title="Approve"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {product.status === "approved" && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleUpdateStatus(product.id, "pending_approval")} 
                                title="Revoke Approval"
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => {
                                setSelectedProduct(product);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(product.id)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductFormComponent 
              productType={selectedProduct.product_type} 
              editMode={true} 
              existingProduct={{
                ...selectedProduct,
                images: selectedProduct.image_urls || []
              }}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                fetchData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
