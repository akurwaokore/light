"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function SaveJobButton({ jobId, initialSaved = false }: { jobId: string; initialSaved?: boolean }) {
  const [saved, setSaved] = useState(initialSaved)
  const [busy, setBusy] = useState(false)

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setBusy(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/save`, { method: saved ? "DELETE" : "POST" })
      if (!res.ok) throw new Error("Could not update")
      setSaved(!saved)
      toast.success(saved ? "Removed from saved jobs" : "Job saved")
    } catch {
      toast.error("Could not update saved jobs")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={toggle} disabled={busy} title={saved ? "Unsave" : "Save job"}>
      <Bookmark className={cn("h-4 w-4", saved && "fill-current text-primary")} />
    </Button>
  )
}
