"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Plus, Edit2, Trash2, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Permission {
  id: string
  label: string
  description: string
}

interface Role {
  id: string
  name: string
  description: string
  users: number
  permissions: string[]
}

export default function PermissionsManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch("/api/admin/roles"),
        fetch("/api/admin/permissions"),
      ])

      if (!rolesRes.ok || !permsRes.ok) throw new Error("Failed to fetch data")

      const [rolesData, permsData] = await Promise.all([
        rolesRes.json(),
        permsRes.json(),
      ])

      setRoles(rolesData)
      setAllPermissions(permsData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load roles and permissions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return

    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())

      toast({ title: "Success", description: "Role deleted successfully" })
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      })
    }
  }

  const handleSaveRole = async (role: Partial<Role>) => {
    try {
      const url = role.id ? `/api/admin/roles/${role.id}` : "/api/admin/roles"
      const method = role.id ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(role),
      })

      if (!res.ok) throw new Error(await res.text())

      toast({
        title: "Success",
        description: `Role ${role.id ? "updated" : "created"} successfully`,
      })
      setExpandedRole(null)
      setEditingRole(null)
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save role",
        variant: "destructive",
      })
    }
  }

  const togglePermission = (role: Role, permId: string) => {
    const newPermissions = role.permissions.includes(permId)
      ? role.permissions.filter((p) => p !== permId)
      : [...role.permissions, permId]
    
    // We update the local state for immediate feedback if expanded
    setRoles(roles.map(r => r.id === role.id ? { ...r, permissions: newPermissions } : r))
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Permissions & Roles</h1>
          <p className="text-muted-foreground">Manage user roles and access permissions</p>
        </div>
        <Button 
            className="gap-2"
            onClick={() => {
                const newRole: Partial<Role> = { name: "", description: "", permissions: [] };
                setEditingRole(newRole);
                setExpandedRole("new");
            }}
        >
          <Plus className="h-4 w-4" />
          New Role
        </Button>
      </div>

      {/* New Role Form */}
      {expandedRole === "new" && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Create New Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Name</label>
              <Input 
                placeholder="e.g. Moderator" 
                value={editingRole?.name}
                onChange={e => setEditingRole({...editingRole, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                placeholder="Describe what this role can do" 
                value={editingRole?.description}
                onChange={e => setEditingRole({...editingRole, description: e.target.value})}
              />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Permissions:</p>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {allPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center gap-2">
                    <Checkbox 
                        id={`new-${permission.id}`}
                        checked={editingRole?.permissions?.includes(permission.id)} 
                        onCheckedChange={(checked) => {
                            const perms = editingRole?.permissions || [];
                            setEditingRole({
                                ...editingRole,
                                permissions: checked 
                                    ? [...perms, permission.id]
                                    : perms.filter(p => p !== permission.id)
                            })
                        }}
                    />
                    <label htmlFor={`new-${permission.id}`} className="text-sm cursor-pointer">{permission.label}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => { setExpandedRole(null); setEditingRole(null); }}>Cancel</Button>
              <Button onClick={() => handleSaveRole(editingRole!)}>Create Role</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles
          </CardTitle>
          <CardDescription>Define and manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map((role) => (
              <Card key={role.id} className="border">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{role.name}</h3>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary">{role.users} users</Badge>
                        <Badge variant="outline">{role.permissions.length} permissions</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {role.name !== "super_admin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Permissions List */}
                  {expandedRole === role.id && (
                    <div className="mt-4 border-t pt-4">
                      <div className="grid gap-4 mb-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role Name</label>
                            <Input 
                                value={role.name}
                                onChange={e => setRoles(roles.map(r => r.id === role.id ? {...r, name: e.target.value} : r))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea 
                                value={role.description}
                                onChange={e => setRoles(roles.map(r => r.id === role.id ? {...r, description: e.target.value} : r))}
                            />
                        </div>
                      </div>
                      
                      <p className="mb-3 text-sm font-medium">Permissions:</p>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {allPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center gap-2">
                            <Checkbox 
                                id={`${role.id}-${permission.id}`}
                                checked={role.permissions.includes(permission.id)} 
                                onCheckedChange={() => togglePermission(role, permission.id)}
                            />
                            <label htmlFor={`${role.id}-${permission.id}`} className="text-sm cursor-pointer">{permission.label}</label>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={() => setExpandedRole(null)}>Cancel</Button>
                        <Button onClick={() => handleSaveRole(role)}>Save Changes</Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>User Assignments</CardTitle>
          <CardDescription>Assign roles to users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* This part still needs a real users API to be fully connected */}
              <TableRow>
                <TableCell>Admin User</TableCell>
                <TableCell>admin@alumniconnect.com</TableCell>
                <TableCell>
                  <Badge>Super Admin</Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground italic" colSpan={4}>
                    User assignment functionality coming soon...
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
