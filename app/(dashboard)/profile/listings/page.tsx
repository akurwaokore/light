"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  ShoppingBag, 
  Briefcase, 
  Plus, 
  Eye, 
  Trash2, 
  Loader2, 
  AlertCircle,
  FileText,
  UserCheck,
  Edit2,
  Receipt,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { ProductFormComponent } from "@/components/marketplace/product-form"

export default function MyListingsPage() {
  const [listings, setListings] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<any>(null)

  useEffect(() => {
    fetchMyData()
  }, [])

  const fetchMyData = async () => {
    setLoading(true)
    try {
      const [listingsRes, jobsRes, purchasesRes] = await Promise.all([
        fetch("/api/profile/listings"),
        fetch("/api/profile/jobs"),
        fetch("/api/marketplace/purchases"),
      ])
      
      if (listingsRes.ok) setListings(await listingsRes.json())
      if (jobsRes.ok) setJobs(await jobsRes.json())
      if (purchasesRes.ok) {
        const purchasesData = await purchasesRes.json()
        setPurchases(purchasesData.purchases || [])
      }
    } catch (error) {
      toast.error("Failed to load your listings")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">My Marketplace & Jobs</h1>
        <p className="mt-1 text-muted-foreground">Manage your products, services, and job openings</p>
      </div>

      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList>
          <TabsTrigger value="marketplace" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Job Postings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-4">
          <div className="flex justify-end">
            <Button asChild className="gap-2">
              <Link href="/marketplace?action=add">
                <Plus className="h-4 w-4" /> New Listing
              </Link>
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.length === 0 ? (
              <Card className="md:col-span-2 lg:col-span-3 py-12 text-center">
                <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground">You haven't posted any products or services yet.</p>
              </Card>
            ) : (
              listings.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                    )}
                    <Badge className="absolute top-2 right-2 capitalize" variant={item.status === 'approved' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-bold text-lg line-clamp-1">{item.title}</h3>
                    <p className="text-primary font-bold">KES {item.price?.toLocaleString()}</p>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                         <Link href={`/marketplace/${item.id}`}><Eye className="h-3.5 w-3.5" /> View</Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-1"
                        onClick={() => {
                          setSelectedListing(item);
                          setIsEditDialogOpen(true);
                        }}
                      >
                         <Edit2 className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <CardTitle className="text-xl">Purchase History</CardTitle>
              </div>
              <CardDescription>Products and services you have bought through the marketplace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {purchases.length === 0 ? (
                <p className="text-sm text-muted-foreground">No purchases recorded yet.</p>
              ) : (
                purchases.map((purchase) => (
                  <div key={purchase.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{purchase.product?.title || "Archived listing"}</p>
                      <p className="text-sm text-muted-foreground">
                        Bought on {new Date(purchase.created_at).toLocaleDateString()} for KES {Number(purchase.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Seller: {purchase.product?.seller?.display_name || "Unknown seller"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {purchase.status}
                      </Badge>
                      {purchase.product?.id && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/marketplace/${purchase.product.id}`}>
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            View Listing
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex justify-end">
            <Button asChild className="gap-2">
              <Link href="/careers?tab=post-job">
                <Plus className="h-4 w-4" /> Post a Job
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            {jobs.length === 0 ? (
              <Card className="py-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground">You haven't posted any job openings yet.</p>
              </Card>
            ) : (
              jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-serif">{job.title}</CardTitle>
                        <CardDescription>{job.company} • {job.location}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                         <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>{job.status}</Badge>
                         <Button variant="outline" size="sm" asChild>
                           <Link href={`/profile/listings/jobs/${job.id}/applications`} className="gap-2">
                              <UserCheck className="h-4 w-4" />
                              View Applications
                           </Link>
                         </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <ProductFormComponent 
              productType={selectedListing.product_type || "product"} 
              editMode={true} 
              existingProduct={{
                ...selectedListing,
                images: selectedListing.image_urls || selectedListing.images || []
              }}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                fetchMyData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
