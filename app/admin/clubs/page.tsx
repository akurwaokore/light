"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  MoreHorizontal, 
  Plus, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Users,
  Loader2,
  Filter,
  MessageSquare
} from "lucide-react"
import { toast } from "sonner"
import { EditClubDialog } from "@/components/admin/clubs/edit-club-dialog"
import { CreateClubDialog } from "@/components/admin/clubs/create-club-dialog"

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedClub, setSelectedClub] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [userId, setUserId] = useState<string | undefined>()

  useEffect(() => {
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    setIsLoading(true)
    try {
      // First get user from clubs API (it returns userId)
      const clubsRes = await fetch("/api/clubs")
      if (clubsRes.ok) {
        const clubsData = await clubsRes.json()
        if (clubsData?.userId) setUserId(clubsData.userId)
      }

      const response = await fetch("/api/admin/clubs")
      if (response.ok) {
        const data = await response.json()
        setClubs(data || [])
      } else {
        setClubs([])
      }
    } catch (error) {
      console.error("Failed to fetch clubs:", error)
      toast.error("Failed to load clubs data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/clubs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (response.ok) {
        const updatedClub = await response.json()
        setClubs(clubs.map((c) => (c.id === id ? updatedClub : c)))
        toast.success(`Club ${status === 'active' ? 'activated' : 'updated'}`)
      }
    } catch (error) {
      console.error("Failed to update club status:", error)
      toast.error("Update failed")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this club?")) return

    try {
      const response = await fetch(`/api/admin/clubs/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setClubs(clubs.filter((c) => c.id !== id))
        toast.success("Club deleted successfully")
      }
    } catch (error) {
      console.error("Failed to delete club:", error)
      toast.error("Deletion failed")
    }
  }

  const filteredClubs = (clubs || []).filter((club) => {
    const name = club.name || ""
    const description = club.description || ""
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || club.status === statusFilter
    const matchesCategory = categoryFilter === "all" || club.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Clubs & Groups</h1>
          <p className="text-muted-foreground">Manage alumni chapters, interest groups, and specialized communities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info("Exporting clubs list...")}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Club
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or keyword..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                  <SelectItem value="Regional">Regional</SelectItem>
                  <SelectItem value="Interest">Interest</SelectItem>
                  <SelectItem value="Batch">Batch-wise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[350px]">Club Name & Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground text-sm font-medium">Syncing with live database...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredClubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                      {searchQuery ? "No clubs matching your search." : "Your database is currently empty of clubs."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClubs.map((club) => (
                    <TableRow key={club.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Users className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <p className="font-semibold truncate">{club.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{club.description || "No description provided"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize border-primary/20 text-primary">
                          {club.category || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {club.members_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="capitalize"
                          variant={
                            club.status === "active" ? "default" : club.status === "pending" ? "secondary" : "outline"
                          }
                        >
                          {club.status || "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(club.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Club Management</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toast.info(`Viewing details for ${club.name}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedClub(club)
                              setIsEditDialogOpen(true)
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Configuration
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info(`Broadcast to members of ${club.name}`)}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Message Members
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {club.status === "pending" ? (
                              <>
                                <DropdownMenuItem
                                  className="text-green-600 font-medium"
                                  onClick={() => handleUpdateStatus(club.id, "active")}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve Group
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 font-medium"
                                  onClick={() => handleUpdateStatus(club.id, "inactive")}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Decline Group
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateStatus(club.id, club.status === "active" ? "inactive" : "active")
                                }
                              >
                                {club.status === "active" ? (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4 text-orange-500" />
                                    Deactivate Group
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                    Re-activate Group
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive font-medium" onClick={() => handleDelete(club.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedClub && (
        <EditClubDialog
          club={selectedClub}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={fetchClubs}
        />
      )}

      <CreateClubDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchClubs}
        userId={userId}
      />
    </div>
  )
}
