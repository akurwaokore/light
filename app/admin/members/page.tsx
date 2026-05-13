"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
  UserPlus, 
  Download, 
  Mail, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  ShieldAlert,
  Loader2,
  Filter,
  Users,
  Trophy
} from "lucide-react"
import { toast } from "sonner"

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [membershipFilter, setMembershipFilter] = useState("all")
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, premium: 0 })

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/members")
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
        
        // Calculate stats
        const active = data.filter((m: any) => m.status === 'active').length
        const pending = data.filter((m: any) => m.status === 'pending').length
        const premium = data.filter((m: any) => m.membership_tier !== 'free').length
        setStats({ total: data.length, active, pending, premium })
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
      toast.error("Failed to load members")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this member?")) return

    try {
      const response = await fetch(`/api/admin/members/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success("Member deleted successfully")
        setMembers(members.filter((m) => m.id !== id))
      } else {
        toast.error("Failed to delete member")
      }
    } catch (error) {
      console.error("Failed to delete member:", error)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (response.ok) {
        const updatedMember = await response.json()
        setMembers(members.map((m) => (m.id === id ? updatedMember : m)))
        toast.success(`Member status updated to ${status}`)
      }
    } catch (error) {
      console.error("Failed to update member:", error)
      toast.error("Failed to update status")
    }
  }

  const toggleAdmin = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_admin: !currentStatus }),
      })
      if (response.ok) {
        const updatedMember = await response.json()
        setMembers(members.map((m) => (m.id === id ? updatedMember : m)))
        toast.success(currentStatus ? "Admin rights removed" : "Admin rights granted")
      }
    } catch (error) {
      console.error("Failed to update admin status:", error)
    }
  }

  const filteredMembers = members.filter((member) => {
    const name = member.display_name || member.full_name || ""
    const email = member.email || ""
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) || email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || member.status === statusFilter
    const matchesMembership = membershipFilter === "all" || 
      (membershipFilter === "premium" ? member.membership_tier !== 'free' : member.membership_tier === 'free')
    return matchesSearch && matchesStatus && matchesMembership
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Members Directory</h1>
          <p className="text-muted-foreground">Manage alumni profiles, permissions, and status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info("Exporting CSV...")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex flex-row items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-full"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Alumni</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-row items-center gap-4">
            <div className="bg-green-500/10 p-2 rounded-full"><CheckCircle className="h-5 w-5 text-green-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Active</p>
              <p className="text-xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-row items-center gap-4">
            <div className="bg-yellow-500/10 p-2 rounded-full"><Mail className="h-5 w-5 text-yellow-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Pending</p>
              <p className="text-xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-row items-center gap-4">
            <div className="bg-purple-500/10 p-2 rounded-full"><Trophy className="h-5 w-5 text-purple-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Premium</p>
              <p className="text-xl font-bold">{stats.premium}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
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
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={membershipFilter} onValueChange={setMembershipFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Membership" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium/Paid</SelectItem>
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
                  <TableHead>Member Details</TableHead>
                  <TableHead>Batch / Campus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Fetching live alumni data...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <p className="text-muted-foreground text-lg">No members found matching your criteria.</p>
                      <Button variant="link" onClick={() => {setSearchQuery(""); setStatusFilter("all"); setMembershipFilter("all")}}>
                        Clear all filters
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={member.photo_url} />
                            <AvatarFallback className="bg-primary/5 text-primary">
                              {(member.display_name || member.full_name || "U")
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="font-semibold leading-none mb-1">
                              {member.display_name || member.full_name || "Anonymous Member"}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{member.graduation_year || "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">{member.campus || "Not set"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="capitalize"
                          variant={
                            member.status === "active" ? "default" : member.status === "pending" ? "secondary" : "destructive"
                          }
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize border-primary/20 text-primary">
                          {member.membership_tier || "free"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                           {member.is_hiring && <Badge className="bg-blue-600">Hiring</Badge>}
                           {member.open_to_work && <Badge variant="secondary" className="bg-green-600 text-white">Open to Work</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.is_admin ? (
                          <Badge className="bg-amber-500 hover:bg-amber-600 border-0 flex w-fit gap-1 items-center">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground px-2 italic">Standard</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Administrative Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/members/${member.id}`} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                Full Profile View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info(`Email composer for ${member.email} coming soon`)}>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Private Message
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleAdmin(member.id, member.is_admin)}>
                              {member.is_admin ? (
                                <>
                                  <ShieldAlert className="mr-2 h-4 w-4 text-red-500" />
                                  Revoke Admin Status
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />
                                  Make Administrator
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {member.status === "pending" ? (
                              <>
                                <DropdownMenuItem
                                  className="text-green-600 font-medium"
                                  onClick={() => handleUpdateStatus(member.id, "active")}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve Member
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleUpdateStatus(member.id, "suspended")}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject & Suspend
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateStatus(member.id, member.status === "active" ? "suspended" : "active")
                                }
                              >
                                {member.status === "active" ? (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4 text-orange-500" />
                                    Suspend Account
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                    Restore Account
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive font-medium" onClick={() => handleDelete(member.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Permanently
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
    </div>
  )
}
