"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Trash2, FileText } from "lucide-react"
import { CvViewButton } from "@/components/careers/cv-view-button"
import { toast } from "sonner"

type Cv = { id: string; file_name: string; label: string | null; is_primary: boolean; created_at: string }

// Manage multiple CVs: list, set primary, delete.
export function CvManager() {
  const [cvs, setCvs] = useState<Cv[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const res = await fetch("/api/members/me/cvs")
    if (res.ok) setCvs((await res.json()).cvs || [])
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const setPrimary = async (id: string) => {
    await fetch(`/api/members/me/cvs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_primary: true }),
    })
    load()
  }
  const remove = async (id: string) => {
    const res = await fetch(`/api/members/me/cvs/${id}`, { method: "DELETE" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data.error || "Could not delete")
      return
    }
    toast.success("CV deleted")
    load()
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading your CVs…</p>
  if (cvs.length === 0) return <p className="text-sm text-muted-foreground">You have no CVs yet. Upload one above.</p>

  return (
    <div className="space-y-2">
      {cvs.map((cv) => (
        <Card key={cv.id}>
          <CardContent className="flex items-center gap-3 p-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">{cv.label || cv.file_name}</p>
              <p className="text-xs text-muted-foreground">{new Date(cv.created_at).toLocaleDateString()}</p>
            </div>
            {cv.is_primary ? (
              <Badge className="gap-1"><Star className="h-3 w-3" /> Primary</Badge>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setPrimary(cv.id)}>Set primary</Button>
            )}
            <CvViewButton cvId={cv.id} />
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(cv.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
