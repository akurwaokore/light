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
import { Heart, Plus, Edit2, Trash2, Loader2, Search, DollarSign, Target } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function DonationsManagement() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    target_amount: "",
    description: "",
    status: "active"
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/donations")
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error)
      toast.error("Failed to load donation campaigns")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          target_amount: parseFloat(formData.target_amount),
          current_amount: 0,
          created_at: new Date().toISOString()
        }),
      })

      if (response.ok) {
        toast.success("Campaign created successfully")
        setIsDialogOpen(false)
        setFormData({ title: "", target_amount: "", description: "", status: "active" })
        fetchCampaigns()
      } else {
        toast.error("Failed to create campaign")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this campaign?")) return

    try {
      const response = await fetch(`/api/admin/donations/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setCampaigns(campaigns.filter((c) => c.id !== id))
        toast.success("Campaign deleted")
      }
    } catch (error) {
      console.error("Failed to delete campaign:", error)
      toast.error("Deletion failed")
    }
  }

  const filteredCampaigns = campaigns.filter((campaign) => {
    const title = campaign.title || ""
    const description = campaign.description || ""
    return (
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const totalAmount = campaigns.reduce((sum, c) => sum + (c.current_amount || 0), 0)
  const totalTarget = campaigns.reduce((sum, c) => sum + (c.target_amount || 0), 0)
  const progressPercent = totalTarget > 0 ? Math.round((totalAmount / totalTarget) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Donations Management</h1>
          <p className="text-muted-foreground">Track and manage alumni fundraising initiatives</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Donation Campaign</DialogTitle>
              <DialogDescription>Start a new fundraising drive for the community.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCampaign} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Campaign Name</Label>
                <Input 
                  id="title" 
                  required 
                  placeholder="e.g. Alumni Scholarship Fund"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target Amount (KES)</Label>
                <Input 
                  id="target" 
                  type="number" 
                  required 
                  placeholder="e.g. 500000"
                  value={formData.target_amount}
                  onChange={e => setFormData({...formData, target_amount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea 
                  id="desc" 
                  required 
                  placeholder="What is this fundraising for?"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Launch Campaign
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">KES {totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {campaigns.length} campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{campaigns.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Ongoing community drives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{progressPercent}%</div>
            <p className="text-xs text-muted-foreground mt-1">Overall completion rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Heart className="h-5 w-5 text-red-500" />
            Fundraising Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by campaign name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Raised (KES)</TableHead>
                  <TableHead>Target (KES)</TableHead>
                  <TableHead>Launched</TableHead>
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
                        <p className="text-muted-foreground">Syncing donation data...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                      No donation campaigns found in the database.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-base">{campaign.title}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{campaign.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          {campaign.current_amount?.toLocaleString() || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium">
                          <Target className="h-3.5 w-3.5 text-muted-foreground" />
                          {campaign.target_amount?.toLocaleString() || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={campaign.status === "active" ? "default" : "outline"}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => toast.info("Campaign editor coming soon")}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(campaign.id)}
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
  )
}
