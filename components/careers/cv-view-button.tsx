"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Opens a CV via a short-lived signed URL (private bucket). Falls back to a
// legacy public URL when only cvUrl is available.
export function CvViewButton({
  cvId,
  cvUrl,
  label = "View CV",
  variant = "outline",
  size = "sm",
}: {
  cvId?: string | null
  cvUrl?: string | null
  label?: string
  variant?: "outline" | "default" | "ghost"
  size?: "sm" | "default" | "icon"
}) {
  const [loading, setLoading] = useState(false)

  const open = async () => {
    if (cvId) {
      setLoading(true)
      try {
        const res = await fetch(`/api/cv/${cvId}/signed-url`)
        const data = await res.json()
        if (!res.ok || !data.url) throw new Error(data.error || "Could not open CV")
        window.open(data.url, "_blank", "noopener,noreferrer")
      } catch (e: any) {
        toast.error(e.message)
      } finally {
        setLoading(false)
      }
      return
    }
    if (cvUrl && cvUrl !== "pending") {
      window.open(cvUrl, "_blank", "noopener,noreferrer")
      return
    }
    toast.error("No CV available")
  }

  const disabled = !cvId && (!cvUrl || cvUrl === "pending")
  return (
    <Button variant={variant} size={size} onClick={open} disabled={loading || disabled}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  )
}
