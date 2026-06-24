"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"
import { ApplicationChat } from "@/components/careers/application-chat"
import { toast } from "sonner"

const STATUSES = [
  "pending", "reviewed", "shortlisted", "interview_scheduled",
  "interviewed", "offer_extended", "hired", "rejected",
]

// Poster-side controls for a single application: move pipeline status, reject
// with a reason, and open the recruiting chat thread.
export function ApplicantActions({ applicationId, currentStatus }: { applicationId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus || "pending")
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const update = async (next: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/profile/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, rejection_reason: next === "rejected" ? reason : undefined }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Update failed")
      setStatus(next)
      toast.success(`Marked as ${next.replace("_", " ")}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{status.replace("_", " ")}</Badge>
        <Select value={status} onValueChange={update}>
          <SelectTrigger className="h-8 w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setShowChat((v) => !v)} disabled={saving}>
          <MessageSquare className="mr-1 h-4 w-4" /> {showChat ? "Hide" : "Message"}
        </Button>
      </div>

      {status === "rejected" && (
        <Input
          placeholder="Optional reason (sent to applicant)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => reason && update("rejected")}
          className="h-8"
        />
      )}

      {showChat && <ApplicationChat applicationId={applicationId} />}
    </div>
  )
}
