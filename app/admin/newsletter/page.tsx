"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Mail, Plus, Send, BarChart3, Trash2, Loader2, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function NewsletterManagement() {
  const [newsletters, setNewsletters] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ totalSubscribers: 0, activeSubscribers: 0, newslettersSent: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"newsletters" | "subscribers">("newsletters")
  
  // New Newsletter Form
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ title: "", subject: "", content: "" })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/newsletter")
      if (response.ok) {
        const data = await response.json()
        setNewsletters(data.newsletters || [])
        setStats(data.stats)
      }
    } catch (error) {
      toast.error("Failed to load newsletter data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status: "draft" }),
      })

      if (response.ok) {
        toast.success("Newsletter draft saved")
        setIsDialogOpen(false)
        setFormData({ title: "", subject: "", content: "" })
        fetchData()
      }
    } catch (err) {
      toast.error("Error creating newsletter")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this newsletter?")) return
    try {
      const response = await fetch(`/api/admin/newsletter/${id}`, { method: "DELETE" })
      if (response.ok) {
        setNewsletters(newsletters.filter((n) => n.id !== id))
        toast.success("Newsletter removed")
      } else {
        toast.error("Delete failed")
      }
    } catch (error) {
      toast.error("Delete failed")
    }
  }

  const handleSend = async (id: string) => {
    if (!confirm("Send this newsletter to all active subscribers?")) return
    try {
      const response = await fetch(`/api/admin/newsletter/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      })
      if (response.ok) {
        const updated = await response.json()
        setNewsletters(newsletters.map((n) => (n.id === id ? updated : n)))
        toast.success("Newsletter sent")
        fetchData()
      } else {
        toast.error("Send failed")
      }
    } catch (error) {
      toast.error("Send failed")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">Newsletter Management</h1>
          <p className="text-muted-foreground">Direct communication with your alumni network</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              New Newsletter
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Compose Newsletter</DialogTitle>
              <DialogDescription>Design a message to send to all active subscribers.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Internal Title</Label>
                <Input 
                  required 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. March 2026 Alumni Update" 
                />
              </div>
              <div className="space-y-2">
                <Label>Email Subject Line</Label>
                <Input 
                  required 
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  placeholder="The subject alumni will see in their inbox" 
                />
              </div>
              <div className="space-y-2">
                <Label>Newsletter Content (Markdown/HTML supported)</Label>
                <Textarea 
                  required 
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="min-h-48" 
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Save Draft
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSubscribers}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.activeSubscribers} verified & active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.newslettersSent}</div>
            <p className="text-xs text-muted-foreground mt-1">Platform outreach</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Avg Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">49%</div>
            <p className="text-xs text-muted-foreground mt-1">Engagement benchmark</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Avg Click Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">15%</div>
            <p className="text-xs text-muted-foreground mt-1">Actionable traffic</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Platform Communication
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Newsletter Title</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Fetching newsletter history...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : newsletters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      No newsletters found in the history.
                    </TableCell>
                  </TableRow>
                ) : (
                  newsletters.map((newsletter) => (
                    <TableRow key={newsletter.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-bold">{newsletter.title}</TableCell>
                      <TableCell>{newsletter.recipients || 0}</TableCell>
                      <TableCell>
                        <Badge variant={newsletter.status === "sent" ? "default" : "secondary"} className="capitalize">
                          {newsletter.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {newsletter.sent_at ? new Date(newsletter.sent_at).toLocaleDateString() : "Pending"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {newsletter.status !== "sent" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSend(newsletter.id)}
                              className="gap-1 text-primary hover:bg-primary/10"
                              title="Send to subscribers"
                            >
                              <Send className="h-4 w-4" />
                              Send
                            </Button>
                          )}
                          {newsletter.status === "sent" && (
                            <Button size="icon" variant="ghost" title="View Engagement">
                              <BarChart3 className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(newsletter.id)}
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
